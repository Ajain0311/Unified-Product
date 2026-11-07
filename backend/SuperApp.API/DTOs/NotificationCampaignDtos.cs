using System.ComponentModel.DataAnnotations;

namespace SuperApp.API.DTOs;

public class CreateNotificationCampaignRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(1000)]
    public string Body { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Audience segments selected by Admin:
    /// ALL_CUSTOMERS, FOOD_CUSTOMERS, RIDE_CUSTOMERS, MARKETPLACE_CUSTOMERS, HOTEL_CUSTOMERS,
    /// BAR_CUSTOMERS, CAFE_CUSTOMERS, B2B_WATER_CUSTOMERS, RESTAURANT_OWNERS, DRIVERS,
    /// MARKETPLACE_SELLERS, HOTEL_OWNERS, BAR_OWNERS, CAFE_OWNERS, B2B_SUPPLIERS, INACTIVE_USERS, CUSTOM_USERS
    /// </summary>
    public List<string> TargetAudiences { get; set; } = new();

    public List<long>? CustomUserIds { get; set; }

    [MaxLength(300)]
    public string? DeepLink { get; set; }

    public DateTime? ScheduledFor { get; set; }
}

public class NotificationCampaignDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public List<string> TargetAudiences { get; set; } = new();
    public string? DeepLink { get; set; }
    public DateTime? ScheduledFor { get; set; }
    public string Status { get; set; } = "PENDING";
    public long? SentByAdminId { get; set; }
    public string? SentByAdminName { get; set; }
    public int TotalTargeted { get; set; }
    public int AcceptedByFcm { get; set; }
    public int DeviceFailed { get; set; }
    public int DevicePruned { get; set; }
    public int OpenedCount { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
}
