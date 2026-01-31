namespace staff_domain.Enums;

[Obsolete("Use Role-based authorization. Will be removed in Phase 4.")]
public enum PermissionLevel
{
    Basic = 0,
    Low = 1,
    Medium = 2,
    High = 3,
    Owner = 4
}
