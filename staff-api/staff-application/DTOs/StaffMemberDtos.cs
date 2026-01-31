using staff_domain.Enums;

namespace staff_application.DTOs;

public class CreateStaffMemberRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? JobTitle { get; set; }
    public string? PhotoUrl { get; set; }
    public PermissionLevel PermissionLevel { get; set; } = PermissionLevel.Basic;
    public bool IsBookable { get; set; } = true;
    public List<Guid>? LocationIds { get; set; }
}

public class UpdateStaffMemberRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public string? JobTitle { get; set; }
    public string? PhotoUrl { get; set; }
    public PermissionLevel? PermissionLevel { get; set; }
    public bool? IsBookable { get; set; }
}

public class StaffMemberResponse
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid? UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? JobTitle { get; set; }
    public string? PhotoUrl { get; set; }
    public string PermissionLevel { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsBookable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<StaffLocationResponse> Locations { get; set; } = new();
    public bool HasPendingInvitation { get; set; }
}

public class StaffMemberListResponse
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? PhotoUrl { get; set; }
    public string PermissionLevel { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool IsBookable { get; set; }
    public string? PrimaryLocationName { get; set; }
}

public class ChangeStaffStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
