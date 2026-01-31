using staff_application.DTOs;

namespace staff_application.Interfaces;

public interface IRoleService
{
    /// <summary>
    /// Get all roles for a business (auto-seeds defaults if missing)
    /// </summary>
    Task<List<RoleResponse>> GetRolesAsync(Guid businessId);

    /// <summary>
    /// Get a specific role by ID
    /// </summary>
    Task<RoleResponse?> GetRoleAsync(Guid businessId, Guid roleId);

    /// <summary>
    /// Create a new custom role
    /// </summary>
    Task<RoleResponse> CreateRoleAsync(Guid businessId, CreateRoleRequest request);

    /// <summary>
    /// Update an existing role (blocks immutable role name changes, allows permission updates on Manager/Employee)
    /// </summary>
    Task<RoleResponse?> UpdateRoleAsync(Guid businessId, Guid roleId, UpdateRoleRequest request);

    /// <summary>
    /// Delete a custom role (blocks default role deletion and roles in use)
    /// </summary>
    Task<bool> DeleteRoleAsync(Guid businessId, Guid roleId);

    /// <summary>
    /// Ensure default roles (Owner, Manager, Employee) exist for business (idempotent)
    /// </summary>
    Task EnsureDefaultRolesAsync(Guid businessId);

    /// <summary>
    /// Get permission areas with actions for UI rendering
    /// </summary>
    Task<List<PermissionAreaDto>> GetPermissionAreasAsync();

    /// <summary>
    /// Assign a role to a staff member at a specific location
    /// </summary>
    Task AssignRoleToStaffLocationAsync(Guid businessId, AssignRoleRequest request);
}
