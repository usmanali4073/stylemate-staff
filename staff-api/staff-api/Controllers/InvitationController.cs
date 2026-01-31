using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FluentValidation;
using staff_application.DTOs;
using staff_application.Interfaces;

namespace staff_api.Controllers;

/// <summary>
/// Invitation management controller.
/// Handles staff invitation creation, resending, acceptance, and status checking.
/// </summary>
[ApiController]
public class InvitationController : ControllerBase
{
    private readonly IInvitationService _invitationService;
    private readonly IValidator<AcceptInvitationRequest> _acceptValidator;

    public InvitationController(
        IInvitationService invitationService,
        IValidator<AcceptInvitationRequest> acceptValidator)
    {
        _invitationService = invitationService;
        _acceptValidator = acceptValidator;
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/staff/{staffId}/invite - Create and send invitation
    /// </summary>
    [HttpPost("api/businesses/{businessId}/staff/{staffId}/invite")]
    [Authorize]
    [ProducesResponseType(typeof(InvitationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvitationResponse>> CreateInvitation(Guid businessId, Guid staffId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var invitation = await _invitationService.CreateInvitationAsync(businessId, staffId);
            if (invitation == null)
                return NotFound(new { error = "Staff member not found or already has pending invitation" });

            return CreatedAtAction(nameof(GetInvitation), new { businessId, staffId }, invitation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/businesses/{businessId}/staff/{staffId}/invite/resend - Resend invitation
    /// </summary>
    [HttpPost("api/businesses/{businessId}/staff/{staffId}/invite/resend")]
    [Authorize]
    [ProducesResponseType(typeof(InvitationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvitationResponse>> ResendInvitation(Guid businessId, Guid staffId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        try
        {
            var invitation = await _invitationService.ResendInvitationAsync(businessId, staffId);
            if (invitation == null)
                return NotFound(new { error = "Staff member not found or no invitation to resend" });

            return Ok(invitation);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// POST /api/invitations/accept - Accept invitation (public endpoint)
    /// </summary>
    [HttpPost("api/invitations/accept")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptInvitation([FromBody] AcceptInvitationRequest request)
    {
        // Manual FluentValidation pattern
        var validationResult = await _acceptValidator.ValidateAsync(request);
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
            var accepted = await _invitationService.AcceptInvitationAsync(request);
            if (!accepted)
                return BadRequest(new { error = "Invalid or expired invitation token" });

            return Ok(new { message = "Invitation accepted successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// GET /api/businesses/{businessId}/staff/{staffId}/invitation - Get latest invitation status
    /// </summary>
    [HttpGet("api/businesses/{businessId}/staff/{staffId}/invitation")]
    [Authorize]
    [ProducesResponseType(typeof(InvitationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvitationResponse>> GetInvitation(Guid businessId, Guid staffId)
    {
        var userId = GetUserIdFromJwt();
        if (!userId.HasValue)
            return Unauthorized(new { error = "Invalid user token" });

        var invitation = await _invitationService.GetLatestInvitationAsync(staffId);
        if (invitation == null)
            return NotFound(new { error = "No invitation found for this staff member" });

        return Ok(invitation);
    }

    private Guid? GetUserIdFromJwt()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }
}
