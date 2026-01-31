using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FluentValidation;
using staff_application.DTOs;
using staff_application.Interfaces;

namespace staff_api.Controllers;

/// <summary>
/// Role management controller for custom roles with granular permissions.
/// Nested routing under businesses: /api/businesses/{businessId}/roles
/// </summary>
[ApiController]
[Route("api/businesses/{businessId}/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;
    private readonly IValidator<CreateRoleRequest> _createValidator;
    private readonly IValidator<UpdateRoleRequest> _updateValidator;
    private readonly IValidator<AssignRoleRequest> _assignValidator;

    public RolesController(
        IRoleService roleService,
        IValidator<CreateRoleRequest> createValidator,
        IValidator<UpdateRoleRequest> updateValidator,
        IValidator<AssignRoleRequest> assignValidator)
    {
        _roleService = roleService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _assignValidator = assignValidator;
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/roles - Get all roles for business
    /// Auto-seeds default roles (Owner, Manager, Employee) if missing
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<RoleResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<RoleResponse>>> GetRoles(Guid businessId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var roles = await _roleService.GetRolesAsync(businessId);
        return Ok(roles);
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/roles/{roleId} - Get specific role by ID
    /// </summary>
    [HttpGet("{roleId}")]
    [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponse>> GetRole(Guid businessId, Guid roleId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var role = await _roleService.GetRoleAsync(businessId, roleId);
        if (role == null)
            return NotFound(new { error = "Role not found" });

        return Ok(role);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/roles - Create custom role
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<RoleResponse>> CreateRole(Guid businessId, [FromBody] CreateRoleRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        // Manual FluentValidation pattern
        var validationResult = await _createValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                errors = validationResult.Errors.Select(e => new
                {
                    property = e.PropertyName,
                    error = e.ErrorMessage
                })
            });
        }

        try
        {
            var role = await _roleService.CreateRoleAsync(businessId, request);
            return CreatedAtAction(nameof(GetRole), new { businessId, roleId = role.Id }, role);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/businesses/{businessId}/roles/{roleId} - Update role
    /// Blocks immutable role name changes; allows permission updates on Manager/Employee defaults
    /// </summary>
    [HttpPut("{roleId}")]
    [ProducesResponseType(typeof(RoleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoleResponse>> UpdateRole(Guid businessId, Guid roleId, [FromBody] UpdateRoleRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        // Manual FluentValidation pattern
        var validationResult = await _updateValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                errors = validationResult.Errors.Select(e => new
                {
                    property = e.PropertyName,
                    error = e.ErrorMessage
                })
            });
        }

        try
        {
            var role = await _roleService.UpdateRoleAsync(businessId, roleId, request);
            if (role == null)
                return NotFound(new { error = "Role not found" });

            return Ok(role);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/businesses/{businessId}/roles/{roleId} - Delete custom role
    /// Blocks deletion of default roles and roles assigned to staff
    /// </summary>
    [HttpDelete("{roleId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRole(Guid businessId, Guid roleId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var deleted = await _roleService.DeleteRoleAsync(businessId, roleId);
            if (!deleted)
                return NotFound(new { error = "Role not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/roles/permissions - Get permission areas for UI
    /// Static list of permission areas with action descriptions
    /// </summary>
    [HttpGet("permissions")]
    [ProducesResponseType(typeof(List<PermissionAreaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<PermissionAreaDto>>> GetPermissionAreas(Guid businessId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var areas = await _roleService.GetPermissionAreasAsync();
        return Ok(areas);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/roles/assign - Assign role to staff at location
    /// Updates StaffLocation.RoleId for the specified staff member and location
    /// </summary>
    [HttpPost("assign")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AssignRole(Guid businessId, [FromBody] AssignRoleRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        // Manual FluentValidation pattern
        var validationResult = await _assignValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return BadRequest(new
            {
                errors = validationResult.Errors.Select(e => new
                {
                    property = e.PropertyName,
                    error = e.ErrorMessage
                })
            });
        }

        try
        {
            await _roleService.AssignRoleToStaffLocationAsync(businessId, request);
            return Ok(new { message = "Role assigned successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private Guid? GetUserIdFromJwt()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}
