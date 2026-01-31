namespace staff_application.DTOs;

public class RecurringShiftPatternResponse
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid StaffMemberId { get; set; }
    public string StaffMemberName { get; set; } = string.Empty;
    public Guid? LocationId { get; set; }
    public string? LocationName { get; set; }
    public string RRule { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty; // HH:mm
    public string EndTime { get; set; } = string.Empty; // HH:mm
    public string PatternStart { get; set; } = string.Empty; // yyyy-MM-dd
    public string? PatternEnd { get; set; } // yyyy-MM-dd
    public string ShiftType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateRecurringShiftRequest
{
    public Guid StaffMemberId { get; set; }
    public Guid? LocationId { get; set; }
    public string RRule { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty; // HH:mm
    public string EndTime { get; set; } = string.Empty; // HH:mm
    public string PatternStart { get; set; } = string.Empty; // yyyy-MM-dd
    public string? PatternEnd { get; set; } // yyyy-MM-dd
    public string? ShiftType { get; set; }
    public string? Notes { get; set; }
}

public class UpdateRecurringShiftRequest
{
    public Guid? LocationId { get; set; }
    public string? RRule { get; set; }
    public string? StartTime { get; set; } // HH:mm
    public string? EndTime { get; set; } // HH:mm
    public string? PatternEnd { get; set; } // yyyy-MM-dd
    public string? ShiftType { get; set; }
    public string? Notes { get; set; }
    public bool? IsActive { get; set; }
}

public class ShiftOccurrence
{
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public string StartTime { get; set; } = string.Empty; // HH:mm
    public string EndTime { get; set; } = string.Empty; // HH:mm
    public Guid StaffMemberId { get; set; }
    public string StaffMemberName { get; set; } = string.Empty;
    public Guid? LocationId { get; set; }
    public string ShiftType { get; set; } = string.Empty;
    public bool IsFromPattern { get; set; }
    public Guid? PatternId { get; set; }
    public Guid? ShiftId { get; set; }
    public string? Notes { get; set; }
}

public class AvailabilitySlot
{
    public string Date { get; set; } = string.Empty; // yyyy-MM-dd
    public string StartTime { get; set; } = string.Empty; // HH:mm
    public string EndTime { get; set; } = string.Empty; // HH:mm
    public string Type { get; set; } = string.Empty; // "shift" | "time-off"
    public string Source { get; set; } = string.Empty; // pattern-id or shift-id or timeoff-id
}
