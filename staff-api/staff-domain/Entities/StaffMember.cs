using System.ComponentModel.DataAnnotations;
using staff_domain.Enums;
using staff_domain.Interfaces;

namespace staff_domain.Entities;

public class StaffMember : ISoftDeletable
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid BusinessId { get; set; }

    public Guid? UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    public string? JobTitle { get; set; }

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    public PermissionLevel PermissionLevel { get; set; } = PermissionLevel.Basic;

    public StaffStatus Status { get; set; } = StaffStatus.Active;

    public bool IsBookable { get; set; } = true;

    // ISoftDeletable implementation
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<StaffLocation> StaffLocations { get; set; } = new List<StaffLocation>();
    public ICollection<StaffService> StaffServices { get; set; } = new List<StaffService>();
    public ICollection<Invitation> Invitations { get; set; } = new List<Invitation>();
}
