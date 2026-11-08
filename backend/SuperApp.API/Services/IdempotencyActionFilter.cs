using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SuperApp.API.Data;
using SuperApp.API.Models;

namespace SuperApp.API.Services;

/// <summary>
/// Records successful write responses in the same database transaction as their domain changes.
/// The database unique index arbitrates concurrent requests across API instances.
/// </summary>
public sealed class IdempotencyActionFilter(
    AppDbContext db,
    IConfiguration configuration,
    IOptions<Microsoft.AspNetCore.Mvc.JsonOptions> jsonOptions,
    ILogger<IdempotencyActionFilter> logger) : IAsyncActionFilter
{
    public const string AfterCommitCallbacksItemKey = "SuperApp.Idempotency.AfterCommitCallbacks";

    public static void EnqueueAfterCommit(HttpContext httpContext, Func<Task> callback)
    {
        if (httpContext.Items[AfterCommitCallbacksItemKey] is not List<Func<Task>> callbacks)
        {
            callbacks = new List<Func<Task>>();
            httpContext.Items[AfterCommitCallbacksItemKey] = callbacks;
        }
        callbacks.Add(callback);
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var keyText = context.HttpContext.Request.Headers["Idempotency-Key"].FirstOrDefault();
        if (!Guid.TryParse(keyText, out var key))
        {
            context.Result = new BadRequestObjectResult(new { success = false, message = "A valid Idempotency-Key UUID is required." });
            return;
        }

        var userIdText = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!long.TryParse(userIdText, out var userId))
        {
            context.Result = new UnauthorizedObjectResult(new { success = false, message = "Authentication required." });
            return;
        }

        var operation = context.ActionDescriptor.AttributeRouteInfo?.Template
            ?? context.ActionDescriptor.DisplayName
            ?? context.HttpContext.Request.Path.Value
            ?? "unknown";
        var serializedRequest = JsonSerializer.Serialize(new
        {
            Arguments = context.ActionArguments,
            Query = context.HttpContext.Request.Query.OrderBy(pair => pair.Key)
                .ToDictionary(pair => pair.Key, pair => pair.Value.ToString())
        }, jsonOptions.Value.JsonSerializerOptions);
        var requestHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(serializedRequest)));
        var now = DateTime.UtcNow;

        var previous = await db.IdempotencyRecords.AsNoTracking().FirstOrDefaultAsync(record =>
            record.UserId == userId && record.Operation == operation && record.RequestKey == key.ToString());
        if (previous is not null && previous.ExpiresAt > now)
        {
            context.Result = previous.ResponseStatusCode == 0
                ? new ConflictObjectResult(new { success = false, message = "A request with this key is still in progress." })
                : ReplayOrConflict(previous, requestHash);
            return;
        }

        var retentionDays = configuration.GetValue<int>("Idempotency:RetentionDays");
        if (retentionDays <= 0)
            throw new InvalidOperationException("Idempotency:RetentionDays must be positive.");

        try
        {
            if (previous is not null)
            {
                var expired = await db.IdempotencyRecords.FirstAsync(record => record.Id == previous.Id);
                db.IdempotencyRecords.Remove(expired);
                await db.SaveChangesAsync(context.HttpContext.RequestAborted);
            }

            var reservation = new IdempotencyRecord
            {
                UserId = userId,
                Operation = operation,
                RequestKey = key.ToString(),
                RequestHash = requestHash,
                ResponseStatusCode = 0,
                ResponseJson = string.Empty,
                CreatedAt = now,
                ExpiresAt = now.AddDays(retentionDays)
            };
            db.IdempotencyRecords.Add(reservation);
            await db.SaveChangesAsync(context.HttpContext.RequestAborted);

            var executed = await next();
            if (executed.Exception is not null && !executed.ExceptionHandled)
            {
                db.IdempotencyRecords.Remove(reservation);
                await db.SaveChangesAsync(context.HttpContext.RequestAborted);
                return;
            }

            var (statusCode, responseJson) = SerializeResponse(executed.Result, jsonOptions.Value.JsonSerializerOptions);
            if (statusCode is < 200 or >= 300)
            {
                db.IdempotencyRecords.Remove(reservation);
                await db.SaveChangesAsync(context.HttpContext.RequestAborted);
                return;
            }

            reservation.ResponseStatusCode = statusCode;
            reservation.ResponseJson = responseJson;
            await db.SaveChangesAsync(context.HttpContext.RequestAborted);

            if (context.HttpContext.Items[AfterCommitCallbacksItemKey] is List<Func<Task>> callbacks)
            {
                foreach (var callback in callbacks)
                {
                    try { await callback(); }
                    catch (Exception exception)
                    {
                        logger.LogError(exception, "A post-commit notification callback failed for {Operation}.", operation);
                    }
                }
            }
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
            var winner = await db.IdempotencyRecords.AsNoTracking().FirstOrDefaultAsync(record =>
                record.UserId == userId && record.Operation == operation && record.RequestKey == key.ToString(),
                context.HttpContext.RequestAborted);
            if (winner is null) throw;
            context.Result = ReplayOrConflict(winner, requestHash);
        }
        catch
        {
            try
            {
                db.IdempotencyRecords.RemoveRange(db.IdempotencyRecords.Local);
                await db.SaveChangesAsync(context.HttpContext.RequestAborted);
            }
            catch { }
            throw;
        }
    }

    private static IActionResult ReplayOrConflict(IdempotencyRecord record, string requestHash)
    {
        if (!CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(record.RequestHash), Convert.FromHexString(requestHash)))
        {
            return new ConflictObjectResult(new
            {
                success = false,
                message = "This Idempotency-Key was already used with a different request."
            });
        }

        return new ContentResult
        {
            Content = record.ResponseJson,
            ContentType = "application/json",
            StatusCode = record.ResponseStatusCode
        };
    }

    private static (int StatusCode, string Json) SerializeResponse(
        IActionResult? result,
        JsonSerializerOptions options)
    {
        if (result is ObjectResult objectResult)
        {
            var value = objectResult.Value;
            return (objectResult.StatusCode ?? StatusCodes.Status200OK,
                JsonSerializer.Serialize(value, value?.GetType() ?? typeof(object), options));
        }

        if (result is JsonResult jsonResult)
            return (jsonResult.StatusCode ?? StatusCodes.Status200OK,
                JsonSerializer.Serialize(jsonResult.Value, options));

        if (result is ContentResult contentResult)
            return (contentResult.StatusCode ?? StatusCodes.Status200OK, contentResult.Content ?? "null");

        return (StatusCodes.Status200OK, "null");
    }
}
