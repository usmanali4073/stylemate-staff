namespace staff_application.Interfaces;

public interface IEmailService
{
    Task SendInvitationEmailAsync(string email, string name, string token, string businessName);
}
