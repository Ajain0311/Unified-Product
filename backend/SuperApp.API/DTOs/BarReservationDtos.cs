using System.ComponentModel.DataAnnotations;

namespace SuperApp.API.DTOs;

public sealed class CreateBarReservationRequest
{
    [Range(1, int.MaxValue)]
    public long RestaurantId { get; set; }

    public DateTime ReservationAt { get; set; }

    [Range(1, int.MaxValue)]
    public int PartySize { get; set; }

    [MaxLength(500)]
    public string? CustomerNotes { get; set; }
}

public sealed class UpdateBarReservationStatusRequest
{
    [Required, MaxLength(20)]
    public string Status { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? VenueNotes { get; set; }
}

public sealed class BarReservationCapacityRequest
{
    [Range(1, int.MaxValue)]
    public int Capacity { get; set; }

    [Range(1, int.MaxValue)]
    public int ReservationDurationMinutes { get; set; }
}

public sealed class BarReservationDto
{
    public long Id { get; set; }
    public long RestaurantId { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public DateTime ReservationAt { get; set; }
    public int PartySize { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CustomerNotes { get; set; }
    public string? VenueNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class BarReservationAvailabilityDto
{
    public bool Available { get; set; }
    public int RemainingCapacity { get; set; }
}
