using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SuperApp.API.Models;

[Table("notification_campaigns")]
public class NotificationCampaign
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required, MaxLength(200)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(1000)]
    [Column("body")]
    public string Body { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Required]
    [Column("target_audiences")]
    public string TargetAudiences { get; set; } = "[]";

    [MaxLength(300)]
    [Column("deep_link")]
    public string? DeepLink { get; set; }

    [Column("scheduled_for")]
    public DateTime? ScheduledFor { get; set; }

    [Required, MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = "PENDING"; // PENDING, PROCESSING, SENT, FAILED, SCHEDULED

    [Column("sent_by_admin_id")]
    public long? SentByAdminId { get; set; }

    [ForeignKey(nameof(SentByAdminId))]
    public User? SentByAdmin { get; set; }

    [Column("total_targeted")]
    public int TotalTargeted { get; set; } = 0;

    [Column("accepted_by_fcm")]
    public int AcceptedByFcm { get; set; } = 0;

    [Column("device_failed")]
    public int DeviceFailed { get; set; } = 0;

    [Column("device_pruned")]
    public int DevicePruned { get; set; } = 0;

    [Column("opened_count")]
    public int OpenedCount { get; set; } = 0;

    [Column("failure_reason")]
    public string? FailureReason { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("sent_at")]
    public DateTime? SentAt { get; set; }
}
