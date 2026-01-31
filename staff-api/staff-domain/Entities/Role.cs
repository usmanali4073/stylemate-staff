using System.ComponentModel.DataAnnotations;
using staff_domain.ValueObjects;

namespace staff_domain.Entities;

public class Role
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid BusinessId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsDefault { get; set; } = false;

    public bool IsImmutable { get; set; } = false;

    public RolePermissions Permissions { get; set; } = new RolePermissions();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
