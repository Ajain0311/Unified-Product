using System.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SuperApp.API.Data;
using SuperApp.API.DTOs;
using SuperApp.API.Models;
using SuperApp.API.Services;

namespace SuperApp.API.Controllers;

[ApiController]
[Route("api/bars")]
public sealed class BarReservationsController(AppDbContext db) : ControllerBase
{
    private long? CurrentUserId => long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    [HttpGet]
    [EnableRateLimiting("search-policy")]
    public async Task<ActionResult<ApiResponse<PagedResult<RestaurantSummaryDto>>>> List(
        [FromQuery] string? search, [FromQuery] string? city, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = db.Restaurants.AsNoTracking().Where(r => r.IsActive && r.BusinessType == RestaurantBusinessTypes.Bar);
        if (!string.IsNullOrWhiteSpace(city)) query = query.Where(r => r.City != null && r.City.Contains(city.Trim()));
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(r => r.Name.Contains(term) || (r.Description != null && r.Description.Contains(term)));
        }
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(r => r.IsFeatured).ThenByDescending(r => r.Rating)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new RestaurantSummaryDto
            {
                Id = r.Id, BusinessType = r.BusinessType, Name = r.Name, Description = r.Description,
                ImageUrl = r.ImageUrl, AddressLine = r.AddressLine, City = r.City, Rating = r.Rating,
                TotalRatings = r.TotalRatings, IsVeg = r.IsVeg, MinOrderAmount = r.MinOrderAmount,
                DeliveryFee = r.DeliveryFee, AvgDeliveryTimeMinutes = r.AvgDeliveryTimeMinutes,
                IsFeatured = r.IsFeatured, Phone = r.Phone
            }).ToListAsync();
        return Ok(ApiResponse<PagedResult<RestaurantSummaryDto>>.Ok(new PagedResult<RestaurantSummaryDto>
        { Items = items, TotalCount = total, Page = page, PageSize = pageSize }));
    }

    [HttpGet("{restaurantId:long}/availability")]
    [EnableRateLimiting("search-policy")]
    public async Task<ActionResult<ApiResponse<BarReservationAvailabilityDto>>> Availability(
        long restaurantId, [FromQuery] DateTime reservationAt, [FromQuery] int partySize)
    {
        var restaurant = await db.Restaurants.AsNoTracking().FirstOrDefaultAsync(r => r.Id == restaurantId && r.IsActive && r.BusinessType == RestaurantBusinessTypes.Bar);
        if (restaurant == null) return NotFound(ApiResponse<BarReservationAvailabilityDto>.Fail("Bar or lounge not found"));
        if (reservationAt <= DateTime.UtcNow || partySize < 1)
            return BadRequest(ApiResponse<BarReservationAvailabilityDto>.Fail("Choose a future time and a positive party size"));
        if (restaurant.ReservationCapacity is not > 0 || restaurant.ReservationDurationMinutes is not > 0)
            return Ok(ApiResponse<BarReservationAvailabilityDto>.Ok(new BarReservationAvailabilityDto { Available = false, RemainingCapacity = 0 }));
        var start = AsUtc(reservationAt);
        var end = start.AddMinutes(restaurant.ReservationDurationMinutes.Value);
        var occupied = await db.BarReservations.AsNoTracking().Where(r => r.RestaurantId == restaurantId
                && (r.Status == BarReservationStatuses.Pending || r.Status == BarReservationStatuses.Confirmed)
                && r.ReservationAt < end && r.ReservationAt.AddMinutes(restaurant.ReservationDurationMinutes.Value) > start)
            .SumAsync(r => (int?)r.PartySize) ?? 0;
        var remaining = Math.Max(0, restaurant.ReservationCapacity.Value - occupied);
        return Ok(ApiResponse<BarReservationAvailabilityDto>.Ok(new BarReservationAvailabilityDto
        { Available = BarReservationCapacity.CanFit(restaurant.ReservationCapacity.Value, occupied, partySize), RemainingCapacity = remaining }));
    }

    [Authorize]
    [HttpPost("reservations")]
    [EnableRateLimiting("checkout-policy")]
    [ServiceFilter(typeof(IdempotencyActionFilter))]
    public async Task<ActionResult<ApiResponse<BarReservationDto>>> Create([FromBody] CreateBarReservationRequest request)
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<BarReservationDto>.Fail("Authentication required"));
        var restaurant = await db.Restaurants.FirstOrDefaultAsync(r => r.Id == request.RestaurantId && r.IsActive && r.BusinessType == RestaurantBusinessTypes.Bar);
        if (restaurant == null) return NotFound(ApiResponse<BarReservationDto>.Fail("Bar or lounge not found"));
        if (request.ReservationAt <= DateTime.UtcNow || request.PartySize < 1)
            return BadRequest(ApiResponse<BarReservationDto>.Fail("Choose a future time and a positive party size"));
        if (restaurant.ReservationCapacity is not > 0 || restaurant.ReservationDurationMinutes is not > 0)
            return Conflict(ApiResponse<BarReservationDto>.Fail("This venue has not configured reservation availability"));

        // The idempotency filter wraps this action in a database transaction. Lock the venue row
        // so concurrent requests cannot both consume the same remaining seating capacity.
        var provider = db.Database.ProviderName ?? string.Empty;
        if (provider.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT id FROM restaurants WHERE id = {restaurant.Id} FOR UPDATE");
        else if (provider.Contains("SqlServer", StringComparison.OrdinalIgnoreCase))
            await db.Database.ExecuteSqlInterpolatedAsync($"SELECT Id FROM Restaurants WITH (UPDLOCK, HOLDLOCK) WHERE Id = {restaurant.Id}");

        var start = AsUtc(request.ReservationAt);
        var duration = restaurant.ReservationDurationMinutes.Value;
        var end = start.AddMinutes(duration);
        var occupied = await db.BarReservations.Where(r => r.RestaurantId == restaurant.Id
                && (r.Status == BarReservationStatuses.Pending || r.Status == BarReservationStatuses.Confirmed)
                && r.ReservationAt < end && r.ReservationAt.AddMinutes(duration) > start)
            .SumAsync(r => (int?)r.PartySize) ?? 0;
        if (!BarReservationCapacity.CanFit(restaurant.ReservationCapacity.Value, occupied, request.PartySize))
            return Conflict(ApiResponse<BarReservationDto>.Fail("There is not enough seating capacity at this time"));

        var reservation = new BarReservation
        {
            RestaurantId = restaurant.Id, UserId = userId, ReservationAt = start,
            PartySize = request.PartySize, CustomerNotes = string.IsNullOrWhiteSpace(request.CustomerNotes) ? null : request.CustomerNotes.Trim(),
            Status = BarReservationStatuses.Pending, CreatedAt = DateTime.UtcNow
        };
        db.BarReservations.Add(reservation);
        await db.SaveChangesAsync();
        return Ok(ApiResponse<BarReservationDto>.Ok(ToDto(reservation, restaurant.Name), "Reservation request submitted"));
    }

    [Authorize]
    [HttpGet("reservations/mine")]
    public async Task<ActionResult<ApiResponse<List<BarReservationDto>>>> Mine()
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<List<BarReservationDto>>.Fail("Authentication required"));
        var items = await db.BarReservations.AsNoTracking().Where(r => r.UserId == userId)
            .OrderByDescending(r => r.ReservationAt).Select(r => new BarReservationDto
            { Id = r.Id, RestaurantId = r.RestaurantId, RestaurantName = r.Restaurant.Name, ReservationAt = r.ReservationAt,
                PartySize = r.PartySize, Status = r.Status, CustomerNotes = r.CustomerNotes, VenueNotes = r.VenueNotes, CreatedAt = r.CreatedAt })
            .ToListAsync();
        return Ok(ApiResponse<List<BarReservationDto>>.Ok(items));
    }

    [Authorize]
    [HttpGet("owner/reservations")]
    public async Task<ActionResult<ApiResponse<List<BarReservationDto>>>> OwnerReservations([FromQuery] long restaurantId)
    {
        if (!await CanManageAsync(restaurantId)) return Forbid();
        var items = await db.BarReservations.AsNoTracking().Where(r => r.RestaurantId == restaurantId)
            .OrderBy(r => r.ReservationAt).Select(r => new BarReservationDto
            { Id = r.Id, RestaurantId = r.RestaurantId, RestaurantName = r.Restaurant.Name, ReservationAt = r.ReservationAt,
                PartySize = r.PartySize, Status = r.Status, CustomerNotes = r.CustomerNotes, VenueNotes = r.VenueNotes, CreatedAt = r.CreatedAt })
            .ToListAsync();
        return Ok(ApiResponse<List<BarReservationDto>>.Ok(items));
    }

    [Authorize]
    [HttpPut("owner/{restaurantId:long}/reservation-settings")]
    public async Task<ActionResult<ApiResponse>> UpdateCapacity(long restaurantId, [FromBody] BarReservationCapacityRequest request)
    {
        if (!await CanManageAsync(restaurantId)) return Forbid();
        var restaurant = await db.Restaurants.FirstOrDefaultAsync(r => r.Id == restaurantId && r.BusinessType == RestaurantBusinessTypes.Bar);
        if (restaurant == null) return NotFound(ApiResponse.Fail("Bar or lounge not found"));
        restaurant.ReservationCapacity = request.Capacity;
        restaurant.ReservationDurationMinutes = request.ReservationDurationMinutes;
        restaurant.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok("Reservation capacity updated"));
    }

    [Authorize]
    [HttpPut("owner/reservations/{id:long}/status")]
    public async Task<ActionResult<ApiResponse<BarReservationDto>>> UpdateStatus(long id, [FromBody] UpdateBarReservationStatusRequest request)
    {
        var reservation = await db.BarReservations.Include(r => r.Restaurant).FirstOrDefaultAsync(r => r.Id == id);
        if (reservation == null) return NotFound(ApiResponse<BarReservationDto>.Fail("Reservation not found"));
        if (!await CanManageAsync(reservation.RestaurantId)) return Forbid();
        var status = request.Status.Trim().ToUpperInvariant();
        if (status is not (BarReservationStatuses.Confirmed or BarReservationStatuses.Rejected or BarReservationStatuses.Completed))
            return BadRequest(ApiResponse<BarReservationDto>.Fail("Unsupported reservation status"));
        if (reservation.Status is BarReservationStatuses.Cancelled or BarReservationStatuses.Rejected or BarReservationStatuses.Completed)
            return Conflict(ApiResponse<BarReservationDto>.Fail("Reservation is already closed"));
        reservation.Status = status;
        reservation.VenueNotes = string.IsNullOrWhiteSpace(request.VenueNotes) ? null : request.VenueNotes.Trim();
        reservation.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse<BarReservationDto>.Ok(ToDto(reservation, reservation.Restaurant.Name)));
    }

    [Authorize]
    [HttpPost("reservations/{id:long}/cancel")]
    public async Task<ActionResult<ApiResponse>> Cancel(long id)
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse.Fail("Authentication required"));
        var reservation = await db.BarReservations.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        if (reservation == null) return NotFound(ApiResponse.Fail("Reservation not found"));
        if (reservation.Status is BarReservationStatuses.Cancelled or BarReservationStatuses.Rejected or BarReservationStatuses.Completed)
            return Conflict(ApiResponse.Fail("Reservation cannot be cancelled in its current state"));
        reservation.Status = BarReservationStatuses.Cancelled;
        reservation.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok("Reservation cancelled"));
    }

    private async Task<bool> CanManageAsync(long restaurantId)
    {
        if (User.IsInRole(RoleNames.Admin)) return true;
        return CurrentUserId is long id && await db.RestaurantUsers.AnyAsync(ru => ru.UserId == id && ru.RestaurantId == restaurantId && ru.IsActive);
    }

    private static DateTime AsUtc(DateTime value) => value.Kind == DateTimeKind.Utc ? value : value.Kind == DateTimeKind.Local ? value.ToUniversalTime() : DateTime.SpecifyKind(value, DateTimeKind.Utc);

    private static BarReservationDto ToDto(BarReservation r, string name) => new()
    { Id = r.Id, RestaurantId = r.RestaurantId, RestaurantName = name, ReservationAt = r.ReservationAt,
        PartySize = r.PartySize, Status = r.Status, CustomerNotes = r.CustomerNotes, VenueNotes = r.VenueNotes, CreatedAt = r.CreatedAt };
}
