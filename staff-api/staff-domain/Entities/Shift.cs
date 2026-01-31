using System.ComponentModel.DataAnnotations;
using staff_domain.Enums;

namespace staff_domain.Entities;

public class Shift
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid BusinessId { get; set; }

    [Required]
    public Guid StaffMemberId { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }

    public ShiftType ShiftType { get; set; } = ShiftType.Custom;

    public ShiftStatus Status { get; set; } = ShiftStatus.Scheduled;

    public Guid? LocationId { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public StaffMember StaffMember { get; set; } = null!;
}
