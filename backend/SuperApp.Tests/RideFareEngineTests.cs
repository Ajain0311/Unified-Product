using SuperApp.API.Models;
using SuperApp.API.Services;
using Xunit;

namespace SuperApp.Tests;

public class RideFareEngineTests
{
    private readonly RideFareRule _standardBikeRule = new()
    {
        Id = 1,
        VehicleType = "bike",
        BaseFare = 20m,
        IncludedDistanceKm = 1.0m,
        PerKmRate = 10m,
        PerMinuteRate = 1.5m,
        BookingFee = 5m,
        PlatformFee = 2m,
        MinimumFare = 30m,
        PeakMultiplier = 1.0m,
        NightSurchargePercent = 20m,
        TaxPercentage = 5m,
        IsActive = true
    };

    [Fact]
    public void Quote_WithinIncludedDistance_ChargesBasePlusFeesAndTax()
    {
        // 0.8 km, 5 minutes, midday (12:00 UTC = 17:30 IST)
        var now = new DateTime(2026, 10, 27, 12, 0, 0, DateTimeKind.Utc);
        var catalog = new List<RideFareOption>();

        var quote = RideFareEngine.Quote(_standardBikeRule, catalog, null, 0.8m, 5, now);

        Assert.NotNull(quote);
        Assert.Equal(0.8m, quote.DistanceKm);
        Assert.Equal(5, quote.DurationMinutes);
        Assert.Equal(20m, quote.BaseFare);
        Assert.Equal(0m, quote.DistanceFare); // Within 1 km included distance
        Assert.Equal(7.5m, quote.TimeFare); // 5 mins * 1.5
        Assert.True(quote.Total > 30m); // Above minimum fare
    }

    [Fact]
    public void Quote_ExceedingIncludedDistance_CalculatesBillableDistance()
    {
        // 10 km, 20 minutes
        var now = new DateTime(2026, 10, 27, 12, 0, 0, DateTimeKind.Utc);
        var catalog = new List<RideFareOption>();

        var quote = RideFareEngine.Quote(_standardBikeRule, catalog, null, 10.0m, 20, now);

        // Billable km = 10 - 1 = 9 km * 10 = 90
        Assert.Equal(90m, quote.DistanceFare);
        Assert.Equal(30m, quote.TimeFare); // 20 mins * 1.5 = 30
        Assert.True(quote.Total > 140m);
    }

    [Fact]
    public void Quote_EnforcesMinimumFare_WhenTotalIsLower()
    {
        var lowRule = new RideFareRule
        {
            Id = 2,
            VehicleType = "bike",
            BaseFare = 5m,
            IncludedDistanceKm = 5m,
            PerKmRate = 1m,
            PerMinuteRate = 0m,
            BookingFee = 0m,
            PlatformFee = 0m,
            MinimumFare = 50m,
            PeakMultiplier = 1.0m,
            NightSurchargePercent = 0m,
            TaxPercentage = 0m,
            IsActive = true
        };

        var now = new DateTime(2026, 10, 27, 12, 0, 0, DateTimeKind.Utc);
        var quote = RideFareEngine.Quote(lowRule, new List<RideFareOption>(), null, 1m, 2, now);

        Assert.Equal(50m, quote.Total);
    }
}
