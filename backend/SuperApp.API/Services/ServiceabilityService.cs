using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SuperApp.API.Data;

namespace SuperApp.API.Services;

public sealed record SupportedServiceZone(
    double MinLatitude,
    double MaxLatitude,
    double MinLongitude,
    double MaxLongitude);

public sealed record ServiceAreaPolicy(
    double CenterLatitude,
    double CenterLongitude,
    double FoodDefaultRadiusKm,
    double RidePickupRadiusKm,
    double RideMaxRoadDistanceKm,
    IReadOnlyList<SupportedServiceZone> DestinationZones,
    double GpsMaxCachedAgeSeconds = 60,
    double GpsMaxAccuracyMeters = 50);

public sealed record RestaurantDeliveryCoverage(
    double? Latitude,
    double? Longitude,
    double RadiusKm);

public enum ServiceabilityFailure
{
    None,
    InvalidCoordinates,
    InvalidCoverageConfiguration,
    FoodOutsideCoverage,
    PickupOutsideCoverage,
    DestinationOutsideCoverage,
    RideRouteTooLong,
    RouteUnavailable,
}

public sealed record ServiceabilityResult(bool IsServiceable, ServiceabilityFailure Failure)
{
    public static ServiceabilityResult Allowed() => new(true, ServiceabilityFailure.None);
    public static ServiceabilityResult Rejected(ServiceabilityFailure failure) => new(false, failure);
}

/// <summary>
/// Applies authoritative delivery and ride coverage rules from one policy snapshot.
/// Restaurant coverage, when explicitly configured, replaces the Mandphiya default
/// area for that restaurant; the two areas are never unioned.
/// </summary>
public sealed class ServiceabilityService(ServiceAreaPolicy policy)
{
    private const double EarthRadiusKm = 6371.0;

    public ServiceabilityResult CheckFoodDelivery(
        double? latitude,
        double? longitude,
        RestaurantDeliveryCoverage? restaurantCoverage = null)
    {
        if (!AreValidCoordinates(latitude, longitude))
            return ServiceabilityResult.Rejected(ServiceabilityFailure.InvalidCoordinates);

        if (restaurantCoverage is not null)
        {
            if (!AreValidCoordinates(restaurantCoverage.Latitude, restaurantCoverage.Longitude) ||
                !double.IsFinite(restaurantCoverage.RadiusKm) || restaurantCoverage.RadiusKm <= 0)
            {
                return ServiceabilityResult.Rejected(ServiceabilityFailure.InvalidCoverageConfiguration);
            }

            return DistanceKm(latitude!.Value, longitude!.Value,
                    restaurantCoverage.Latitude!.Value, restaurantCoverage.Longitude!.Value) <= restaurantCoverage.RadiusKm
                ? ServiceabilityResult.Allowed()
                : ServiceabilityResult.Rejected(ServiceabilityFailure.FoodOutsideCoverage);
        }

        if (!AreValidCoordinates(policy.CenterLatitude, policy.CenterLongitude) ||
            !double.IsFinite(policy.FoodDefaultRadiusKm) || policy.FoodDefaultRadiusKm <= 0)
        {
            return ServiceabilityResult.Rejected(ServiceabilityFailure.InvalidCoverageConfiguration);
        }

        return DistanceKm(latitude!.Value, longitude!.Value, policy.CenterLatitude, policy.CenterLongitude) <= policy.FoodDefaultRadiusKm
            ? ServiceabilityResult.Allowed()
            : ServiceabilityResult.Rejected(ServiceabilityFailure.FoodOutsideCoverage);
    }

    public ServiceabilityResult CheckRide(
        double? pickupLatitude,
        double? pickupLongitude,
        double? destinationLatitude,
        double? destinationLongitude,
        double? roadDistanceKm)
    {
        if (!AreValidCoordinates(pickupLatitude, pickupLongitude) ||
            !AreValidCoordinates(destinationLatitude, destinationLongitude))
        {
            return ServiceabilityResult.Rejected(ServiceabilityFailure.InvalidCoordinates);
        }

        // Validate service policy: pickup radius and max road distance must be positive numbers if checked
        if (!double.IsFinite(policy.RideMaxRoadDistanceKm) || policy.RideMaxRoadDistanceKm <= 0)
        {
            return ServiceabilityResult.Rejected(ServiceabilityFailure.InvalidCoverageConfiguration);
        }

        // Check pickup radius only if center coordinates are configured and radius is positive
        if (AreValidCoordinates(policy.CenterLatitude, policy.CenterLongitude) &&
            double.IsFinite(policy.RidePickupRadiusKm) && policy.RidePickupRadiusKm > 0)
        {
            if (DistanceKm(pickupLatitude!.Value, pickupLongitude!.Value,
                    policy.CenterLatitude, policy.CenterLongitude) > policy.RidePickupRadiusKm)
            {
                return ServiceabilityResult.Rejected(ServiceabilityFailure.PickupOutsideCoverage);
            }
        }

        // Destination zones check: if destination zones are defined, destination must fall in at least one zone
        if (policy.DestinationZones != null && policy.DestinationZones.Count > 0)
        {
            if (!policy.DestinationZones.Any(zone => Contains(zone, destinationLatitude!.Value, destinationLongitude!.Value)))
                return ServiceabilityResult.Rejected(ServiceabilityFailure.DestinationOutsideCoverage);
        }

        if (!roadDistanceKm.HasValue || !double.IsFinite(roadDistanceKm.Value) || roadDistanceKm.Value < 0)
            return ServiceabilityResult.Rejected(ServiceabilityFailure.RouteUnavailable);

        return roadDistanceKm.Value <= policy.RideMaxRoadDistanceKm
            ? ServiceabilityResult.Allowed()
            : ServiceabilityResult.Rejected(ServiceabilityFailure.RideRouteTooLong);
    }

    public static bool AreValidCoordinates(double? latitude, double? longitude) =>
        latitude.HasValue && longitude.HasValue &&
        double.IsFinite(latitude.Value) && double.IsFinite(longitude.Value) &&
        latitude.Value is >= -90 and <= 90 && longitude.Value is >= -180 and <= 180;

    public static double DistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);
        var rLat1 = DegreesToRadians(lat1);
        var rLat2 = DegreesToRadians(lat2);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(rLat1) * Math.Cos(rLat2);
        return EarthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static bool IsValidZone(SupportedServiceZone zone) =>
        double.IsFinite(zone.MinLatitude) && double.IsFinite(zone.MaxLatitude) &&
        double.IsFinite(zone.MinLongitude) && double.IsFinite(zone.MaxLongitude) &&
        zone.MinLatitude >= -90 && zone.MaxLatitude <= 90 && zone.MinLatitude <= zone.MaxLatitude &&
        zone.MinLongitude >= -180 && zone.MaxLongitude <= 180 && zone.MinLongitude <= zone.MaxLongitude;

    private static bool Contains(SupportedServiceZone zone, double latitude, double longitude) =>
        latitude >= zone.MinLatitude && latitude <= zone.MaxLatitude &&
        longitude >= zone.MinLongitude && longitude <= zone.MaxLongitude;

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}

/// <summary>Loads operational serviceability policy from AppSettings over documented bootstrap defaults.</summary>
public sealed class ServiceAreaPolicyProvider(AppDbContext db, IConfiguration configuration, IMemoryCache cache)
{
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromSeconds(30);
    private const string CacheKey = "service-area-policy-v1";

    public async Task<ServiceAreaPolicy> GetPolicyAsync(bool refresh = false, CancellationToken cancellationToken = default)
    {
        if (!refresh && cache.TryGetValue(CacheKey, out ServiceAreaPolicy? cached) && cached is not null)
            return cached;

        var configured = configuration.GetSection("BusinessConfiguration:Serviceability");
        var latitude = configured.GetValue<double?>("CenterLatitude") ?? double.NaN;
        var longitude = configured.GetValue<double?>("CenterLongitude") ?? double.NaN;
        var foodRadius = configured.GetValue<double?>("FoodDefaultRadiusKm") ?? double.NaN;
        var pickupRadius = configured.GetValue<double?>("RidePickupRadiusKm") ?? double.NaN;
        var routeLimit = configured.GetValue<double?>("RideMaxRoadDistanceKm") ?? double.NaN;
        var gpsMaxAge = configured.GetValue<double?>("GpsMaxCachedAgeSeconds") ?? 60;
        var gpsMaxAccuracy = configured.GetValue<double?>("GpsMaxAccuracyMeters") ?? 50;
        var zones = configured.GetSection("RideDestinationZones").Get<List<SupportedServiceZone>>() ?? new();

        var keys = new[]
        {
            "serviceability_center_latitude", "serviceability_center_longitude",
            "food_default_service_radius_km", "ride_pickup_radius_km",
            "ride_max_road_distance_km", "ride_destination_zones",
            "gps_max_cached_age_seconds", "gps_max_accuracy_meters"
        };
        var rows = await db.AppSettings.AsNoTracking()
            .Where(setting => keys.Contains(setting.SettingKey))
            .ToDictionaryAsync(setting => setting.SettingKey, setting => setting.SettingValue, cancellationToken);

        static double ReadNumber(Dictionary<string, string?> source, string key, double fallback)
        {
            if (!source.TryGetValue(key, out var value)) return fallback;
            return double.TryParse(value, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var parsed) && double.IsFinite(parsed)
                ? parsed : double.NaN;
        }

        latitude = ReadNumber(rows, keys[0], latitude);
        longitude = ReadNumber(rows, keys[1], longitude);
        foodRadius = ReadNumber(rows, keys[2], foodRadius);
        pickupRadius = ReadNumber(rows, keys[3], pickupRadius);
        routeLimit = ReadNumber(rows, keys[4], routeLimit);
        gpsMaxAge = ReadNumber(rows, keys[6], gpsMaxAge);
        gpsMaxAccuracy = ReadNumber(rows, keys[7], gpsMaxAccuracy);
        if (rows.TryGetValue(keys[5], out var zonesJson) && !string.IsNullOrWhiteSpace(zonesJson))
        {
            try { zones = System.Text.Json.JsonSerializer.Deserialize<List<SupportedServiceZone>>(zonesJson) ?? new(); }
            catch (System.Text.Json.JsonException) { zones = new(); }
        }

        var policy = new ServiceAreaPolicy(latitude, longitude, foodRadius, pickupRadius, routeLimit, zones, gpsMaxAge, gpsMaxAccuracy);
        cache.Set(CacheKey, policy, CacheLifetime);
        return policy;
    }

    public void Invalidate() => cache.Remove(CacheKey);

    public static string? ValidateSetting(string key, string? value)
    {
        var numericRanges = new Dictionary<string, (double Min, double Max)>(StringComparer.Ordinal)
        {
            ["serviceability_center_latitude"] = (-90, 90),
            ["serviceability_center_longitude"] = (-180, 180),
            ["food_default_service_radius_km"] = (0.01, 500),
            ["ride_pickup_radius_km"] = (0.01, 500),
            ["ride_max_road_distance_km"] = (0.01, 2000),
            ["gps_max_cached_age_seconds"] = (1, 300),
            ["gps_max_accuracy_meters"] = (1, 500)
        };
        if (numericRanges.TryGetValue(key, out var range))
        {
            if (!double.TryParse(value, System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var number) ||
                !double.IsFinite(number) || number < range.Min || number > range.Max)
                return $"{key} must be a finite number between {range.Min} and {range.Max}.";
            return null;
        }

        if (key == "ride_destination_zones")
        {
            try
            {
                var zones = System.Text.Json.JsonSerializer.Deserialize<List<SupportedServiceZone>>(value ?? string.Empty);
                if (zones is null || zones.Count == 0 || zones.Any(zone => !IsValidZoneValue(zone)))
                    return "ride_destination_zones must contain one or more valid latitude/longitude bounds.";
                return null;
            }
            catch (System.Text.Json.JsonException)
            {
                return "ride_destination_zones must be valid JSON.";
            }
        }

        return null;
    }

    private static bool IsValidZoneValue(SupportedServiceZone zone) =>
        double.IsFinite(zone.MinLatitude) && double.IsFinite(zone.MaxLatitude) &&
        double.IsFinite(zone.MinLongitude) && double.IsFinite(zone.MaxLongitude) &&
        zone.MinLatitude >= -90 && zone.MaxLatitude <= 90 && zone.MinLatitude <= zone.MaxLatitude &&
        zone.MinLongitude >= -180 && zone.MaxLongitude <= 180 && zone.MinLongitude <= zone.MaxLongitude;
}
