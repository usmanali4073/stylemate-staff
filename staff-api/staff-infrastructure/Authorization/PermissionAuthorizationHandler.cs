using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using staff_domain.Enums;
using staff_infrastructure.Data;
using System.Security.Claims;

namespace staff_infrastructure.Authorization;

/// <summary>
/// Resource-based authorization handler that checks staff member permissions at specific locations.
/// Replaces the always-succeed stub from Phase 2.
///
/// Uses IServiceScopeFactory to access scoped DbContext from singleton handler.
/// Supports backward compatibility with PermissionLevel.Owner during migration.
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement, Guid>
{
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public PermissionAuthorizationHandler(IServiceScopeFactory serviceScopeFactory)
    {
        _serviceScopeFactory = serviceScopeFactory;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement,
        Guid locationId)
    {
        // Extract userId from claims
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            return; // No user ID in claims, fail authorization
        }

        // Create scope to access scoped DbContext from singleton handler
        using var scope = _serviceScopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<StaffManagementContext>();

        // Find staff member by UserId
        var staffMember = await dbContext.StaffMembers
            .Where(sm => sm.UserId == userId && !sm.IsDeleted)
            .FirstOrDefaultAsync();

        if (staffMember == null)
        {
            return; // No staff member found for this user, fail authorization
        }

        // Backward compatibility: If staff has Owner PermissionLevel (old enum), grant all access
        #pragma warning disable CS0618 // Type or member is obsolete
        if (staffMember.PermissionLevel == PermissionLevel.Owner)
        {
            context.Succeed(requirement);
            return;
        }
        #pragma warning restore CS0618

        // Find StaffLocation for this staff member at the given location
        var staffLocation = await dbContext.StaffLocations
            .Include(sl => sl.Role)
                .ThenInclude(r => r!.Permissions)
            .Where(sl => sl.StaffMemberId == staffMember.Id && sl.LocationId == locationId)
            .FirstOrDefaultAsync();

        if (staffLocation == null)
        {
            return; // Staff member not assigned to this location, fail authorization
        }

        if (staffLocation.RoleId == null || staffLocation.Role == null)
        {
            return; // No role assigned to this staff location, fail authorization
        }

        // Check if the role has the required permission
        if (staffLocation.Role.Permissions.HasPermission(requirement.Permission))
        {
            context.Succeed(requirement);
        }
    }
}
