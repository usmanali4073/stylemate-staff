using Microsoft.AspNetCore.Authorization;

namespace staff_infrastructure.Authorization;

/// <summary>
/// Authorization requirement for role-based permission checking.
/// Used with PermissionAuthorizationHandler for resource-based authorization at specific locations.
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// The permission string in "Area.Action" format (e.g., "Scheduling.Manage")
    /// </summary>
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}
