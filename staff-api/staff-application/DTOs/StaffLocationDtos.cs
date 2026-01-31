namespace staff_application.DTOs;

public class AssignStaffLocationRequest
{
    public Guid LocationId { get; set; }
    public bool IsPrimary { get; set; } = false;
}

public class StaffLocationResponse
{
    public Guid Id { get; set; }
    public Guid StaffMemberId { get; set; }
    public Guid LocationId { get; set; }
    public string? LocationName { get; set; }
    public bool IsPrimary { get; set; }
    public DateTime AssignedAt { get; set; }
}

public class UpdateStaffLocationRequest
{
    public bool IsPrimary { get; set; }
}
