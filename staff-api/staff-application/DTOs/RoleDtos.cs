namespace staff_application.DTOs;

/// <summary>
/// Role response DTO
/// </summary>
public class RoleResponse
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
    public bool IsImmutable { get; set; }
    public RolePermissionsDto Permissions { get; set; } = new RolePermissionsDto();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Role permissions DTO with all 16 permission flags
/// </summary>
public class RolePermissionsDto
{
    // Scheduling permissions
    public bool ViewSchedule { get; set; } = false;
    public bool ManageSchedule { get; set; } = false;

    // Time-off permissions
    public bool ViewTimeOff { get; set; } = false;
    public bool ManageTimeOff { get; set; } = false;
    public bool ApproveTimeOff { get; set; } = false;

    // Staff permissions
    public bool ViewStaff { get; set; } = false;
    public bool ManageStaff { get; set; } = false;

    // Services permissions
    public bool ViewServices { get; set; } = false;
    public bool ManageServices { get; set; } = false;

    // Clients permissions
    public bool ViewClients { get; set; } = false;
    public bool ManageClients { get; set; } = false;

    // Reports permissions
    public bool ViewReports { get; set; } = false;

    // Settings permissions
    public bool ManageBusinessSettings { get; set; } = false;
    public bool ManageLocationSettings { get; set; } = false;

    // Bookings permissions
    public bool ViewBookings { get; set; } = false;
    public bool ManageBookings { get; set; } = false;
}

/// <summary>
/// Create role request
/// </summary>
public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public RolePermissionsDto? Permissions { get; set; }
    public Guid? CloneFromRoleId { get; set; }
}

/// <summary>
/// Update role request
/// </summary>
public class UpdateRoleRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public RolePermissionsDto? Permissions { get; set; }
}

/// <summary>
/// Permission area for UI display
/// </summary>
public class PermissionAreaDto
{
    public string Area { get; set; } = string.Empty;
    public List<PermissionActionDto> Actions { get; set; } = new List<PermissionActionDto>();
}

/// <summary>
/// Permission action details
/// </summary>
public class PermissionActionDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool Enabled { get; set; } = false;
}

/// <summary>
/// Assign role to staff at location
/// </summary>
public class AssignRoleRequest
{
    public Guid StaffMemberId { get; set; }
    public Guid LocationId { get; set; }
    public Guid RoleId { get; set; }
}
