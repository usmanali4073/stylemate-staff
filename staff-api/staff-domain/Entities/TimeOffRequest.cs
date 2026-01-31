using System.ComponentModel.DataAnnotations;
using staff_domain.Enums;

namespace staff_domain.Entities;

public class TimeOffRequest
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid BusinessId { get; set; }

    [Required]
    public Guid StaffMemberId { get; set; }

    [Required]
    public Guid TimeOffTypeId { get; set; }

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    public bool IsAllDay { get; set; } = true;

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public TimeOffStatus Status { get; set; } = TimeOffStatus.Pending;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(1000)]
    public string? ApprovalNotes { get; set; }

    public Guid? ApprovedByStaffId { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public StaffMember StaffMember { get; set; } = null!;
    public TimeOffType TimeOffType { get; set; } = null!;
}
