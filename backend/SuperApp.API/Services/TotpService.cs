using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SuperApp.API.Services;

public class TotpService : ITotpService
{
    private const string Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private const int TimeStepSeconds = 30;
    private const int Digits = 6;
    private const string EncPrefix = "ENC:v1:";

    private readonly byte[] _encryptionKey;

    public TotpService(IConfiguration configuration)
    {
        var secret = Environment.GetEnvironmentVariable("TOTP_ENCRYPTION_KEY")
            ?? Environment.GetEnvironmentVariable("MFA_ENCRYPTION_KEY")
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? configuration["Mfa:EncryptionKey"]
            ?? configuration["Jwt:Secret"]
            ?? "SuperApp_Development_Secret_Key_2026_Must_Be_At_Least_32_Characters";

        _encryptionKey = HKDF.DeriveKey(
            HashAlgorithmName.SHA256,
            Encoding.UTF8.GetBytes(secret),
            32,
            Encoding.UTF8.GetBytes("zupify_totp_salt"),
            Encoding.UTF8.GetBytes("totp_encryption"));
    }

    public string GenerateSecretKey(int byteLength = 20)
    {
        var bytes = new byte[byteLength];
        RandomNumberGenerator.Fill(bytes);
        return ToBase32String(bytes);
    }

    public bool VerifyCode(string secretKey, string code, int allowedDriftSteps = 1)
    {
        return VerifyCodeWithStep(secretKey, code, out _, allowedDriftSteps);
    }

    public bool VerifyCodeWithStep(string secretKey, string code, out long matchedStep, int allowedDriftSteps = 1)
    {
        matchedStep = 0;
        if (string.IsNullOrWhiteSpace(secretKey) || string.IsNullOrWhiteSpace(code))
            return false;

        var cleanCode = code.Trim().Replace(" ", "").Replace("-", "");
        if (cleanCode.Length != Digits)
            return false;

        string decryptedSecret;
        try
        {
            decryptedSecret = DecryptSecret(secretKey);
        }
        catch
        {
            return false;
        }

        byte[] keyBytes;
        try
        {
            keyBytes = FromBase32String(decryptedSecret);
        }
        catch
        {
            return false;
        }

        var currentStep = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / TimeStepSeconds;

        for (var stepOffset = -allowedDriftSteps; stepOffset <= allowedDriftSteps; stepOffset++)
        {
            var step = currentStep + stepOffset;
            var expectedCode = ComputeTotp(keyBytes, step);
            if (CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(expectedCode),
                    Encoding.UTF8.GetBytes(cleanCode)))
            {
                matchedStep = step;
                return true;
            }
        }

        return false;
    }

    public string EncryptSecret(string plainSecret)
    {
        if (string.IsNullOrWhiteSpace(plainSecret)) return string.Empty;
        var clean = plainSecret.Trim().ToUpperInvariant();
        var plainBytes = Encoding.UTF8.GetBytes(clean);

        var nonce = new byte[12];
        RandomNumberGenerator.Fill(nonce);

        var tag = new byte[16];
        var cipher = new byte[plainBytes.Length];

        using var aes = new AesGcm(_encryptionKey, 16);
        aes.Encrypt(nonce, plainBytes, cipher, tag);

        var payload = new byte[nonce.Length + tag.Length + cipher.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, nonce.Length);
        Buffer.BlockCopy(tag, 0, payload, nonce.Length, tag.Length);
        Buffer.BlockCopy(cipher, 0, payload, nonce.Length + tag.Length, cipher.Length);

        return $"{EncPrefix}{Convert.ToBase64String(payload)}";
    }

    public string DecryptSecret(string storedSecret)
    {
        if (string.IsNullOrWhiteSpace(storedSecret)) return string.Empty;
        var trimmed = storedSecret.Trim();

        // Backward compatibility: If stored as plain Base32 without encryption prefix
        if (!trimmed.StartsWith(EncPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return trimmed.ToUpperInvariant();
        }

        var base64 = trimmed[EncPrefix.Length..];
        var payload = Convert.FromBase64String(base64);

        if (payload.Length < 28) // 12 nonce + 16 tag
            throw new CryptographicException("Invalid encrypted payload length");

        var nonce = new byte[12];
        var tag = new byte[16];
        var cipherLength = payload.Length - 28;
        var cipher = new byte[cipherLength];
        var plainBytes = new byte[cipherLength];

        Buffer.BlockCopy(payload, 0, nonce, 0, 12);
        Buffer.BlockCopy(payload, 12, tag, 0, 16);
        Buffer.BlockCopy(payload, 28, cipher, 0, cipherLength);

        using var aes = new AesGcm(_encryptionKey, 16);
        aes.Decrypt(nonce, cipher, tag, plainBytes);

        return Encoding.UTF8.GetString(plainBytes).Trim().ToUpperInvariant();
    }

    public string GenerateTotpUri(string issuer, string accountLabel, string secretKey)
    {
        var cleanIssuer = Uri.EscapeDataString(issuer.Trim());
        var cleanLabel = Uri.EscapeDataString(accountLabel.Trim());
        var plainSecret = DecryptSecret(secretKey);
        var cleanSecret = plainSecret.Trim().ToUpperInvariant();
        return $"otpauth://totp/{cleanIssuer}:{cleanLabel}?secret={cleanSecret}&issuer={cleanIssuer}&algorithm=SHA1&digits={Digits}&period={TimeStepSeconds}";
    }

    public List<string> GenerateRecoveryCodes(int count = 8)
    {
        var codes = new List<string>(count);
        for (var i = 0; i < count; i++)
        {
            var randomBytes = new byte[5];
            RandomNumberGenerator.Fill(randomBytes);
            // 8-character hex/alphanumeric code, formatted as XXXX-XXXX
            var rawHex = Convert.ToHexString(randomBytes).ToLowerInvariant();
            var formatted = $"{rawHex[..4]}-{rawHex[4..8]}";
            codes.Add(formatted);
        }
        return codes;
    }

    public string HashRecoveryCode(string code)
    {
        var normalized = code.Trim().Replace("-", "").ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public bool VerifyAndConsumeRecoveryCode(ref string? recoveryCodesStorage, string code)
    {
        if (string.IsNullOrWhiteSpace(recoveryCodesStorage) || string.IsNullOrWhiteSpace(code))
            return false;

        try
        {
            var hashedList = JsonSerializer.Deserialize<List<string>>(recoveryCodesStorage);
            if (hashedList == null || hashedList.Count == 0)
                return false;

            var targetHash = HashRecoveryCode(code);
            var index = hashedList.FindIndex(h => string.Equals(h, targetHash, StringComparison.OrdinalIgnoreCase));
            if (index >= 0)
            {
                hashedList.RemoveAt(index);
                recoveryCodesStorage = JsonSerializer.Serialize(hashedList);
                return true;
            }
        }
        catch
        {
            return false;
        }

        return false;
    }

    private static string ComputeTotp(byte[] key, long step)
    {
        var stepBytes = BitConverter.GetBytes(step);
        if (BitConverter.IsLittleEndian)
        {
            Array.Reverse(stepBytes);
        }

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(stepBytes);

        var offset = hash[^1] & 0x0F;
        var binary =
            ((hash[offset] & 0x7F) << 24) |
            ((hash[offset + 1] & 0xFF) << 16) |
            ((hash[offset + 2] & 0xFF) << 8) |
            (hash[offset + 3] & 0xFF);

        var modulo = (int)Math.Pow(10, Digits);
        var otp = binary % modulo;
        return otp.ToString(new string('0', Digits));
    }

    private static string ToBase32String(byte[] bytes)
    {
        if (bytes == null || bytes.Length == 0) return string.Empty;

        var sb = new StringBuilder();
        int buffer = 0;
        int bitsLeft = 0;

        foreach (var b in bytes)
        {
            buffer = (buffer << 8) | b;
            bitsLeft += 8;
            while (bitsLeft >= 5)
            {
                bitsLeft -= 5;
                var index = (buffer >> bitsLeft) & 0x1F;
                sb.Append(Base32Alphabet[index]);
            }
        }

        if (bitsLeft > 0)
        {
            var index = (buffer << (5 - bitsLeft)) & 0x1F;
            sb.Append(Base32Alphabet[index]);
        }

        return sb.ToString();
    }

    private static byte[] FromBase32String(string base32)
    {
        var clean = base32.Trim().TrimEnd('=').ToUpperInvariant();
        if (clean.Length == 0) return Array.Empty<byte>();

        var byteList = new List<byte>((clean.Length * 5) / 8);
        int buffer = 0;
        int bitsLeft = 0;

        foreach (var c in clean)
        {
            var val = Base32Alphabet.IndexOf(c);
            if (val < 0) throw new FormatException($"Invalid character '{c}' in base32 string.");

            buffer = (buffer << 5) | val;
            bitsLeft += 5;

            while (bitsLeft >= 8)
            {
                bitsLeft -= 8;
                byteList.Add((byte)((buffer >> bitsLeft) & 0xFF));
            }
        }

        return byteList.ToArray();
    }
}
