namespace staff_application.DTOs;

public class AssignStaffServiceRequest
{
    public Guid ServiceId { get; set; }
}

public class StaffServiceResponse
{
    public Guid Id { get; set; }
    public Guid StaffMemberId { get; set; }
    public Guid ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public DateTime AssignedAt { get; set; }
}
