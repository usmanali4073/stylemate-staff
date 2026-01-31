namespace staff_application.DTOs;

public class CreateShiftRequest
{
    public Guid StaffMemberId { get; set; }
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public string StartTime { get; set; } = string.Empty; // HH:mm
    public string EndTime { get; set; } = string.Empty; // HH:mm
    public string ShiftType { get; set; } = "Custom";
    public Guid? LocationId { get; set; }
    public string? Notes { get; set; }
}

public class UpdateShiftRequest
{
    public string? Date { get; set; } // yyyy-MM-dd
    public string? StartTime { get; set; } // HH:mm
    public string? EndTime { get; set; } // HH:mm
    public string? ShiftType { get; set; }
    public Guid? LocationId { get; set; }
    public string? Notes { get; set; }
    public string? Status { get; set; }
}

public class ShiftResponse
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid StaffMemberId { get; set; }
    public string StaffMemberName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public string StartTime { get; set; } = string.Empty; // HH:mm
    public string EndTime { get; set; } = string.Empty; // HH:mm
    public string ShiftType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? LocationId { get; set; }
    public string? LocationName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class BulkCreateShiftRequest
{
    public List<CreateShiftRequest> Shifts { get; set; } = new();
}

public class ShiftConflictResponse
{
    public string Type { get; set; } = string.Empty; // "overlap" | "overtime" | "location_conflict"
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "warning"; // "error" | "warning"
}
