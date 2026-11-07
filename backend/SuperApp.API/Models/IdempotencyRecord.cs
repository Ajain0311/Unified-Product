using System.ComponentModel.DataAnnotations;

namespace SuperApp.API.Models;

public sealed class IdempotencyRecord
{
    [Key]
    public long Id { get; set; }

    public long UserId { get; set; }

    [Required, MaxLength(120)]
    public string Operation { get; set; } = string.Empty;

    [Required, MaxLength(36)]
    public string RequestKey { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string RequestHash { get; set; } = string.Empty;

    public int ResponseStatusCode { get; set; }

    [Required]
    public string ResponseJson { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }
}
