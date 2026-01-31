using staff_application.DTOs;
using staff_domain.Enums;

namespace staff_application.Interfaces;

public interface IStaffService
{
    Task<List<StaffMemberListResponse>> GetBusinessStaffAsync(Guid businessId);
    Task<StaffMemberResponse?> GetStaffMemberAsync(Guid businessId, Guid staffId);
    Task<StaffMemberResponse> CreateStaffMemberAsync(Guid businessId, CreateStaffMemberRequest request);
    Task<StaffMemberResponse?> UpdateStaffMemberAsync(Guid businessId, Guid staffId, UpdateStaffMemberRequest request);
    Task<bool> ChangeStaffStatusAsync(Guid businessId, Guid staffId, StaffStatus newStatus);
    Task<bool> DeleteStaffMemberAsync(Guid businessId, Guid staffId);
    Task<List<StaffLocationResponse>> GetStaffLocationsAsync(Guid staffId);
    Task<StaffLocationResponse?> AssignStaffLocationAsync(Guid businessId, Guid staffId, AssignStaffLocationRequest request);
    Task<bool> RemoveStaffLocationAsync(Guid staffId, Guid locationId);
    Task<bool> SetPrimaryLocationAsync(Guid staffId, Guid locationId);
    Task<StaffServiceResponse?> AssignStaffServiceAsync(Guid staffId, AssignStaffServiceRequest request);
    Task<bool> RemoveStaffServiceAsync(Guid staffId, Guid serviceId);
    Task<List<StaffServiceResponse>> GetStaffServicesAsync(Guid staffId);
}
