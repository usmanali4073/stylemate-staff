using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FluentValidation;
using staff_application.DTOs;
using staff_application.Interfaces;

namespace staff_api.Controllers;

[ApiController]
[Route("api/businesses/{businessId}/schedule")]
[Authorize]
public class ScheduleController : ControllerBase
{
    private readonly IScheduleService _scheduleService;
    private readonly IValidator<CreateShiftRequest> _createValidator;
    private readonly IValidator<UpdateShiftRequest> _updateValidator;
    private readonly IValidator<BulkCreateShiftRequest> _bulkValidator;
    private readonly IValidator<CreateRecurringShiftRequest> _createRecurringValidator;
    private readonly IValidator<UpdateRecurringShiftRequest> _updateRecurringValidator;

    public ScheduleController(
        IScheduleService scheduleService,
        IValidator<CreateShiftRequest> createValidator,
        IValidator<UpdateShiftRequest> updateValidator,
        IValidator<BulkCreateShiftRequest> bulkValidator,
        IValidator<CreateRecurringShiftRequest> createRecurringValidator,
        IValidator<UpdateRecurringShiftRequest> updateRecurringValidator)
    {
        _scheduleService = scheduleService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _bulkValidator = bulkValidator;
        _createRecurringValidator = createRecurringValidator;
        _updateRecurringValidator = updateRecurringValidator;
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/schedule?startDate=&endDate=&staffMemberId=
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ShiftResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<ShiftResponse>>> GetShifts(
        Guid businessId,
        [FromQuery] string startDate,
        [FromQuery] string endDate,
        [FromQuery] Guid? staffMemberId = null)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        if (!DateOnly.TryParseExact(startDate, "yyyy-MM-dd", out var start))
            return BadRequest(new { error = "startDate must be in yyyy-MM-dd format" });

        if (!DateOnly.TryParseExact(endDate, "yyyy-MM-dd", out var end))
            return BadRequest(new { error = "endDate must be in yyyy-MM-dd format" });

        var shifts = await _scheduleService.GetShiftsAsync(businessId, start, end, staffMemberId);
        return Ok(shifts);
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/schedule/{shiftId}
    /// </summary>
    [HttpGet("{shiftId}")]
    [ProducesResponseType(typeof(ShiftResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ShiftResponse>> GetShift(Guid businessId, Guid shiftId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var shift = await _scheduleService.GetShiftAsync(businessId, shiftId);
        if (shift == null)
            return NotFound(new { error = "Shift not found" });

        return Ok(shift);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/schedule
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ShiftResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(List<ShiftConflictResponse>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ShiftResponse>> CreateShift(Guid businessId, [FromBody] CreateShiftRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

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

        // Check for conflicts before creating
        var forceCreate = Request.Headers.ContainsKey("X-Force-Create") &&
                          Request.Headers["X-Force-Create"].ToString().Equals("true", StringComparison.OrdinalIgnoreCase);

        if (!forceCreate)
        {
            var date = DateOnly.ParseExact(request.Date, "yyyy-MM-dd");
            var startTime = TimeOnly.ParseExact(request.StartTime, "HH:mm");
            var endTime = TimeOnly.ParseExact(request.EndTime, "HH:mm");

            var conflicts = await _scheduleService.CheckConflictsAsync(
                businessId, request.StaffMemberId, date, startTime, endTime, request.LocationId);

            if (conflicts.Any())
            {
                // If any errors exist, always block
                if (conflicts.Any(c => c.Severity == "error"))
                    return Conflict(conflicts);

                // If only warnings, return 409 so frontend can show them and let user override
                return Conflict(conflicts);
            }
        }

        try
        {
            var shift = await _scheduleService.CreateShiftAsync(businessId, request);
            return CreatedAtAction(nameof(GetShift), new { businessId, shiftId = shift.Id }, shift);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/schedule/bulk
    /// </summary>
    [HttpPost("bulk")]
    [ProducesResponseType(typeof(List<ShiftResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(List<ShiftConflictResponse>), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<List<ShiftResponse>>> BulkCreateShifts(Guid businessId, [FromBody] BulkCreateShiftRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var validationResult = await _bulkValidator.ValidateAsync(request);
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

        // Check for conflicts across all shifts before creating
        var forceCreate = Request.Headers.ContainsKey("X-Force-Create") &&
                          Request.Headers["X-Force-Create"].ToString().Equals("true", StringComparison.OrdinalIgnoreCase);

        if (!forceCreate)
        {
            var allConflicts = new List<ShiftConflictResponse>();

            foreach (var shiftReq in request.Shifts)
            {
                var date = DateOnly.ParseExact(shiftReq.Date, "yyyy-MM-dd");
                var startTime = TimeOnly.ParseExact(shiftReq.StartTime, "HH:mm");
                var endTime = TimeOnly.ParseExact(shiftReq.EndTime, "HH:mm");

                var conflicts = await _scheduleService.CheckConflictsAsync(
                    businessId, shiftReq.StaffMemberId, date, startTime, endTime, shiftReq.LocationId);

                allConflicts.AddRange(conflicts);
            }

            if (allConflicts.Any())
            {
                // Deduplicate conflicts by type+message
                var uniqueConflicts = allConflicts
                    .GroupBy(c => new { c.Type, c.Message })
                    .Select(g => g.First())
                    .ToList();

                return Conflict(uniqueConflicts);
            }
        }

        try
        {
            var shifts = await _scheduleService.BulkCreateShiftsAsync(businessId, request);
            return StatusCode(StatusCodes.Status201Created, shifts);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/businesses/{businessId}/schedule/{shiftId}
    /// </summary>
    [HttpPut("{shiftId}")]
    [ProducesResponseType(typeof(ShiftResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ShiftResponse>> UpdateShift(Guid businessId, Guid shiftId, [FromBody] UpdateShiftRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

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
            var shift = await _scheduleService.UpdateShiftAsync(businessId, shiftId, request);
            if (shift == null)
                return NotFound(new { error = "Shift not found" });

            return Ok(shift);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/businesses/{businessId}/schedule/{shiftId}
    /// </summary>
    [HttpDelete("{shiftId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteShift(Guid businessId, Guid shiftId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var deleted = await _scheduleService.DeleteShiftAsync(businessId, shiftId);
            if (!deleted)
                return NotFound(new { error = "Shift not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // Recurring shift pattern endpoints

    /// <summary>
    /// GET /api/businesses/{businessId}/schedule/patterns?staffMemberId=
    /// </summary>
    [HttpGet("patterns")]
    [ProducesResponseType(typeof(List<RecurringShiftPatternResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<RecurringShiftPatternResponse>>> GetRecurringPatterns(
        Guid businessId,
        [FromQuery] Guid? staffMemberId = null)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var patterns = await _scheduleService.GetRecurringPatternsAsync(businessId, staffMemberId);
        return Ok(patterns);
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/schedule/patterns/{patternId}
    /// </summary>
    [HttpGet("patterns/{patternId}")]
    [ProducesResponseType(typeof(RecurringShiftPatternResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecurringShiftPatternResponse>> GetRecurringPattern(
        Guid businessId,
        Guid patternId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var pattern = await _scheduleService.GetRecurringPatternAsync(businessId, patternId);
        if (pattern == null)
            return NotFound(new { error = "Recurring pattern not found" });

        return Ok(pattern);
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/schedule/patterns
    /// </summary>
    [HttpPost("patterns")]
    [ProducesResponseType(typeof(RecurringShiftPatternResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<RecurringShiftPatternResponse>> CreateRecurringPattern(
        Guid businessId,
        [FromBody] CreateRecurringShiftRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var validationResult = await _createRecurringValidator.ValidateAsync(request);
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
            var pattern = await _scheduleService.CreateRecurringPatternAsync(businessId, request);
            return CreatedAtAction(nameof(GetRecurringPattern), new { businessId, patternId = pattern.Id }, pattern);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// PUT /api/businesses/{businessId}/schedule/patterns/{patternId}
    /// </summary>
    [HttpPut("patterns/{patternId}")]
    [ProducesResponseType(typeof(RecurringShiftPatternResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecurringShiftPatternResponse>> UpdateRecurringPattern(
        Guid businessId,
        Guid patternId,
        [FromBody] UpdateRecurringShiftRequest request)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var validationResult = await _updateRecurringValidator.ValidateAsync(request);
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
            var pattern = await _scheduleService.UpdateRecurringPatternAsync(businessId, patternId, request);
            if (pattern == null)
                return NotFound(new { error = "Recurring pattern not found" });

            return Ok(pattern);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// DELETE /api/businesses/{businessId}/schedule/patterns/{patternId}
    /// </summary>
    [HttpDelete("patterns/{patternId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRecurringPattern(Guid businessId, Guid patternId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var deleted = await _scheduleService.DeleteRecurringPatternAsync(businessId, patternId);
        if (!deleted)
            return NotFound(new { error = "Recurring pattern not found" });

        return NoContent();
    }

    // Combined schedule and availability endpoints

    /// <summary>
    /// GET /api/businesses/{businessId}/schedule/occurrences?startDate=&endDate=&staffMemberId=&locationId=
    /// Returns combined one-off shifts and expanded recurring pattern occurrences
    /// </summary>
    [HttpGet("occurrences")]
    [ProducesResponseType(typeof(List<ShiftOccurrence>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<ShiftOccurrence>>> GetShiftOccurrences(
        Guid businessId,
        [FromQuery] string startDate,
        [FromQuery] string endDate,
        [FromQuery] Guid? staffMemberId = null,
        [FromQuery] Guid? locationId = null)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        if (!DateOnly.TryParseExact(startDate, "yyyy-MM-dd", out var start))
            return BadRequest(new { error = "startDate must be in yyyy-MM-dd format" });

        if (!DateOnly.TryParseExact(endDate, "yyyy-MM-dd", out var end))
            return BadRequest(new { error = "endDate must be in yyyy-MM-dd format" });

        var occurrences = await _scheduleService.GetShiftOccurrencesAsync(businessId, start, end, staffMemberId, locationId);
        return Ok(occurrences);
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/schedule/staff/{staffMemberId}/availability?startDate=&endDate=
    /// Returns combined shifts and approved time-off for a staff member
    /// </summary>
    [HttpGet("staff/{staffMemberId}/availability")]
    [ProducesResponseType(typeof(List<AvailabilitySlot>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<AvailabilitySlot>>> GetAvailability(
        Guid businessId,
        Guid staffMemberId,
        [FromQuery] string startDate,
        [FromQuery] string endDate)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        if (!DateOnly.TryParseExact(startDate, "yyyy-MM-dd", out var start))
            return BadRequest(new { error = "startDate must be in yyyy-MM-dd format" });

        if (!DateOnly.TryParseExact(endDate, "yyyy-MM-dd", out var end))
            return BadRequest(new { error = "endDate must be in yyyy-MM-dd format" });

        var availability = await _scheduleService.GetAvailabilityAsync(businessId, staffMemberId, start, end);
        return Ok(availability);
    }

    private Guid? GetUserIdFromJwt()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}
