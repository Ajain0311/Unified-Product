using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SuperApp.API.Data;
using SuperApp.API.DTOs;
using SuperApp.API.Models;

namespace SuperApp.API.Services;

/// <summary>
/// Centralized service for managing and serving platform controls,
/// module visibility/ordering, theme permissions, and localization settings.
/// </summary>
public class PlatformConfigService
{
    public const string KeyModules = "platform_modules_config";
    public const string KeyTheme = "platform_theme_control";
    public const string KeyLanguage = "platform_language_control";
    public const string KeySettings = "platform_system_settings";

    private const string CacheKeyPublicControls = "platform_public_controls";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(2);

    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly ILogger<PlatformConfigService> _logger;

    public PlatformConfigService(AppDbContext db, IMemoryCache cache, ILogger<PlatformConfigService> logger)
    {
        _db = db;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Canonical default modules matching businessModules.ts.
    /// Used when database settings are uninitialized or corrupted.
    /// </summary>
    public static List<PlatformModuleConfigItem> GetDefaultModules() => new()
    {
        new PlatformModuleConfigItem
        {
            Id = "mod-hotels",
            Key = "hotels",
            NameEn = "Hotels & Stays",
            NameHi = "होटल और विश्राम",
            BadgeEn = "Live",
            BadgeHi = "लाइव",
            Icon = "bed",
            Route = "HotelHome",
            DescriptionEn = "Luxury resorts, boutique stays, anti-no-show booking",
            DescriptionHi = "शानदार रिसॉर्ट्स, बुटीक होटल और सुरक्षित बुकिंग",
            Category = "hospitality",
            IsEnabled = true,
            SortOrder = 1,
            RolesAllowed = new() { "CUSTOMER", "ADMIN" },
            LayoutVariant = "featured"
        },
        new PlatformModuleConfigItem
        {
            Id = "mod-food",
            Key = "food",
            NameEn = "Food Delivery",
            NameHi = "खाना डिलीवरी",
            BadgeEn = "Popular",
            BadgeHi = "लोकप्रिय",
            Icon = "fast-food",
            Route = "Food",
            DescriptionEn = "Top restaurants, hot meals & snacks delivered fast",
            DescriptionHi = "शीर्ष रेस्तरां, गरमा-गरम भोजन और त्वरित डिलीवरी",
            Category = "delivery",
            IsEnabled = true,
            SortOrder = 2,
            RolesAllowed = new() { "CUSTOMER", "VENDOR", "ADMIN" },
            LayoutVariant = "featured"
        },
        new PlatformModuleConfigItem
        {
            Id = "mod-rides",
            Key = "rides",
            NameEn = "Cabs & Rides",
            NameHi = "कैब और राइड्स",
            BadgeEn = "Instant",
            BadgeHi = "तुरंत",
            Icon = "car-sport",
            Route = "Rides",
            DescriptionEn = "City rides, auto, bike & outstation cabs at transparent fares",
            DescriptionHi = "किफायती और सुरक्षित ऑटो, बाइक एवं कैब राइड्स",
            Category = "mobility",
            IsEnabled = true,
            SortOrder = 3,
            RolesAllowed = new() { "CUSTOMER", "DRIVER", "ADMIN" },
            LayoutVariant = "featured"
        },
        new PlatformModuleConfigItem
        {
            Id = "mod-bazaar",
            Key = "bazaar",
            NameEn = "City Bazaar",
            NameHi = "सिटी बाज़ार",
            BadgeEn = "Shop",
            BadgeHi = "खरीदें",
            Icon = "bag-handle",
            Route = "Bazaar",
            DescriptionEn = "Local sellers, electronics, fashion and verified pre-owned items",
            DescriptionHi = "स्थानीय विक्रेता, इलेक्ट्रॉनिक्स, फैशन और सत्यापित वस्तुएं",
            Category = "commerce",
            IsEnabled = true,
            SortOrder = 4,
            RolesAllowed = new() { "CUSTOMER", "SELLER", "ADMIN" },
            LayoutVariant = "grid"
        },
        new PlatformModuleConfigItem
        {
            Id = "mod-bars",
            Key = "bars",
            NameEn = "Bars & Lounges",
            NameHi = "बार्स और लाउंज",
            BadgeEn = "New",
            BadgeHi = "नया",
            Icon = "wine",
            Route = "BarHub",
            DescriptionEn = "Nightlife, cocktail bars, craft breweries & VIP table reservations",
            DescriptionHi = "नाइटलाइफ़, कॉकटेल बार्स, क्राफ्ट ब्रुअरीज एवं वीआईपी टेबल बुकिंग",
            Category = "nightlife",
            IsEnabled = true,
            SortOrder = 5,
            RolesAllowed = new() { "CUSTOMER", "ADMIN" },
            LayoutVariant = "grid"
        },
        new PlatformModuleConfigItem
        {
            Id = "mod-beverages",
            Key = "beverages",
            NameEn = "Beverages & Cafe",
            NameHi = "कैफे और पेय",
            BadgeEn = "Fresh",
            BadgeHi = "ताज़ा",
            Icon = "cafe",
            Route = "BeverageHub",
            DescriptionEn = "Artisan coffee, bubble tea, fresh juices, and specialty brews",
            DescriptionHi = "स्पेशलिटी कॉफी, बबल टी, ताज़ा जूस एवं शेक्स",
            Category = "lifestyle",
            IsEnabled = true,
            SortOrder = 6,
            RolesAllowed = new() { "CUSTOMER", "ADMIN" },
            LayoutVariant = "grid"
        },
        new PlatformModuleConfigItem
        {
            Id = "mod-supplies",
            Key = "supplies",
            NameEn = "B2B Water Supplies",
            NameHi = "थोक पानी आपूर्ति",
            BadgeEn = "B2B",
            BadgeHi = "थोक",
            Icon = "water",
            Route = "B2BWaterSupplies",
            DescriptionEn = "Wholesale mineral water crates, glass bottles & bar soda for hotels & restaurants",
            DescriptionHi = "होटलों, बार्स और रेस्तरां के लिए थोक पानी की बोतलें एवं आपूर्ति",
            Category = "b2b",
            IsEnabled = true,
            SortOrder = 7,
            RolesAllowed = new() { "CUSTOMER", "VENDOR", "ADMIN" },
            LayoutVariant = "grid"
        }
    };

    public static PlatformThemeConfigDto GetDefaultThemeConfig() => new()
    {
        AllowUserThemeSwitch = true,
        DefaultTheme = "light"
    };

    public static PlatformLanguageConfigDto GetDefaultLanguageConfig() => new()
    {
        AllowUserLanguageSwitch = true,
        SupportedLanguages = new() { "en", "hi" },
        DefaultLanguage = "en"
    };

    public static Dictionary<string, string> GetDefaultSystemSettings() => new()
    {
        { "maintenance_mode", "false" },
        { "allow_guest_browsing", "true" },
        { "broadcast_announcement", "" }
    };

    /// <summary>
    /// Loads complete platform configuration for Master Admin control panel.
    /// </summary>
    public async Task<MasterAdminPlatformConfigResponse> GetMasterAdminConfigAsync()
    {
        var keys = new[] { KeyModules, KeyTheme, KeyLanguage, KeySettings };
        var settingsRows = await _db.AppSettings
            .AsNoTracking()
            .Where(s => keys.Contains(s.SettingKey))
            .ToListAsync();

        var modules = ParseSetting(settingsRows, KeyModules, GetDefaultModules);
        var theme = ParseSetting(settingsRows, KeyTheme, GetDefaultThemeConfig);
        var language = ParseSetting(settingsRows, KeyLanguage, GetDefaultLanguageConfig);
        var systemSettings = ParseSetting(settingsRows, KeySettings, GetDefaultSystemSettings);

        var latestUpdate = settingsRows
            .Where(r => r.UpdatedAt.HasValue)
            .OrderByDescending(r => r.UpdatedAt)
            .Select(r => r.UpdatedAt!.Value)
            .FirstOrDefault();

        if (latestUpdate == default)
            latestUpdate = DateTime.UtcNow;

        return new MasterAdminPlatformConfigResponse
        {
            Modules = modules.OrderBy(m => m.SortOrder).ToList(),
            Theme = theme,
            Language = language,
            SystemSettings = systemSettings,
            LastUpdatedAt = latestUpdate
        };
    }

    /// <summary>
    /// Retrieves lightweight cached public controls sent to client devices.
    /// </summary>
    public async Task<PlatformPublicControlsDto> GetPublicControlsAsync()
    {
        if (_cache.TryGetValue(CacheKeyPublicControls, out PlatformPublicControlsDto? cached) && cached != null)
        {
            return cached;
        }

        var adminConfig = await GetMasterAdminConfigAsync();
        var publicControls = new PlatformPublicControlsDto
        {
            Modules = adminConfig.Modules
                .OrderBy(m => m.SortOrder)
                .Select(m => new PlatformModulePublicDto
                {
                    Id = m.Id,
                    Key = m.Key,
                    NameEn = m.NameEn,
                    NameHi = m.NameHi,
                    BadgeEn = m.BadgeEn,
                    BadgeHi = m.BadgeHi,
                    Icon = m.Icon,
                    Route = m.Route,
                    Category = m.Category,
                    IsEnabled = m.IsEnabled,
                    SortOrder = m.SortOrder,
                    RolesAllowed = m.RolesAllowed,
                    LayoutVariant = m.LayoutVariant
                }).ToList(),
            Theme = adminConfig.Theme,
            Language = adminConfig.Language,
            SystemSettings = adminConfig.SystemSettings
        };

        _cache.Set(CacheKeyPublicControls, publicControls, CacheDuration);
        return publicControls;
    }

    /// <summary>
    /// Checks whether a specific ecosystem business module is active.
    /// Used by API filters to enforce killswitch restrictions.
    /// </summary>
    public async Task<bool> IsModuleEnabledAsync(string moduleKey)
    {
        if (string.IsNullOrWhiteSpace(moduleKey))
            return true;

        var publicControls = await GetPublicControlsAsync();
        var mod = publicControls.Modules.FirstOrDefault(m => string.Equals(m.Key, moduleKey.Trim(), StringComparison.OrdinalIgnoreCase));
        return mod == null || mod.IsEnabled;
    }

    /// <summary>
    /// Update module visibility and display sequence.
    /// </summary>
    public async Task UpdateModulesConfigAsync(List<PlatformModuleConfigItem> modules, long adminUserId)
    {
        if (modules == null || modules.Count == 0)
            throw new ArgumentException("Modules list cannot be empty");

        // Validate each module
        var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (int i = 0; i < modules.Count; i++)
        {
            var m = modules[i];
            if (string.IsNullOrWhiteSpace(m.Key))
                throw new ArgumentException($"Module at index {i} has an empty Key");
            if (string.IsNullOrWhiteSpace(m.NameEn))
                throw new ArgumentException($"Module '{m.Key}' must have a valid English name");
            if (!seenKeys.Add(m.Key))
                throw new ArgumentException($"Duplicate module Key detected: '{m.Key}'");
        }

        var json = JsonSerializer.Serialize(modules, new JsonSerializerOptions { WriteIndented = false });
        await UpsertAppSettingAsync(KeyModules, json, "Platform business modules enablements and sort order", adminUserId);
        InvalidateCache();
        _logger.LogInformation("[MasterAdminConfig] Business modules configuration updated by User #{AdminId} ({Count} modules)", adminUserId, modules.Count);
    }

    /// <summary>
    /// Update theme permissions and default theme.
    /// </summary>
    public async Task UpdateThemeConfigAsync(UpdateThemeConfigRequest request, long adminUserId)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        var cleanTheme = (request.DefaultTheme ?? "light").Trim().ToLowerInvariant();
        if (cleanTheme != "light" && cleanTheme != "dark")
            throw new ArgumentException("Default theme must be 'light' or 'dark'");

        var dto = new PlatformThemeConfigDto
        {
            AllowUserThemeSwitch = request.AllowUserThemeSwitch,
            DefaultTheme = cleanTheme
        };

        var json = JsonSerializer.Serialize(dto);
        await UpsertAppSettingAsync(KeyTheme, json, "Platform theme switcher permission and default theme mode", adminUserId);
        InvalidateCache();
        _logger.LogInformation("[MasterAdminConfig] Theme configuration updated by User #{AdminId}: Default={Theme}, AllowSwitch={Switch}", adminUserId, dto.DefaultTheme, dto.AllowUserThemeSwitch);
    }

    /// <summary>
    /// Update language permissions, default language, and active languages list.
    /// </summary>
    public async Task UpdateLanguageConfigAsync(UpdateLanguageConfigRequest request, long adminUserId)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (request.SupportedLanguages == null || request.SupportedLanguages.Count == 0)
            throw new ArgumentException("Supported languages list cannot be empty");

        var cleanSupported = request.SupportedLanguages
            .Where(l => !string.IsNullOrWhiteSpace(l))
            .Select(l => l.Trim().ToLowerInvariant())
            .Distinct()
            .ToList();

        if (cleanSupported.Count == 0)
            throw new ArgumentException("At least one valid supported language code is required");

        var cleanDefault = (request.DefaultLanguage ?? "en").Trim().ToLowerInvariant();
        if (!cleanSupported.Contains(cleanDefault))
            throw new ArgumentException($"Default language '{cleanDefault}' must be one of the supported languages: [{string.Join(", ", cleanSupported)}]");

        var dto = new PlatformLanguageConfigDto
        {
            AllowUserLanguageSwitch = request.AllowUserLanguageSwitch,
            SupportedLanguages = cleanSupported,
            DefaultLanguage = cleanDefault
        };

        var json = JsonSerializer.Serialize(dto);
        await UpsertAppSettingAsync(KeyLanguage, json, "Platform localization switcher permission and supported languages", adminUserId);
        InvalidateCache();
        _logger.LogInformation("[MasterAdminConfig] Language configuration updated by User #{AdminId}: Default={Default}, Supported=[{Supported}]", adminUserId, dto.DefaultLanguage, string.Join(",", dto.SupportedLanguages));
    }

    /// <summary>
    /// Update extensible system settings dictionary.
    /// </summary>
    public async Task UpdateSystemSettingsAsync(Dictionary<string, string> settings, long adminUserId)
    {
        if (settings == null)
            throw new ArgumentNullException(nameof(settings));

        // Validate key lengths
        foreach (var kvp in settings)
        {
            if (string.IsNullOrWhiteSpace(kvp.Key) || kvp.Key.Length > 100)
                throw new ArgumentException($"Setting key '{kvp.Key}' is invalid or exceeds 100 characters");
        }

        var json = JsonSerializer.Serialize(settings);
        await UpsertAppSettingAsync(KeySettings, json, "Platform system feature flags and settings", adminUserId);
        InvalidateCache();
        _logger.LogInformation("[MasterAdminConfig] System settings updated by User #{AdminId} ({Count} keys)", adminUserId, settings.Count);
    }

    private async Task UpsertAppSettingAsync(string key, string jsonValue, string description, long adminUserId)
    {
        var existing = await _db.AppSettings.FirstOrDefaultAsync(s => s.SettingKey == key);
        if (existing != null)
        {
            existing.SettingValue = jsonValue;
            existing.Description = description;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.AppSettings.Add(new AppSetting
            {
                SettingKey = key,
                SettingValue = jsonValue,
                Description = description,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
    }

    private void InvalidateCache()
    {
        _cache.Remove(CacheKeyPublicControls);
    }

    private static T ParseSetting<T>(List<AppSetting> rows, string key, Func<T> defaultFactory) where T : class
    {
        var row = rows.FirstOrDefault(r => r.SettingKey == key);
        if (row == null || string.IsNullOrWhiteSpace(row.SettingValue))
            return defaultFactory();

        try
        {
            var parsed = JsonSerializer.Deserialize<T>(row.SettingValue, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            return parsed ?? defaultFactory();
        }
        catch
        {
            return defaultFactory();
        }
    }
}
