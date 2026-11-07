using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SuperApp.API.Models;

/// <summary>
/// Business onboarding, new product/service, category, or module requests submitted by users, merchants, or suppliers.
/// Admin reviews and approves/rejects them before catalogue/module integration.
/// </summary>
public class BusinessRequest
{
    [Key]
    public long Id { get; set; }

    public long UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    /// <summary>NEW_PRODUCT | NEW_CATEGORY | NEW_MODULE | NEW_SERVICE | PARTNERSHIP | PLATFORM_FEATURE</summary>
    [Required, MaxLength(40)]
    public string RequestType { get; set; } = BusinessRequestTypes.NewProduct;

    [Required, MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Category { get; set; }

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string BusinessName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string ContactPhone { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ContactEmail { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(100)]
    public string? EstimatedVolume { get; set; }

    [MaxLength(2000)]
    public string? AttachmentUrls { get; set; }

    /// <summary>SUBMITTED | UNDER_REVIEW | INFO_REQUIRED | APPROVED | REJECTED | COMPLETED</summary>
    [Required, MaxLength(30)]
    public string Status { get; set; } = BusinessRequestStatuses.Submitted;

    [MaxLength(1000)]
    public string? AdminNotes { get; set; }

    public long? ReviewedByAdminId { get; set; }

    [MaxLength(100)]
    public string? ReviewedByAdminName { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

public static class BusinessRequestTypes
{
    public const string NewProduct = "NEW_PRODUCT";
    public const string NewCategory = "NEW_CATEGORY";
    public const string NewModule = "NEW_MODULE";
    public const string NewService = "NEW_SERVICE";
    public const string Partnership = "PARTNERSHIP";
    public const string PlatformFeature = "PLATFORM_FEATURE";
}

public static class BusinessRequestStatuses
{
    public const string Submitted = "SUBMITTED";
    public const string UnderReview = "UNDER_REVIEW";
    public const string InfoRequired = "INFO_REQUIRED";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
    public const string Completed = "COMPLETED";
}
