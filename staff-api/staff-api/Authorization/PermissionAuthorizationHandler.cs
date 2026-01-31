using Microsoft.AspNetCore.Authorization;

namespace staff_api.Authorization;

/// <summary>
/// Authorization handler stub for permission-based access control.
/// Always succeeds for now - full permission checking deferred to Phase 2 Plan 07.
/// TODO: Implement permission verification against JWT claims and business context.
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // Stub implementation: always succeed
        // Full permission checking will be implemented in Phase 2 Plan 07
        context.Succeed(requirement);
        return Task.CompletedTask;
    }
}
