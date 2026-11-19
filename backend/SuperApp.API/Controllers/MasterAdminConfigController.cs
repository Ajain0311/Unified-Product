using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SuperApp.API.DTOs;
using SuperApp.API.Services;

namespace SuperApp.API.Controllers;

/// <summary>
/// Dedicated control panel endpoints for Master Admin.
/// Manages ecosystem business modules, theme switcher, localization, and system settings.
/// Strictly protected by the 'MasterAdminOnly' policy (MASTER_ADMIN role + MFA verification).
/// </summary>
[ApiController]
[Route("api/master-admin/config")]
[Authorize(Policy = "MasterAdminOnly")]
public class MasterAdminConfigController : ControllerBase
{
    private readonly PlatformConfigService _configService;
    private readonly ILogger<MasterAdminConfigController> _logger;

    public MasterAdminConfigController(PlatformConfigService configService, ILogger<MasterAdminConfigController> logger)
    {
        _configService = configService;
        _logger = logger;
    }

    /// <summary>
    /// Get the complete platform configuration for the Master Admin dashboard.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<MasterAdminPlatformConfigResponse>>> GetConfig()
    {
        var config = await _configService.GetMasterAdminConfigAsync();
        return Ok(ApiResponse<MasterAdminPlatformConfigResponse>.Ok(config));
    }

    /// <summary>
    /// Update module visibility and ordering.
    /// </summary>
    [HttpPut("modules")]
    public async Task<ActionResult<ApiResponse<MasterAdminPlatformConfigResponse>>> UpdateModules([FromBody] UpdateModulesConfigRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<MasterAdminPlatformConfigResponse>.Fail("Invalid module configuration data"));

        var adminId = GetCurrentUserId();
        try
        {
            await _configService.UpdateModulesConfigAsync(request.Modules, adminId);
            var updated = await _configService.GetMasterAdminConfigAsync();
            return Ok(ApiResponse<MasterAdminPlatformConfigResponse>.Ok(updated, "Business modules updated successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<MasterAdminPlatformConfigResponse>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Update theme-switching permission and default theme.
    /// </summary>
    [HttpPut("theme")]
    public async Task<ActionResult<ApiResponse<MasterAdminPlatformConfigResponse>>> UpdateTheme([FromBody] UpdateThemeConfigRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<MasterAdminPlatformConfigResponse>.Fail("Invalid theme configuration"));

        var adminId = GetCurrentUserId();
        try
        {
            await _configService.UpdateThemeConfigAsync(request, adminId);
            var updated = await _configService.GetMasterAdminConfigAsync();
            return Ok(ApiResponse<MasterAdminPlatformConfigResponse>.Ok(updated, "Theme controls updated successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<MasterAdminPlatformConfigResponse>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Update language-switching permission, supported languages, and default language.
    /// </summary>
    [HttpPut("language")]
    public async Task<ActionResult<ApiResponse<MasterAdminPlatformConfigResponse>>> UpdateLanguage([FromBody] UpdateLanguageConfigRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<MasterAdminPlatformConfigResponse>.Fail("Invalid language configuration"));

        var adminId = GetCurrentUserId();
        try
        {
            await _configService.UpdateLanguageConfigAsync(request, adminId);
            var updated = await _configService.GetMasterAdminConfigAsync();
            return Ok(ApiResponse<MasterAdminPlatformConfigResponse>.Ok(updated, "Language controls updated successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<MasterAdminPlatformConfigResponse>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Update extensible platform system settings.
    /// </summary>
    [HttpPut("settings")]
    public async Task<ActionResult<ApiResponse<MasterAdminPlatformConfigResponse>>> UpdateSettings([FromBody] UpdateSystemSettingsRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<MasterAdminPlatformConfigResponse>.Fail("Invalid system settings"));

        var adminId = GetCurrentUserId();
        try
        {
            await _configService.UpdateSystemSettingsAsync(request.Settings, adminId);
            var updated = await _configService.GetMasterAdminConfigAsync();
            return Ok(ApiResponse<MasterAdminPlatformConfigResponse>.Ok(updated, "System settings updated successfully"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<MasterAdminPlatformConfigResponse>.Fail(ex.Message));
        }
    }

    private long GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(idClaim) && long.TryParse(idClaim, out var id))
        {
            return id;
        }
        return 0;
    }
}
