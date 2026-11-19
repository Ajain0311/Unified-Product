namespace SuperApp.API.Services;

public interface ITotpService
{
    string GenerateSecretKey(int byteLength = 20);
    bool VerifyCode(string secretKey, string code, int allowedDriftSteps = 1);
    bool VerifyCodeWithStep(string secretKey, string code, out long matchedStep, int allowedDriftSteps = 1);
    string GenerateTotpUri(string issuer, string accountLabel, string secretKey);
    List<string> GenerateRecoveryCodes(int count = 8);
    string HashRecoveryCode(string code);
    bool VerifyAndConsumeRecoveryCode(ref string? recoveryCodesStorage, string code);
    string EncryptSecret(string plainSecret);
    string DecryptSecret(string storedSecret);
}
