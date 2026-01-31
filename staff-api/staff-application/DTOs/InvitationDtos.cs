namespace staff_application.DTOs;

public class CreateInvitationRequest
{
    // Email comes from StaffMember, no body needed
}

public class InvitationResponse
{
    public Guid Id { get; set; }
    public Guid StaffMemberId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public bool IsExpired { get; set; }
}

public class AcceptInvitationRequest
{
    public string Token { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}
