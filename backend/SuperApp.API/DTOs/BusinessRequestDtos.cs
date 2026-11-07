using System.ComponentModel.DataAnnotations;

namespace SuperApp.API.DTOs;

public class SubmitBusinessRequestDto
{
    [Required, MaxLength(40)]
    public string RequestType { get; set; } = string.Empty;

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
}

public class UpdateBusinessRequestStatusDto
{
    [Required, MaxLength(30)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? AdminNotes { get; set; }
}

public class BusinessRequestDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterMobile { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public string? Location { get; set; }
    public string? EstimatedVolume { get; set; }
    public string? AttachmentUrls { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdminNotes { get; set; }
    public long? ReviewedByAdminId { get; set; }
    public string? ReviewedByAdminName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ModuleDescriptorDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public bool IsCore { get; set; }
    public bool IsActive { get; set; }
    public double EstimatedSizeMb { get; set; }
    public string Status { get; set; } = "ready";
}
