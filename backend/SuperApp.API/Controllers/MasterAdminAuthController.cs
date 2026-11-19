using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using SuperApp.API.Data;
using SuperApp.API.DTOs;
using SuperApp.API.Models;
using SuperApp.API.Services;

namespace SuperApp.API.Controllers;

[ApiController]
[Route("api/master-admin/auth")]
public class MasterAdminAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITotpService _totpService;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<MasterAdminAuthController> _logger;

    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan ReplayWindow = TimeSpan.FromSeconds(60);

    public MasterAdminAuthController(
        AppDbContext db,
        ITotpService totpService,
        ITokenService tokenService,
        IConfiguration configuration,
        IMemoryCache cache,
        ILogger<MasterAdminAuthController> logger)
    {
        _db = db;
        _totpService = totpService;
        _tokenService = tokenService;
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate Master Admin with Email/Mobile + Password + TOTP (or Recovery Code).
    /// Guarded by IP rate limiting, progressive account lockout, and TOTP replay protection.
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("otp-policy")]
    public async Task<ActionResult<MasterAdminLoginResponse>> Login([FromBody] MasterAdminLoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new MasterAdminLoginResponse { Success = false, Message = "Invalid request payload" });

        var identifier = request.Identifier.Trim();
        var lockKey = $"master_admin_lock_{identifier.ToLowerInvariant()}";
        var failKey = $"master_admin_fail_{identifier.ToLowerInvariant()}";

        // 1. Check Progressive Account Lockout
        if (_cache.TryGetValue(lockKey, out DateTime lockExpiresAt))
        {
            var remaining = (int)Math.Max(1, (lockExpiresAt - DateTime.UtcNow).TotalMinutes);
            _logger.LogWarning("[MasterAdminAuth] Login attempt on locked identifier {Identifier}", identifier);
            return StatusCode(429, new MasterAdminLoginResponse
            {
                Success = false,
                Message = $"Account is temporarily locked due to excessive failed attempts. Try again in {remaining} minute(s)."
            });
        }

        var cleanMobile = BigBSmsService.NormalizeMobileNumber(identifier);

        // Find user by Email, MobileNumber, or FullName
        var user = await _db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u =>
                (u.Email != null && u.Email.ToLower() == identifier.ToLower()) ||
                u.MobileNumber == identifier ||
                u.MobileNumber == cleanMobile);

        if (user == null)
        {
            RecordFailedAttempt(failKey, lockKey);
            _logger.LogWarning("[MasterAdminAuth] Failed login attempt for identifier {Identifier}: user not found", identifier);
            return Unauthorized(new MasterAdminLoginResponse { Success = false, Message = "Invalid credentials" });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new MasterAdminLoginResponse { Success = false, Message = "Account is deactivated" });
        }

        // Verify user possesses MASTER_ADMIN role
        var hasMasterAdminRole = user.UserRoles.Any(ur => ur.Role.Name == RoleNames.MasterAdmin);
        if (!hasMasterAdminRole)
        {
            RecordFailedAttempt(failKey, lockKey);
            _logger.LogWarning("[MasterAdminAuth] User #{UserId} ({Identifier}) lacks MASTER_ADMIN role", user.Id, identifier);
            return Unauthorized(new MasterAdminLoginResponse { Success = false, Message = "Access denied: Account is not authorized for Master Admin access." });
        }

        // 2. Verify Password with BCrypt
        var rawPassword = request.Password?.Trim();
        if (string.IsNullOrEmpty(user.PasswordHash) || string.IsNullOrEmpty(rawPassword) ||
            !BCrypt.Net.BCrypt.Verify(rawPassword, user.PasswordHash))
        {
            RecordFailedAttempt(failKey, lockKey);
            _logger.LogWarning("[MasterAdminAuth] Password verification failed for User #{UserId}", user.Id);
            return Unauthorized(new MasterAdminLoginResponse { Success = false, Message = "Invalid credentials" });
        }

        // 3. Check if MFA / TOTP is enrolled
        if (!user.IsTotpEnabled || string.IsNullOrWhiteSpace(user.TotpSecret))
        {
            _logger.LogInformation("[MasterAdminAuth] User #{UserId} has not enrolled in TOTP yet. Generating enrollment token.", user.Id);
            var enrollmentToken = GenerateTemporaryMfaToken(user, "mfa_enrollment", TimeSpan.FromMinutes(10));
            return Ok(new MasterAdminLoginResponse
            {
                Success = true,
                Message = "MFA Authenticator enrollment required. Please scan QR code to register your Authenticator app.",
                RequiresMfaEnrollment = true,
                TempEnrollmentToken = enrollmentToken,
                User = MapToUserDto(user)
            });
        }

        // 4. Verify MFA with Persistent Replay Protection: TOTP Code or Recovery Code
        var hasValidTotp = false;
        long matchedTimeStep = 0;

        if (!string.IsNullOrWhiteSpace(request.TotpCode))
        {
            hasValidTotp = _totpService.VerifyCodeWithStep(user.TotpSecret, request.TotpCode, out matchedTimeStep);

            // Replay Check: reject if this exact time-step was already used (Memory Cache L1 + Persistent Database L2)
            if (hasValidTotp)
            {
                var replayKey = $"totp_used_{user.Id}_{matchedTimeStep}";
                if (_cache.TryGetValue(replayKey, out _))
                {
                    _logger.LogWarning("[MasterAdminAuth] L1 Replay detected for User #{UserId} at step {Step}", user.Id, matchedTimeStep);
                    return BadRequest(new MasterAdminLoginResponse
                    {
                        Success = false,
                        Message = "This Authenticator code has already been used. Please wait for the next 30-second code from your app."
                    });
                }

                // L2 Persistent Database Replay Check (survives restarts & distributed instances)
                if (user.LastTotpStep.HasValue && matchedTimeStep <= user.LastTotpStep.Value)
                {
                    _logger.LogWarning("[MasterAdminAuth] L2 Persistent Replay detected for User #{UserId}. Step {Step} <= LastStep {LastStep}", user.Id, matchedTimeStep, user.LastTotpStep.Value);
                    return BadRequest(new MasterAdminLoginResponse
                    {
                        Success = false,
                        Message = "This Authenticator code has already been used. Please wait for the next 30-second code from your app."
                    });
                }

                if (_db.Database.IsRelational())
                {
                    var rows = await _db.Database.ExecuteSqlInterpolatedAsync(
                        $"UPDATE users SET last_totp_step = {matchedTimeStep}, last_login_at = {DateTime.UtcNow} WHERE id = {user.Id} AND (last_totp_step IS NULL OR last_totp_step < {matchedTimeStep})");
                    if (rows == 0)
                    {
                        _logger.LogWarning("[MasterAdminAuth] Concurrent TOTP replay step collision for User #{UserId} at step {Step}", user.Id, matchedTimeStep);
                        return BadRequest(new MasterAdminLoginResponse
                        {
                            Success = false,
                            Message = "This Authenticator code has already been used. Please wait for the next 30-second code from your app."
                        });
                    }
                }
                else
                {
                    user.LastTotpStep = matchedTimeStep;
                    await _db.SaveChangesAsync();
                }

                // Cache consumed step for 60 seconds
                _cache.Set(replayKey, true, ReplayWindow);
                user.LastTotpStep = matchedTimeStep;
            }
        }

        var hasValidRecovery = false;
        if (!hasValidTotp && !string.IsNullOrWhiteSpace(request.RecoveryCode))
        {
            var rawOldCodes = user.TotpRecoveryCodes;
            var recoveryCodesStorage = rawOldCodes;
            hasValidRecovery = _totpService.VerifyAndConsumeRecoveryCode(ref recoveryCodesStorage, request.RecoveryCode);
            if (hasValidRecovery)
            {
                if (_db.Database.IsRelational())
                {
                    // Atomic DB Compare-And-Swap (CAS) to eliminate concurrency races
                    var rows = await _db.Database.ExecuteSqlInterpolatedAsync(
                        $"UPDATE users SET totp_recovery_codes = {recoveryCodesStorage}, last_login_at = {DateTime.UtcNow} WHERE id = {user.Id} AND totp_recovery_codes = {rawOldCodes}");
                    
                    if (rows == 0)
                    {
                        _logger.LogWarning("[MasterAdminAuth] Concurrent recovery-code consumption collision for User #{UserId}", user.Id);
                        return Unauthorized(new MasterAdminLoginResponse
                        {
                            Success = false,
                            Message = "Recovery code was already used or invalidated"
                        });
                    }
                }
                else
                {
                    user.TotpRecoveryCodes = recoveryCodesStorage;
                    await _db.SaveChangesAsync();
                }

                user.TotpRecoveryCodes = recoveryCodesStorage;
                _logger.LogInformation("[MasterAdminAuth] User #{UserId} authenticated via one-time recovery code (atomic CAS verified)", user.Id);
            }
        }

        if (!hasValidTotp && !hasValidRecovery)
        {
            RecordFailedAttempt(failKey, lockKey);
            _logger.LogWarning("[MasterAdminAuth] Invalid TOTP / Recovery code for User #{UserId}", user.Id);
            return Unauthorized(new MasterAdminLoginResponse
            {
                Success = false,
                Message = "Invalid Authenticator code or recovery code"
            });
        }

        // Clear failed attempt tracking on successful authentication
        _cache.Remove(failKey);
        _cache.Remove(lockKey);

        // Update login timestamp
        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Issue privileged token with MASTER_ADMIN & ADMIN claims (8 hours lifetime)
        var token = GeneratePrivilegedMasterAdminToken(user);

        return Ok(new MasterAdminLoginResponse
        {
            Success = true,
            Message = "Master Admin authenticated successfully",
            Token = token,
            RequiresMfaEnrollment = false,
            User = MapToUserDto(user)
        });
    }

    /// <summary>
    /// Initiate TOTP setup: returns a new Base32 secret, otpauth QR URI, and backup recovery codes.
    /// Requires either active MASTER_ADMIN session or temporary MFA enrollment token.
    /// </summary>
    [HttpPost("setup-totp")]
    public async Task<ActionResult<ApiResponse<MasterAdminTotpSetupResponse>>> SetupTotp([FromHeader(Name = "X-MFA-Token")] string? mfaHeaderToken)
    {
        var user = await ResolveMasterAdminFromTokenAsync(mfaHeaderToken, allowEnrollmentToken: true);
        if (user == null)
            return Unauthorized(ApiResponse<MasterAdminTotpSetupResponse>.Fail("Invalid or expired session. Please login first."));

        // If user is already enrolled in TOTP, re-enrollment requires active authenticated session (not unverified enrollment token)
        if (user.IsTotpEnabled)
        {
            var activeSessionUser = await ResolveMasterAdminFromTokenAsync(mfaHeaderToken, allowEnrollmentToken: false);
            if (activeSessionUser == null)
            {
                return Unauthorized(ApiResponse<MasterAdminTotpSetupResponse>.Fail("Re-configuring Authenticator requires an active MFA-authenticated session."));
            }
        }

        var secret = _totpService.GenerateSecretKey();
        var label = !string.IsNullOrWhiteSpace(user.Email) ? user.Email : user.MobileNumber;
        var qrUri = _totpService.GenerateTotpUri("Zupify", label, secret);
        var recoveryCodes = _totpService.GenerateRecoveryCodes();

        var response = new MasterAdminTotpSetupResponse
        {
            SecretKey = secret,
            QrCodeUri = qrUri,
            RecoveryCodes = recoveryCodes,
            AccountLabel = label,
            Issuer = "Zupify"
        };

        return Ok(ApiResponse<MasterAdminTotpSetupResponse>.Ok(response, "Authenticator setup details generated"));
    }

    /// <summary>
    /// Finalize TOTP setup: verifies live 6-digit code, encrypts secret at rest with AES-GCM,
    /// hashes recovery codes, and enables TOTP.
    /// </summary>
    [HttpPost("confirm-totp")]
    public async Task<ActionResult<MasterAdminLoginResponse>> ConfirmTotp(
        [FromBody] MasterAdminConfirmTotpRequest request,
        [FromHeader(Name = "X-MFA-Token")] string? mfaHeaderToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(new MasterAdminLoginResponse { Success = false, Message = "Invalid payload" });

        var user = await ResolveMasterAdminFromTokenAsync(mfaHeaderToken, allowEnrollmentToken: true);
        if (user == null)
            return Unauthorized(new MasterAdminLoginResponse { Success = false, Message = "Invalid or expired session" });

        // Verify the code with the candidate secret
        var isValid = _totpService.VerifyCode(request.SecretKey, request.TotpCode);
        if (!isValid)
        {
            return BadRequest(new MasterAdminLoginResponse
            {
                Success = false,
                Message = "Invalid 6-digit code. Please verify the time on your authenticator device and retry."
            });
        }

        // Generate and save 8 recovery codes
        var recoveryCodes = _totpService.GenerateRecoveryCodes();
        var hashedCodes = recoveryCodes.Select(c => _totpService.HashRecoveryCode(c)).ToList();

        // Encrypt secret at rest using AES-GCM
        user.TotpSecret = _totpService.EncryptSecret(request.SecretKey.Trim());
        user.IsTotpEnabled = true;
        user.TotpRecoveryCodes = JsonSerializer.Serialize(hashedCodes);
        user.UpdatedAt = DateTime.UtcNow;
        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("[MasterAdminAuth] User #{UserId} successfully confirmed and activated TOTP MFA (encrypted at rest)", user.Id);

        var token = GeneratePrivilegedMasterAdminToken(user);

        return Ok(new MasterAdminLoginResponse
        {
            Success = true,
            Message = "Authenticator MFA successfully activated. Secure Master Admin session established.",
            Token = token,
            RequiresMfaEnrollment = false,
            User = MapToUserDto(user)
        });
    }

    /// <summary>
    /// Check current Master Admin MFA status. Strictly guarded by MasterAdminOnly policy (Role + MFA verified).
    /// </summary>
    [Authorize(Policy = "MasterAdminOnly")]
    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<MasterAdminAuthStatusDto>>> GetAuthStatus()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !long.TryParse(userIdStr, out var userId))
            return Unauthorized(ApiResponse<MasterAdminAuthStatusDto>.Fail("Invalid session"));

        var user = await _db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound(ApiResponse<MasterAdminAuthStatusDto>.Fail("User not found"));

        var dto = new MasterAdminAuthStatusDto
        {
            UserId = user.Id,
            Email = user.Email,
            MobileNumber = user.MobileNumber,
            FullName = user.FullName,
            IsTotpEnabled = user.IsTotpEnabled,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
        };

        return Ok(ApiResponse<MasterAdminAuthStatusDto>.Ok(dto));
    }

    // --- Private Helper Methods ---

    private void RecordFailedAttempt(string failKey, string lockKey)
    {
        var attempts = _cache.GetOrCreate(failKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = LockoutDuration;
            return 0;
        });

        attempts++;
        _cache.Set(failKey, attempts, LockoutDuration);

        if (attempts >= MaxFailedAttempts)
        {
            _cache.Set(lockKey, DateTime.UtcNow.Add(LockoutDuration), LockoutDuration);
            _logger.LogWarning("[MasterAdminAuth] Maximum failed attempts reached ({Attempts}). Lockout triggered for {Duration} minutes.",
                attempts, LockoutDuration.TotalMinutes);
        }
    }

    private async Task<User?> ResolveMasterAdminFromTokenAsync(string? headerToken, bool allowEnrollmentToken)
    {
        string? rawToken = null;

        if (!string.IsNullOrWhiteSpace(headerToken))
        {
            rawToken = headerToken.Trim();
        }
        else if (Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            var headerValue = authHeader.ToString();
            if (headerValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                rawToken = headerValue["Bearer ".Length..].Trim();
            }
        }

        if (string.IsNullOrWhiteSpace(rawToken))
            return null;

        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? _configuration["Jwt:Secret"]
            ?? "SuperApp_Development_Secret_Key_2026_Must_Be_At_Least_32_Characters";

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtSecret);

        try
        {
            var principal = tokenHandler.ValidateToken(rawToken, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.FromMinutes(2)
            }, out _);

            var purpose = principal.FindFirst("purpose")?.Value;
            var isMfaVerified = principal.FindFirst("mfa_verified")?.Value == "true";

            // If enrollment token is passed, verify purpose is explicitly mfa_enrollment
            if (purpose != null)
            {
                if (!allowEnrollmentToken || purpose != "mfa_enrollment")
                {
                    _logger.LogWarning("[MasterAdminAuth] Token purpose mismatch: {Purpose}", purpose);
                    return null;
                }
            }
            else if (!isMfaVerified && !allowEnrollmentToken)
            {
                return null;
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
                return null;

            var user = await _db.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user != null && user.UserRoles.Any(ur => ur.Role.Name == RoleNames.MasterAdmin))
            {
                return user;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("[MasterAdminAuth] Token validation error: {Message}", ex.Message);
        }

        return null;
    }

    private string GenerateTemporaryMfaToken(User user, string purpose, TimeSpan lifetime)
    {
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? _configuration["Jwt:Secret"]
            ?? "SuperApp_Development_Secret_Key_2026_Must_Be_At_Least_32_Characters";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.MobilePhone, user.MobileNumber),
            new("purpose", purpose),
            new("mfa_verified", "false")
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.Add(lifetime),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GeneratePrivilegedMasterAdminToken(User user)
    {
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? _configuration["Jwt:Secret"]
            ?? "SuperApp_Development_Secret_Key_2026_Must_Be_At_Least_32_Characters";
        var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? _configuration["Jwt:Issuer"]
            ?? "SuperApp";
        var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? _configuration["Jwt:Audience"]
            ?? "SuperApp";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.MobilePhone, user.MobileNumber),
            new(ClaimTypes.Name, user.FullName ?? user.MobileNumber),
            new(ClaimTypes.Role, RoleNames.MasterAdmin),
            new(ClaimTypes.Role, RoleNames.Admin),
            new(ClaimTypes.Role, RoleNames.Customer),
            new("mfa_verified", "true"),
            new("auth_type", "mfa_totp")
        };

        if (!string.IsNullOrEmpty(user.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, user.Email));
        }

        // High-security session: 8 hours expiry
        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapToUserDto(User user) => new()
    {
        Id = user.Id,
        MobileNumber = user.MobileNumber,
        FullName = user.FullName,
        Email = user.Email,
        ProfileImageUrl = user.ProfileImageUrl,
        Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
    };
}
