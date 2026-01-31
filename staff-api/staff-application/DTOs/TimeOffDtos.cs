namespace staff_application.DTOs;

public class TimeOffTypeResponse
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTimeOffTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
}

public class UpdateTimeOffTypeRequest
{
    public string? Name { get; set; }
    public string? Color { get; set; }
    public bool? IsActive { get; set; }
}

public class TimeOffRequestResponse
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid StaffMemberId { get; set; }
    public string StaffMemberName { get; set; } = string.Empty;
    public Guid TimeOffTypeId { get; set; }
    public string TimeOffTypeName { get; set; } = string.Empty;
    public string TimeOffTypeColor { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public bool IsAllDay { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? ApprovalNotes { get; set; }
    public Guid? ApprovedByStaffId { get; set; }
    public string? ApprovedByStaffName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTimeOffRequest
{
    public Guid StaffMemberId { get; set; }
    public Guid TimeOffTypeId { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public bool IsAllDay { get; set; } = true;
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Notes { get; set; }
}

public class ApproveTimeOffRequest
{
    public string? ApprovalNotes { get; set; }
}

public class DenyTimeOffRequest
{
    public string? ApprovalNotes { get; set; }
}
