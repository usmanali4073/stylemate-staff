using System.ComponentModel.DataAnnotations;

namespace staff_domain.Entities;

public class StaffLocation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid StaffMemberId { get; set; }

    [Required]
    public Guid LocationId { get; set; }

    public Guid? RoleId { get; set; }

    public bool IsPrimary { get; set; } = false;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties (no cross-service navigation to BusinessLocation)
    public StaffMember StaffMember { get; set; } = null!;
    public Role? Role { get; set; }
}
