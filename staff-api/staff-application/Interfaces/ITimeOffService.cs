using staff_application.DTOs;

namespace staff_application.Interfaces;

public interface ITimeOffService
{
    // Time-off types
    Task<List<TimeOffTypeResponse>> GetTypesAsync(Guid businessId);
    Task<TimeOffTypeResponse?> GetTypeAsync(Guid businessId, Guid typeId);
    Task<TimeOffTypeResponse> CreateTypeAsync(Guid businessId, CreateTimeOffTypeRequest request);
    Task<TimeOffTypeResponse?> UpdateTypeAsync(Guid businessId, Guid typeId, UpdateTimeOffTypeRequest request);
    Task<bool> DeleteTypeAsync(Guid businessId, Guid typeId);
    Task EnsureDefaultTypesAsync(Guid businessId);

    // Time-off requests
    Task<List<TimeOffRequestResponse>> GetRequestsAsync(Guid businessId, Guid? staffMemberId = null, string? status = null);
    Task<TimeOffRequestResponse?> GetRequestAsync(Guid businessId, Guid requestId);
    Task<TimeOffRequestResponse> CreateRequestAsync(Guid businessId, CreateTimeOffRequest request);
    Task<TimeOffRequestResponse?> ApproveRequestAsync(Guid businessId, Guid requestId, Guid approverStaffId, ApproveTimeOffRequest request);
    Task<TimeOffRequestResponse?> DenyRequestAsync(Guid businessId, Guid requestId, Guid approverStaffId, DenyTimeOffRequest request);
    Task<TimeOffRequestResponse?> CancelRequestAsync(Guid businessId, Guid requestId);
    Task<int> GetPendingRequestsCountAsync(Guid businessId);
}
