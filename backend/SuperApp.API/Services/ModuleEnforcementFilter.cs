using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using SuperApp.API.DTOs;

namespace SuperApp.API.Services;

/// <summary>
/// Decorates controllers or actions with a module requirement.
/// If Master Admin has disabled the module via the control panel,
/// all incoming requests are blocked with HTTP 403 Forbidden.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public class RequireModuleEnabledAttribute : TypeFilterAttribute
{
    public RequireModuleEnabledAttribute(string moduleKey) : base(typeof(ModuleEnforcementFilter))
    {
        Arguments = new object[] { moduleKey };
    }
}

public class ModuleEnforcementFilter : IAsyncActionFilter
{
    private readonly string _moduleKey;
    private readonly PlatformConfigService _configService;
    private readonly ILogger<ModuleEnforcementFilter> _logger;

    public ModuleEnforcementFilter(
        string moduleKey,
        PlatformConfigService configService,
        ILogger<ModuleEnforcementFilter> logger)
    {
        _moduleKey = moduleKey;
        _configService = configService;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var isEnabled = await _configService.IsModuleEnabledAsync(_moduleKey);
        if (!isEnabled)
        {
            _logger.LogWarning(
                "[ModuleEnforcement] Request to {Path} rejected: module '{Module}' is currently disabled by Master Admin",
                context.HttpContext.Request.Path,
                _moduleKey
            );

            context.Result = new ObjectResult(new
            {
                success = false,
                message = $"The '{_moduleKey}' module is currently disabled by the platform administrator.",
                module = _moduleKey,
                code = "MODULE_DISABLED"
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
            return;
        }

        await next();
    }
}
