using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuperApp.API.Data;
using SuperApp.API.DTOs;
using SuperApp.API.Models;

namespace SuperApp.API.Controllers;

[ApiController]
[Route("api/grow")]
public class GrowController : ControllerBase
{
    private readonly AppDbContext _db;

    public GrowController(AppDbContext db)
    {
        _db = db;
    }

    private long? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claim, out var id) ? id : null;
    }

    private bool IsAdmin()
    {
        return User.IsInRole(RoleNames.Admin) || User.HasClaim(ClaimTypes.Role, RoleNames.Admin);
    }

    /// <summary>
    /// Returns the modular architecture catalog, categories, and resource descriptors.
    /// Used by client to dynamically discover modules, readiness, and download sizes.
    /// </summary>
    [HttpGet("modules")]
    public ActionResult<ApiResponse<List<ModuleDescriptorDto>>> GetModuleCatalog()
    {
        var modules = new List<ModuleDescriptorDto>
        {
            new() { Id = "food", Name = "Food Delivery", Category = "Daily Living", Description = "Explore restaurants, cloud kitchens, and gourmet dining with live delivery tracking.", Icon = "restaurant-outline", Route = "Food", IsCore = true, IsActive = true, EstimatedSizeMb = 3.2, Status = "ready" },
            new() { Id = "ride", Name = "Cabs & Rides", Category = "Mobility", Description = "On-demand city cabs, bike taxis, auto rickshaws, and outstation trips in Chittorgarh.", Icon = "car-outline", Route = "Rides", IsCore = true, IsActive = true, EstimatedSizeMb = 2.8, Status = "ready" },
            new() { Id = "bazaar", Name = "City Bazaar", Category = "Commerce", Description = "Hyperlocal peer-to-peer marketplace for mobiles, electronics, vehicles, and lifestyle goods.", Icon = "storefront-outline", Route = "Bazaar", IsCore = true, IsActive = true, EstimatedSizeMb = 2.4, Status = "ready" },
            new() { Id = "hotels", Name = "Hotels & Stays", Category = "Hospitality", Description = "Verified heritage palaces, luxury resorts, boutique villas, and budget budget rooms.", Icon = "business-outline", Route = "HotelHome", IsCore = false, IsActive = true, EstimatedSizeMb = 4.5, Status = "ready" },
            new() { Id = "bars", Name = "Bars & Lounges", Category = "Hospitality", Description = "Curated nightlife, rooftop lounges, craft taprooms, and premium reservation desks.", Icon = "wine-outline", Route = "BarHub", IsCore = false, IsActive = true, EstimatedSizeMb = 2.1, Status = "ready" },
            new() { Id = "beverages", Name = "Beverages & Cafe", Category = "Hospitality", Description = "Specialty roasters, artisan cafes, organic teas, and freshly squeezed cold beverages.", Icon = "cafe-outline", Route = "BeverageHub", IsCore = false, IsActive = true, EstimatedSizeMb = 1.9, Status = "ready" },
            new() { Id = "supplies", Name = "B2B Water & Bulk Goods", Category = "Commercial", Description = "Commercial 20L purified water cans, hospitality supplies, and recurring corporate delivery.", Icon = "water-outline", Route = "B2BWaterSupplies", IsCore = false, IsActive = true, EstimatedSizeMb = 1.6, Status = "ready" },
            // Future ecosystem modules
            new() { Id = "grocery", Name = "Quick Grocery", Category = "Coming Soon", Description = "Fresh farm vegetables, dairy, pulses, and pantry essentials in 15 minutes.", Icon = "basket-outline", Route = "GrowWithSuperApp", IsCore = false, IsActive = false, EstimatedSizeMb = 3.0, Status = "coming_soon" },
            new() { Id = "pharmacy", Name = "Pharmacy & Wellness", Category = "Coming Soon", Description = "Prescription medicines, ayurvedic health, diagnostics, and baby care essentials.", Icon = "medkit-outline", Route = "GrowWithSuperApp", IsCore = false, IsActive = false, EstimatedSizeMb = 2.6, Status = "coming_soon" },
            new() { Id = "home_services", Name = "Home & Appliance Repair", Category = "Coming Soon", Description = "Certified electricians, plumbers, carpenter services, and home maintenance.", Icon = "construct-outline", Route = "GrowWithSuperApp", IsCore = false, IsActive = false, EstimatedSizeMb = 2.2, Status = "coming_soon" },
            new() { Id = "laundry", Name = "Clean Laundry & Dry Cleaning", Category = "Coming Soon", Description = "Doorstep fabric care, steam pressing, and premium dry cleaning services.", Icon = "shirt-outline", Route = "GrowWithSuperApp", IsCore = false, IsActive = false, EstimatedSizeMb = 1.8, Status = "coming_soon" }
        };

        return Ok(ApiResponse<List<ModuleDescriptorDto>>.Ok(modules));
    }

    /// <summary>
    /// Submit a business request (new product, category, module, service, or partnership).
    /// </summary>
    [HttpPost("requests")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BusinessRequestDto>>> SubmitRequest([FromBody] SubmitBusinessRequestDto dto)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<BusinessRequestDto>.Fail("Authentication required"));

        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.BusinessName))
            return BadRequest(ApiResponse<BusinessRequestDto>.Fail("Title, description, and business name are required"));

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null)
            return Unauthorized(ApiResponse<BusinessRequestDto>.Fail("User not found"));

        var entity = new BusinessRequest
        {
            UserId = userId.Value,
            RequestType = string.IsNullOrWhiteSpace(dto.RequestType) ? BusinessRequestTypes.NewProduct : dto.RequestType.Trim().ToUpperInvariant(),
            Title = dto.Title.Trim(),
            Category = dto.Category?.Trim(),
            Description = dto.Description.Trim(),
            BusinessName = dto.BusinessName.Trim(),
            ContactPhone = string.IsNullOrWhiteSpace(dto.ContactPhone) ? user.MobileNumber : dto.ContactPhone.Trim(),
            ContactEmail = dto.ContactEmail?.Trim() ?? user.Email,
            Location = dto.Location?.Trim(),
            EstimatedVolume = dto.EstimatedVolume?.Trim(),
            AttachmentUrls = dto.AttachmentUrls?.Trim(),
            Status = BusinessRequestStatuses.Submitted,
            CreatedAt = DateTime.UtcNow
        };

        _db.BusinessRequests.Add(entity);
        await _db.SaveChangesAsync();

        var resultDto = MapToDto(entity, user);
        return Ok(ApiResponse<BusinessRequestDto>.Ok(resultDto, "Your request has been submitted to the SuperApp Business Operations team."));
    }

    /// <summary>
    /// Get requests submitted by the authenticated user.
    /// </summary>
    [HttpGet("my-requests")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<BusinessRequestDto>>>> GetMyRequests()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<List<BusinessRequestDto>>.Fail("Authentication required"));

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);

        var requests = await _db.BusinessRequests
            .AsNoTracking()
            .Where(r => r.UserId == userId.Value)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var dtos = requests.Select(r => MapToDto(r, user)).ToList();
        return Ok(ApiResponse<List<BusinessRequestDto>>.Ok(dtos));
    }

    /// <summary>
    /// Admin endpoint: list all submitted business requests with optional type and status filtering.
    /// </summary>
    [HttpGet("admin/requests")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<List<BusinessRequestDto>>>> GetAdminRequests(
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] string? search)
    {
        if (!IsAdmin())
            return Forbid();

        var query = _db.BusinessRequests
            .AsNoTracking()
            .Include(r => r.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(r => r.RequestType == type.Trim().ToUpperInvariant());

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(r => r.Status == status.Trim().ToUpperInvariant());

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(r => r.Title.Contains(term) || r.BusinessName.Contains(term) || r.ContactPhone.Contains(term));
        }

        var list = await query
            .OrderByDescending(r => r.CreatedAt)
            .Take(100)
            .ToListAsync();

        var dtos = list.Select(r => MapToDto(r, r.User)).ToList();
        return Ok(ApiResponse<List<BusinessRequestDto>>.Ok(dtos));
    }

    /// <summary>
    /// Admin endpoint: review, approve, reject, or request information for a request.
    /// </summary>
    [HttpPut("admin/requests/{id:long}/status")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<BusinessRequestDto>>> UpdateRequestStatus(
        long id,
        [FromBody] UpdateBusinessRequestStatusDto dto)
    {
        if (!IsAdmin())
            return Forbid();

        var adminId = GetUserId();
        var adminUser = adminId.HasValue ? await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == adminId.Value) : null;

        var entity = await _db.BusinessRequests
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (entity == null)
            return NotFound(ApiResponse<BusinessRequestDto>.Fail("Request not found"));

        var validStatuses = new[]
        {
            BusinessRequestStatuses.Submitted,
            BusinessRequestStatuses.UnderReview,
            BusinessRequestStatuses.InfoRequired,
            BusinessRequestStatuses.Approved,
            BusinessRequestStatuses.Rejected,
            BusinessRequestStatuses.Completed
        };

        var newStatus = dto.Status.Trim().ToUpperInvariant();
        if (!validStatuses.Contains(newStatus))
            return BadRequest(ApiResponse<BusinessRequestDto>.Fail($"Invalid status '{dto.Status}'"));

        entity.Status = newStatus;
        if (!string.IsNullOrWhiteSpace(dto.AdminNotes))
            entity.AdminNotes = dto.AdminNotes.Trim();

        entity.ReviewedByAdminId = adminId;
        entity.ReviewedByAdminName = adminUser?.FullName ?? "Administrator";
        entity.ReviewedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(ApiResponse<BusinessRequestDto>.Ok(MapToDto(entity, entity.User), "Request status updated successfully"));
    }

    private static BusinessRequestDto MapToDto(BusinessRequest r, User? user)
    {
        return new BusinessRequestDto
        {
            Id = r.Id,
            UserId = r.UserId,
            RequesterName = user?.FullName ?? "User",
            RequesterMobile = user?.MobileNumber ?? r.ContactPhone,
            RequestType = r.RequestType,
            Title = r.Title,
            Category = r.Category,
            Description = r.Description,
            BusinessName = r.BusinessName,
            ContactPhone = r.ContactPhone,
            ContactEmail = r.ContactEmail,
            Location = r.Location,
            EstimatedVolume = r.EstimatedVolume,
            AttachmentUrls = r.AttachmentUrls,
            Status = r.Status,
            AdminNotes = r.AdminNotes,
            ReviewedByAdminId = r.ReviewedByAdminId,
            ReviewedByAdminName = r.ReviewedByAdminName,
            ReviewedAt = r.ReviewedAt,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}
