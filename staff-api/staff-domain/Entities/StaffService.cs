using System.ComponentModel.DataAnnotations;

namespace staff_domain.Entities;

public class StaffService
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid StaffMemberId { get; set; }

    [Required]
    public Guid ServiceId { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation property (no cross-service navigation to Service entity)
    public StaffMember StaffMember { get; set; } = null!;
}
