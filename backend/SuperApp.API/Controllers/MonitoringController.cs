using Microsoft.AspNetCore.Mvc;
using SuperApp.API.Data;
using SuperApp.API.Services;

namespace SuperApp.API.Controllers;

/// <summary>
/// Health, Uptime & Zero-Cost Monitoring Integration (Compatible with Better Uptime / UptimeRobot).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MonitoringController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<MonitoringController> _logger;

    public MonitoringController(AppDbContext db, IConfiguration config, ILogger<MonitoringController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Ping endpoint for automated free-tier uptime monitors (UptimeRobot, Better Stack, Cronitor).
    /// Returns 200 OK with runtime diagnostics.
    /// </summary>
    [HttpGet("ping")]
    public async Task<IActionResult> Ping()
    {
        var dbOk = false;
        try
        {
            dbOk = await _db.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Monitoring ping DB check warning: {Message}", ex.Message);
        }

        return Ok(new
        {
            status = "online",
            system = "SuperApp V2 Production",
            database = dbOk ? "connected" : "degraded",
            timestamp = DateTime.UtcNow,
            memoryUsageMb = Math.Round(GC.GetTotalMemory(false) / (1024.0 * 1024.0), 2)
        });
    }

    /// <summary>
    /// Lightweight diagnostics report for administrators.
    /// </summary>
    [HttpGet("metrics")]
    public IActionResult Metrics()
    {
        var proc = System.Diagnostics.Process.GetCurrentProcess();
        return Ok(new
        {
            processId = proc.Id,
            upTime = (DateTime.UtcNow - proc.StartTime.ToUniversalTime()).ToString(@"dd\.hh\:mm\:ss"),
            threads = proc.Threads.Count,
            workingSetMb = Math.Round(proc.WorkingSet64 / (1024.0 * 1024.0), 2),
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        });
    }
}
