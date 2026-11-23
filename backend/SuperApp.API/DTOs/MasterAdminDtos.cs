using System.ComponentModel.DataAnnotations;

namespace SuperApp.API.DTOs;

public class MasterAdminLoginRequest
{
    [Required]
    public string Identifier { get; set; } = string.Empty; // Email or Mobile or Username

    [Required]
    public string Password { get; set; } = string.Empty;

    public string? TotpCode { get; set; }

    public string? RecoveryCode { get; set; }
}

public class MasterAdminLoginResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Token { get; set; }
    public bool RequiresMfaEnrollment { get; set; }
    public string? TempEnrollmentToken { get; set; }
    public UserDto? User { get; set; }
    public List<string>? RecoveryCodes { get; set; }
}

public class MasterAdminTotpSetupResponse
{
    public string SecretKey { get; set; } = string.Empty;
    public string QrCodeUri { get; set; } = string.Empty;
    public List<string> RecoveryCodes { get; set; } = new();
    public string AccountLabel { get; set; } = string.Empty;
    public string Issuer { get; set; } = "Zupify";
}

public class MasterAdminConfirmTotpRequest
{
    [Required]
    public string SecretKey { get; set; } = string.Empty;

    [Required]
    [StringLength(6, MinimumLength = 6)]
    public string TotpCode { get; set; } = string.Empty;

    public List<string>? RecoveryCodes { get; set; }
}

public class MasterAdminAuthStatusDto
{
    public long UserId { get; set; }
    public string? Email { get; set; }
    public string? MobileNumber { get; set; }
    public string? FullName { get; set; }
    public bool IsTotpEnabled { get; set; }
    public List<string> Roles { get; set; } = new();
}
