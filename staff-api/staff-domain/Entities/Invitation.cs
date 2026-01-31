using System.ComponentModel.DataAnnotations;
using staff_domain.Enums;

namespace staff_domain.Entities;

public class Invitation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid StaffMemberId { get; set; }

    [Required]
    [MaxLength(128)]
    public string TokenHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public DateTime ExpiresAt { get; set; }

    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? AcceptedAt { get; set; }

    // Navigation property
    public StaffMember StaffMember { get; set; } = null!;
}
