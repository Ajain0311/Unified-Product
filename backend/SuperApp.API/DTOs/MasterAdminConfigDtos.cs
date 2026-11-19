using System.ComponentModel.DataAnnotations;

namespace SuperApp.API.DTOs;

/// <summary>
/// Configuration for a single business module on the platform.
/// </summary>
public class PlatformModuleConfigItem
{
    [Required, MaxLength(50)]
    public string Id { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Key { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string NameEn { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string NameHi { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? BadgeEn { get; set; }

    [MaxLength(50)]
    public string? BadgeHi { get; set; }

    [MaxLength(50)]
    public string Icon { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Route { get; set; } = string.Empty;

    [MaxLength(300)]
    public string DescriptionEn { get; set; } = string.Empty;

    [MaxLength(300)]
    public string DescriptionHi { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = "general";

    public bool IsEnabled { get; set; } = true;

    public int SortOrder { get; set; } = 0;

    public List<string> RolesAllowed { get; set; } = new();

    public string LayoutVariant { get; set; } = "grid";
}

/// <summary>
/// Configuration for theme controls across the platform.
/// </summary>
public class PlatformThemeConfigDto
{
    public bool AllowUserThemeSwitch { get; set; } = true;

    [Required, RegularExpression("^(light|dark)$", ErrorMessage = "Default theme must be 'light' or 'dark'")]
    public string DefaultTheme { get; set; } = "light";
}

/// <summary>
/// Configuration for localization and language switching.
/// </summary>
public class PlatformLanguageConfigDto
{
    public bool AllowUserLanguageSwitch { get; set; } = true;

    [Required, MinLength(1, ErrorMessage = "At least one supported language is required")]
    public List<string> SupportedLanguages { get; set; } = new() { "en", "hi" };

    [Required, MaxLength(10)]
    public string DefaultLanguage { get; set; } = "en";
}

/// <summary>
/// Extensible platform settings / feature flags dictionary.
/// </summary>
public class PlatformSystemSettingsDto
{
    public Dictionary<string, string> Settings { get; set; } = new();
}

/// <summary>
/// Master Admin comprehensive configuration response.
/// </summary>
public class MasterAdminPlatformConfigResponse
{
    public List<PlatformModuleConfigItem> Modules { get; set; } = new();
    public PlatformThemeConfigDto Theme { get; set; } = new();
    public PlatformLanguageConfigDto Language { get; set; } = new();
    public Dictionary<string, string> SystemSettings { get; set; } = new();
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
    public string? UpdatedByAdmin { get; set; }
}

/// <summary>
/// Public runtime controls sent to mobile client via /api/config.
/// </summary>
public class PlatformPublicControlsDto
{
    public List<PlatformModulePublicDto> Modules { get; set; } = new();
    public PlatformThemeConfigDto Theme { get; set; } = new();
    public PlatformLanguageConfigDto Language { get; set; } = new();
    public Dictionary<string, string> SystemSettings { get; set; } = new();
}

/// <summary>
/// Public module information for client rendering & navigation gating.
/// </summary>
public class PlatformModulePublicDto
{
    public string Id { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string NameHi { get; set; } = string.Empty;
    public string? BadgeEn { get; set; }
    public string? BadgeHi { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string Category { get; set; } = "general";
    public bool IsEnabled { get; set; } = true;
    public int SortOrder { get; set; }
    public List<string> RolesAllowed { get; set; } = new();
    public string LayoutVariant { get; set; } = "grid";
}

public class UpdateModulesConfigRequest
{
    [Required, MinLength(1, ErrorMessage = "Modules list cannot be empty")]
    public List<PlatformModuleConfigItem> Modules { get; set; } = new();
}

public class UpdateThemeConfigRequest
{
    public bool AllowUserThemeSwitch { get; set; } = true;

    [Required, RegularExpression("^(light|dark)$", ErrorMessage = "Default theme must be 'light' or 'dark'")]
    public string DefaultTheme { get; set; } = "light";
}

public class UpdateLanguageConfigRequest
{
    public bool AllowUserLanguageSwitch { get; set; } = true;

    [Required, MinLength(1, ErrorMessage = "At least one supported language is required")]
    public List<string> SupportedLanguages { get; set; } = new() { "en", "hi" };

    [Required, MaxLength(10)]
    public string DefaultLanguage { get; set; } = "en";
}

public class UpdateSystemSettingsRequest
{
    [Required]
    public Dictionary<string, string> Settings { get; set; } = new();
}
