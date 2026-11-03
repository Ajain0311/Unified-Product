using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace SuperApp.API.Services;

/// <summary>
/// Free-for-dev Resend transactional email integration (3,000 emails/month free tier).
/// Portable, environment-driven, zero cost.
/// </summary>
public class ResendEmailService : IEmailService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(HttpClient http, IConfiguration config, ILogger<ResendEmailService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var apiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY") 
            ?? _config["Email:ResendApiKey"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogInformation("[Email:Resend] RESEND_API_KEY not configured. Simulating email dispatch to {Email}: {Subject}", toEmail, subject);
            return true;
        }

        try
        {
            var senderEmail = Environment.GetEnvironmentVariable("EMAIL_FROM") 
                ?? _config["Email:From"] 
                ?? "onboarding@resend.dev";

            var payload = new
            {
                from = senderEmail,
                to = new[] { toEmail },
                subject = subject,
                html = htmlBody
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _http.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("[Email:Resend] Email successfully sent to {Email}", toEmail);
                return true;
            }

            var errBody = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("[Email:Resend] Failed to send email to {Email}: StatusCode={Code}, Body={Body}", toEmail, response.StatusCode, errBody);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Email:Resend] Exception dispatching email to {Email}", toEmail);
            return false;
        }
    }
}
