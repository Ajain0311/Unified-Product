namespace SuperApp.API.Common;

/// <summary>
/// Centralized service area and geographic boundary configuration.
/// Initial rollout centered on Mandphiya (Shri Sanwaliya Ji), Chittorgarh District, Rajasthan.
/// </summary>
public static class ServiceAreaConfig
{
    /// <summary>
    /// Mandphiya Operating Hub Coordinates
    /// Shri Sanwaliya Seth Temple locality, Bhadesar Tehsil, Chittorgarh District, Rajasthan.
    /// </summary>
    public const double MandphiyaCenterLatitude = 24.6600;
    public const double MandphiyaCenterLongitude = 74.4000;
    public const string OperatingRegionName = "Mandphiya (Shri Sanwaliya Ji), Rajasthan";

    /// <summary>
    /// Strict food delivery radius limit in kilometers (configurable).
    /// </summary>
    public const double FoodMaxDeliveryRadiusKm = 20.0;

    /// <summary>
    /// Maximum supported ride booking distance in kilometers (configurable).
    /// Prevents unrealistic multi-hundred/thousand kilometer bookings or out-of-bounds routes.
    /// </summary>
    public const double RideMaxDistanceKm = 20.0;

    /// <summary>
    /// Bounding box covering Chittorgarh District serviceability.
    /// </summary>
    public const double MinLatitude = 24.10;
    public const double MaxLatitude = 25.50;
    public const double MinLongitude = 74.00;
    public const double MaxLongitude = 75.50;

    /// <summary>
    /// Calculate great-circle distance between two coordinates using the Haversine formula in kilometers.
    /// </summary>
    public static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371.0;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var rLat1 = DegreesToRadians(lat1);
        var rLat2 = DegreesToRadians(lat2);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(rLat1) * Math.Cos(rLat2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadiusKm * c;
    }

    /// <summary>
    /// Checks if a coordinate is within the configured delivery radius of Mandphiya.
    /// </summary>
    public static bool IsWithinDeliveryRadius(double lat, double lon, double maxRadiusKm = FoodMaxDeliveryRadiusKm)
    {
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
        var distance = CalculateDistanceKm(MandphiyaCenterLatitude, MandphiyaCenterLongitude, lat, lon);
        return distance <= maxRadiusKm;
    }

    /// <summary>
    /// Checks if coordinate falls within the regional district boundaries.
    /// </summary>
    public static bool IsWithinRegionBounds(double lat, double lon)
    {
        return lat >= MinLatitude && lat <= MaxLatitude &&
               lon >= MinLongitude && lon <= MaxLongitude;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
}
