using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using MimeKit;
using staff_application.Interfaces;

namespace staff_application.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendInvitationEmailAsync(string email, string name, string token, string businessName)
    {
        var smtpHost = _configuration["Smtp:Host"];
        var smtpPort = _configuration["Smtp:Port"];
        var smtpUsername = _configuration["Smtp:Username"];
        var smtpPassword = _configuration["Smtp:Password"];
        var fromEmail = _configuration["Smtp:FromEmail"] ?? "noreply@stylemate.com";
        var fromName = _configuration["Smtp:FromName"] ?? "StyleMate";

        // Build invitation link
        var invitationUrl = $"{_configuration["App:BaseUrl"]}/invite/accept?token={token}";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(new MailboxAddress(name, email));
        message.Subject = $"You're invited to join {businessName} on StyleMate";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 30px 20px; background-color: #f9fafb; }}
        .button {{ display: inline-block; padding: 12px 30px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to StyleMate</h1>
        </div>
        <div class='content'>
            <p>Hi {name},</p>
            <p>You've been invited to join <strong>{businessName}</strong> on StyleMate!</p>
            <p>Click the button below to accept your invitation and set up your account:</p>
            <div style='text-align: center;'>
                <a href='{invitationUrl}' class='button'>Accept Invitation</a>
            </div>
            <p style='color: #6b7280; font-size: 14px;'>Or copy and paste this link into your browser:<br>
            {invitationUrl}</p>
            <p style='color: #dc2626; font-size: 14px;'><strong>Important:</strong> This invitation will expire in 7 days.</p>
        </div>
        <div class='footer'>
            <p>&copy; 2026 StyleMate. All rights reserved.</p>
        </div>
    </div>
</body>
</html>"
        };

        message.Body = bodyBuilder.ToMessageBody();

        // Check if SMTP is configured
        if (string.IsNullOrEmpty(smtpHost))
        {
            // Development mode: Log to console instead of sending email
            Console.WriteLine("=== EMAIL (Development Mode) ===");
            Console.WriteLine($"To: {email} ({name})");
            Console.WriteLine($"Subject: {message.Subject}");
            Console.WriteLine($"Invitation URL: {invitationUrl}");
            Console.WriteLine($"Token: {token}");
            Console.WriteLine("================================");
            return;
        }

        // Production mode: Send email via SMTP
        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(smtpHost, int.Parse(smtpPort ?? "587"), MailKit.Security.SecureSocketOptions.StartTls);

            if (!string.IsNullOrEmpty(smtpUsername) && !string.IsNullOrEmpty(smtpPassword))
            {
                await client.AuthenticateAsync(smtpUsername, smtpPassword);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            // Log error and fall back to console output
            Console.WriteLine($"Email sending failed: {ex.Message}");
            Console.WriteLine("=== EMAIL (Fallback) ===");
            Console.WriteLine($"To: {email} ({name})");
            Console.WriteLine($"Invitation URL: {invitationUrl}");
            Console.WriteLine("========================");
            throw;
        }
    }
}
