using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FluentValidation;
using staff_application.DTOs;
using staff_application.Interfaces;

namespace staff_api.Controllers;

[ApiController]
[Route("api/businesses/{businessId}/time-off")]
[Authorize]
public class TimeOffController : ControllerBase
{
    private readonly ITimeOffService _timeOffService;
    private readonly IValidator<CreateTimeOffTypeRequest> _createTypeValidator;
    private readonly IValidator<UpdateTimeOffTypeRequest> _updateTypeValidator;
    private readonly IValidator<CreateTimeOffRequest> _createRequestValidator;
    private readonly IValidator<ApproveTimeOffRequest> _approveValidator;
    private readonly IValidator<DenyTimeOffRequest> _denyValidator;

    public TimeOffController(
        ITimeOffService timeOffService,
        IValidator<CreateTimeOffTypeRequest> createTypeValidator,
        IValidator<UpdateTimeOffTypeRequest> updateTypeValidator,
        IValidator<CreateTimeOffRequest> createRequestValidator,
        IValidator<ApproveTimeOffRequest> approveValidator,
        IValidator<DenyTimeOffRequest> denyValidator)
    {
        _timeOffService = timeOffService;
        _createTypeValidator = createTypeValidator;
        _updateTypeValidator = updateTypeValidator;
        _createRequestValidator = createRequestValidator;
        _approveValidator = approveValidator;
        _denyValidator = denyValidator;
    }

    // Time-off types

    /// <summary>
    /// GET /api/businesses/{businessId}/time-off/types
    /// </summary>
    [HttpGet("types")]
    [ProducesResponseType(typeof(List<TimeOffTypeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<TimeOffTypeResponse>>> GetTimeOffTypes(Guid businessId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var types = await _timeOffService.GetTypesAsync(businessId);
        return Ok(types);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/time-off/types
    /// </summary>
    [HttpPost("types")]
    [ProducesResponseType(typeof(TimeOffTypeResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TimeOffTypeResponse>> CreateTimeOffType(Guid businessId, [FromBody] CreateTimeOffTypeRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var validationResult = await _createTypeValidator.ValidateAsync(request);
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
            var type = await _timeOffService.CreateTypeAsync(businessId, request);
            return CreatedAtAction(nameof(GetTimeOffTypes), new { businessId }, type);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/businesses/{businessId}/time-off/types/{typeId}
    /// </summary>
    [HttpPut("types/{typeId}")]
    [ProducesResponseType(typeof(TimeOffTypeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeOffTypeResponse>> UpdateTimeOffType(Guid businessId, Guid typeId, [FromBody] UpdateTimeOffTypeRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var validationResult = await _updateTypeValidator.ValidateAsync(request);
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
            var type = await _timeOffService.UpdateTypeAsync(businessId, typeId, request);
            if (type == null)
                return NotFound(new { error = "Time-off type not found" });

            return Ok(type);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/businesses/{businessId}/time-off/types/{typeId}
    /// </summary>
    [HttpDelete("types/{typeId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTimeOffType(Guid businessId, Guid typeId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var deleted = await _timeOffService.DeleteTypeAsync(businessId, typeId);
            if (!deleted)
                return NotFound(new { error = "Time-off type not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Time-off requests

    /// <summary>
    /// GET /api/businesses/{businessId}/time-off/requests?staffMemberId=&status=
    /// </summary>
    [HttpGet("requests")]
    [ProducesResponseType(typeof(List<TimeOffRequestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<TimeOffRequestResponse>>> GetTimeOffRequests(
        Guid businessId,
        [FromQuery] Guid? staffMemberId = null,
        [FromQuery] string? status = null)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var requests = await _timeOffService.GetRequestsAsync(businessId, staffMemberId, status);
        return Ok(requests);
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/time-off/requests/{requestId}
    /// </summary>
    [HttpGet("requests/{requestId}")]
    [ProducesResponseType(typeof(TimeOffRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeOffRequestResponse>> GetTimeOffRequest(Guid businessId, Guid requestId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var request = await _timeOffService.GetRequestAsync(businessId, requestId);
        if (request == null)
            return NotFound(new { error = "Time-off request not found" });

        return Ok(request);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/time-off/requests
    /// </summary>
    [HttpPost("requests")]
    [ProducesResponseType(typeof(TimeOffRequestResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TimeOffRequestResponse>> CreateTimeOffRequest(Guid businessId, [FromBody] CreateTimeOffRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var validationResult = await _createRequestValidator.ValidateAsync(request);
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
            var timeOffRequest = await _timeOffService.CreateRequestAsync(businessId, request);
            return CreatedAtAction(nameof(GetTimeOffRequest), new { businessId, requestId = timeOffRequest.Id }, timeOffRequest);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/time-off/requests/{requestId}/approve
    /// </summary>
    [HttpPost("requests/{requestId}/approve")]
    [ProducesResponseType(typeof(TimeOffRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeOffRequestResponse>> ApproveTimeOffRequest(
        Guid businessId,
        Guid requestId,
        [FromBody] ApproveTimeOffRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var validationResult = await _approveValidator.ValidateAsync(request);
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
            // For now, use userId as approverStaffId
            // In real implementation, this would resolve from staff member lookup
            var timeOffRequest = await _timeOffService.ApproveRequestAsync(businessId, requestId, userId.Value, request);
            if (timeOffRequest == null)
                return NotFound(new { error = "Time-off request not found" });

            return Ok(timeOffRequest);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/time-off/requests/{requestId}/deny
    /// </summary>
    [HttpPost("requests/{requestId}/deny")]
    [ProducesResponseType(typeof(TimeOffRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeOffRequestResponse>> DenyTimeOffRequest(
        Guid businessId,
        Guid requestId,
        [FromBody] DenyTimeOffRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var validationResult = await _denyValidator.ValidateAsync(request);
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
            // For now, use userId as approverStaffId
            var timeOffRequest = await _timeOffService.DenyRequestAsync(businessId, requestId, userId.Value, request);
            if (timeOffRequest == null)
                return NotFound(new { error = "Time-off request not found" });

            return Ok(timeOffRequest);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/time-off/requests/{requestId}/cancel
    /// </summary>
    [HttpPost("requests/{requestId}/cancel")]
    [ProducesResponseType(typeof(TimeOffRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeOffRequestResponse>> CancelTimeOffRequest(Guid businessId, Guid requestId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var timeOffRequest = await _timeOffService.CancelRequestAsync(businessId, requestId);
            if (timeOffRequest == null)
                return NotFound(new { error = "Time-off request not found" });

            return Ok(timeOffRequest);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/time-off/requests/pending/count
    /// </summary>
    [HttpGet("requests/pending/count")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<int>> GetPendingCount(Guid businessId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var count = await _timeOffService.GetPendingRequestsCountAsync(businessId);
        return Ok(count);
    }

    private Guid? GetUserIdFromJwt()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}
