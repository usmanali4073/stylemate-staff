using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using staff_application.DTOs;
using staff_application.Interfaces;
using staff_domain.Entities;
using staff_domain.Enums;
using staff_infrastructure.Data;

namespace staff_application.Services;

public class InvitationService : IInvitationService
{
    private readonly StaffManagementContext _context;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public InvitationService(
        StaffManagementContext context,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<InvitationResponse?> CreateInvitationAsync(Guid businessId, Guid staffId)
    {
        // Verify staff member exists and belongs to business
        var staffMember = await _context.StaffMembers
            .Where(s => s.BusinessId == businessId && s.Id == staffId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            return null;

        // Cancel all existing pending invitations for this staff member
        await CancelPendingInvitationsAsync(staffId);

        // Generate token (plaintext)
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");

        // Hash token for storage
        var tokenHash = ComputeTokenHash(token);

        // Create invitation
        var invitation = new Invitation
        {
            StaffMemberId = staffId,
            TokenHash = tokenHash,
            Email = staffMember.Email,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Status = InvitationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Invitations.Add(invitation);
        await _context.SaveChangesAsync();

        // Get business name for email
        var businessName = _configuration["Business:Name"] ?? "StyleMate Business";

        // Send invitation email with PLAINTEXT token
        await _emailService.SendInvitationEmailAsync(
            staffMember.Email,
            $"{staffMember.FirstName} {staffMember.LastName}",
            token,
            businessName
        );

        return MapToInvitationResponse(invitation);
    }

    public async Task<InvitationResponse?> ResendInvitationAsync(Guid businessId, Guid staffId)
    {
        // STAFF-16: Cancel existing invitations and create new one
        var staffMember = await _context.StaffMembers
            .Where(s => s.BusinessId == businessId && s.Id == staffId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            return null;

        // Cancel all existing pending invitations
        await CancelPendingInvitationsAsync(staffId);

        // Generate new token
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");

        // Hash token for storage
        var tokenHash = ComputeTokenHash(token);

        // Create new invitation
        var invitation = new Invitation
        {
            StaffMemberId = staffId,
            TokenHash = tokenHash,
            Email = staffMember.Email,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Status = InvitationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Invitations.Add(invitation);
        await _context.SaveChangesAsync();

        // Get business name for email
        var businessName = _configuration["Business:Name"] ?? "StyleMate Business";

        // Send invitation email with PLAINTEXT token
        await _emailService.SendInvitationEmailAsync(
            staffMember.Email,
            $"{staffMember.FirstName} {staffMember.LastName}",
            token,
            businessName
        );

        return MapToInvitationResponse(invitation);
    }

    public async Task<bool> AcceptInvitationAsync(AcceptInvitationRequest request)
    {
        // STAFF-03: Hash provided token and find by TokenHash
        var tokenHash = ComputeTokenHash(request.Token);

        var invitation = await _context.Invitations
            .Include(i => i.StaffMember)
            .Where(i => i.TokenHash == tokenHash && i.Status == InvitationStatus.Pending)
            .FirstOrDefaultAsync();

        if (invitation == null)
            return false;

        // Check if invitation has expired
        if (invitation.ExpiresAt <= DateTime.UtcNow)
        {
            invitation.Status = InvitationStatus.Expired;
            await _context.SaveChangesAsync();
            return false;
        }

        // Mark invitation as accepted
        invitation.Status = InvitationStatus.Accepted;
        invitation.AcceptedAt = DateTime.UtcNow;

        // Update staff member if optional fields provided
        if (!string.IsNullOrEmpty(request.FirstName))
            invitation.StaffMember.FirstName = request.FirstName;

        if (!string.IsNullOrEmpty(request.LastName))
            invitation.StaffMember.LastName = request.LastName;

        invitation.StaffMember.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Note: Password handling (request.Password) would be handled by auth service
        // This service just marks the invitation as accepted

        return true;
    }

    public async Task<InvitationResponse?> GetLatestInvitationAsync(Guid staffId)
    {
        var invitation = await _context.Invitations
            .Where(i => i.StaffMemberId == staffId)
            .OrderByDescending(i => i.CreatedAt)
            .FirstOrDefaultAsync();

        if (invitation == null)
            return null;

        return MapToInvitationResponse(invitation);
    }

    #region Helper Methods

    private async Task CancelPendingInvitationsAsync(Guid staffId)
    {
        var pendingInvitations = await _context.Invitations
            .Where(i => i.StaffMemberId == staffId && i.Status == InvitationStatus.Pending)
            .ToListAsync();

        foreach (var invitation in pendingInvitations)
        {
            invitation.Status = InvitationStatus.Cancelled;
        }

        if (pendingInvitations.Any())
        {
            await _context.SaveChangesAsync();
        }
    }

    private static string ComputeTokenHash(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(tokenBytes);
        return Convert.ToHexString(hashBytes).ToLower();
    }

    private static InvitationResponse MapToInvitationResponse(Invitation invitation)
    {
        return new InvitationResponse
        {
            Id = invitation.Id,
            StaffMemberId = invitation.StaffMemberId,
            Email = invitation.Email,
            Status = invitation.Status.ToString(),
            ExpiresAt = invitation.ExpiresAt,
            CreatedAt = invitation.CreatedAt,
            AcceptedAt = invitation.AcceptedAt,
            IsExpired = invitation.ExpiresAt <= DateTime.UtcNow && invitation.Status == InvitationStatus.Pending
        };
    }

    #endregion
}
