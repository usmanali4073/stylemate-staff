using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FluentValidation;
using staff_application.DTOs;
using staff_application.Interfaces;
using staff_domain.Enums;

namespace staff_api.Controllers;

/// <summary>
/// Staff management controller with nested routing under businesses.
/// All endpoints require JWT authorization.
/// </summary>
[ApiController]
[Route("api/businesses/{businessId}/staff")]
[Authorize]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;
    private readonly IValidator<CreateStaffMemberRequest> _createValidator;
    private readonly IValidator<UpdateStaffMemberRequest> _updateValidator;
    private readonly IValidator<ChangeStaffStatusRequest> _statusValidator;
    private readonly IValidator<AssignStaffLocationRequest> _locationValidator;

    public StaffController(
        IStaffService staffService,
        IValidator<CreateStaffMemberRequest> createValidator,
        IValidator<UpdateStaffMemberRequest> updateValidator,
        IValidator<ChangeStaffStatusRequest> statusValidator,
        IValidator<AssignStaffLocationRequest> locationValidator)
    {
        _staffService = staffService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _statusValidator = statusValidator;
        _locationValidator = locationValidator;
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/staff - Get all staff members for business
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<StaffMemberListResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<StaffMemberListResponse>>> GetStaff(Guid businessId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var staff = await _staffService.GetBusinessStaffAsync(businessId);
        return Ok(staff);
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/staff/{staffId} - Get specific staff member details
    /// </summary>
    [HttpGet("{staffId}")]
    [ProducesResponseType(typeof(StaffMemberResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StaffMemberResponse>> GetStaffMember(Guid businessId, Guid staffId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var staff = await _staffService.GetStaffMemberAsync(businessId, staffId);
        if (staff == null)
            return NotFound(new { error = "Staff member not found" });

        return Ok(staff);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/staff - Create new staff member
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(StaffMemberResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<StaffMemberResponse>> CreateStaff(Guid businessId, [FromBody] CreateStaffMemberRequest request)
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
            var staff = await _staffService.CreateStaffMemberAsync(businessId, request);
            return CreatedAtAction(nameof(GetStaffMember), new { businessId, staffId = staff.Id }, staff);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/businesses/{businessId}/staff/{staffId} - Update staff member
    /// </summary>
    [HttpPut("{staffId}")]
    [ProducesResponseType(typeof(StaffMemberResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StaffMemberResponse>> UpdateStaff(Guid businessId, Guid staffId, [FromBody] UpdateStaffMemberRequest request)
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
            var staff = await _staffService.UpdateStaffMemberAsync(businessId, staffId, request);
            if (staff == null)
                return NotFound(new { error = "Staff member not found" });

            return Ok(staff);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/businesses/{businessId}/staff/{staffId}/status - Change staff member status
    /// </summary>
    [HttpPut("{staffId}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeStatus(Guid businessId, Guid staffId, [FromBody] ChangeStaffStatusRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        // Manual FluentValidation pattern
        var validationResult = await _statusValidator.ValidateAsync(request);
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
            // Parse status string to enum
            if (!Enum.TryParse<StaffStatus>(request.Status, true, out var status))
            {
                return BadRequest(new { error = "Invalid status value" });
            }

            var success = await _staffService.ChangeStaffStatusAsync(businessId, staffId, status);
            if (!success)
                return NotFound(new { error = "Staff member not found" });

            return Ok(new { message = $"Staff status changed to {request.Status} successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/businesses/{businessId}/staff/{staffId} - Delete archived staff member
    /// </summary>
    [HttpDelete("{staffId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStaff(Guid businessId, Guid staffId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var deleted = await _staffService.DeleteStaffMemberAsync(businessId, staffId);
            if (!deleted)
                return NotFound(new { error = "Staff member not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/businesses/{businessId}/staff/{staffId}/bookable - Toggle staff bookability
    /// </summary>
    [HttpPut("{staffId}/bookable")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleBookable(Guid businessId, Guid staffId, [FromBody] ToggleBookableRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var updateRequest = new UpdateStaffMemberRequest
            {
                IsBookable = request.IsBookable
            };

            var staff = await _staffService.UpdateStaffMemberAsync(businessId, staffId, updateRequest);
            if (staff == null)
                return NotFound(new { error = "Staff member not found" });

            return Ok(new { message = $"Staff bookability {(request.IsBookable ? "enabled" : "disabled")} successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // === Location Assignment Endpoints ===

    /// <summary>
    /// GET /api/businesses/{businessId}/staff/{staffId}/locations - Get staff location assignments
    /// </summary>
    [HttpGet("{staffId}/locations")]
    [ProducesResponseType(typeof(List<StaffLocationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<StaffLocationResponse>>> GetStaffLocations(Guid businessId, Guid staffId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var locations = await _staffService.GetStaffLocationsAsync(staffId);
        return Ok(locations);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/staff/{staffId}/locations - Assign staff to location
    /// </summary>
    [HttpPost("{staffId}/locations")]
    [ProducesResponseType(typeof(StaffLocationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<StaffLocationResponse>> AssignLocation(Guid businessId, Guid staffId, [FromBody] AssignStaffLocationRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        // Manual FluentValidation pattern
        var validationResult = await _locationValidator.ValidateAsync(request);
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
            var assignment = await _staffService.AssignStaffLocationAsync(businessId, staffId, request);
            if (assignment == null)
                return BadRequest(new { error = "Staff member not found or location already assigned" });

            return CreatedAtAction(nameof(GetStaffLocations), new { businessId, staffId }, assignment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/businesses/{businessId}/staff/{staffId}/locations/{locationId} - Remove location assignment
    /// </summary>
    [HttpDelete("{staffId}/locations/{locationId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveLocation(Guid businessId, Guid staffId, Guid locationId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var removed = await _staffService.RemoveStaffLocationAsync(staffId, locationId);
            if (!removed)
                return NotFound(new { error = "Location assignment not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/businesses/{businessId}/staff/{staffId}/locations/{locationId}/primary - Set primary location
    /// </summary>
    [HttpPut("{staffId}/locations/{locationId}/primary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetPrimaryLocation(Guid businessId, Guid staffId, Guid locationId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var success = await _staffService.SetPrimaryLocationAsync(staffId, locationId);
            if (!success)
                return NotFound(new { error = "Staff member or location assignment not found" });

            return Ok(new { message = "Primary location updated successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // === Service Assignment Endpoints ===

    /// <summary>
    /// GET /api/businesses/{businessId}/staff/{staffId}/services - Get staff service assignments
    /// </summary>
    [HttpGet("{staffId}/services")]
    [ProducesResponseType(typeof(List<StaffServiceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<StaffServiceResponse>>> GetStaffServices(Guid businessId, Guid staffId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var services = await _staffService.GetStaffServicesAsync(staffId);
        return Ok(services);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/staff/{staffId}/services - Assign staff to service
    /// </summary>
    [HttpPost("{staffId}/services")]
    [ProducesResponseType(typeof(StaffServiceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<StaffServiceResponse>> AssignService(Guid businessId, Guid staffId, [FromBody] AssignStaffServiceRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var assignment = await _staffService.AssignStaffServiceAsync(staffId, request);
            if (assignment == null)
                return BadRequest(new { error = "Staff member not found or service already assigned" });

            return CreatedAtAction(nameof(GetStaffServices), new { businessId, staffId }, assignment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/businesses/{businessId}/staff/{staffId}/services/{serviceId} - Remove service assignment
    /// </summary>
    [HttpDelete("{staffId}/services/{serviceId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveService(Guid businessId, Guid staffId, Guid serviceId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var removed = await _staffService.RemoveStaffServiceAsync(staffId, serviceId);
            if (!removed)
                return NotFound(new { error = "Service assignment not found" });

            return NoContent();
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

/// <summary>
/// Request to toggle staff bookability
/// </summary>
public record ToggleBookableRequest(bool IsBookable);
