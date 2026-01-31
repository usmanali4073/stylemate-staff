using Microsoft.AspNetCore.Authorization;
using staff_domain.Enums;

namespace staff_api.Authorization;

/// <summary>
/// Authorization requirement for permission-based access control.
/// Full implementation deferred to Phase 2 Plan 07 (Authorization Layer).
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    public PermissionLevel MinimumLevel { get; }

    public PermissionRequirement(PermissionLevel minimumLevel)
    {
        MinimumLevel = minimumLevel;
    }
}
