using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SuperApp.API.Models;

public class BarReservation
{
    [Key]
    public long Id { get; set; }

    public long RestaurantId { get; set; }

    [ForeignKey(nameof(RestaurantId))]
    public Restaurant Restaurant { get; set; } = null!;

    public long UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public DateTime ReservationAt { get; set; }

    public int PartySize { get; set; }

    [Required, MaxLength(20)]
    public string Status { get; set; } = BarReservationStatuses.Pending;

    [MaxLength(500)]
    public string? CustomerNotes { get; set; }

    [MaxLength(500)]
    public string? VenueNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

public static class BarReservationStatuses
{
    public const string Pending = "PENDING";
    public const string Confirmed = "CONFIRMED";
    public const string Rejected = "REJECTED";
    public const string Cancelled = "CANCELLED";
    public const string Completed = "COMPLETED";
}
