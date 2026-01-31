using System.ComponentModel.DataAnnotations;
using staff_domain.Enums;

namespace staff_domain.Entities;

public class RecurringShiftPattern
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid BusinessId { get; set; }

    [Required]
    public Guid StaffMemberId { get; set; }

    public Guid? LocationId { get; set; }

    [Required]
    [MaxLength(500)]
    public string RRule { get; set; } = string.Empty;

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }

    [Required]
    public DateOnly PatternStart { get; set; }

    public DateOnly? PatternEnd { get; set; }

    public ShiftType ShiftType { get; set; } = ShiftType.Custom;

    [MaxLength(500)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public StaffMember StaffMember { get; set; } = null!;
}
