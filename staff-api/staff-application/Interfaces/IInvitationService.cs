using staff_application.DTOs;

namespace staff_application.Interfaces;

public interface IInvitationService
{
    Task<InvitationResponse?> CreateInvitationAsync(Guid businessId, Guid staffId);
    Task<InvitationResponse?> ResendInvitationAsync(Guid businessId, Guid staffId);
    Task<bool> AcceptInvitationAsync(AcceptInvitationRequest request);
    Task<InvitationResponse?> GetLatestInvitationAsync(Guid staffId);
}
