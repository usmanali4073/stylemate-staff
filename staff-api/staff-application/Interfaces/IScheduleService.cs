using staff_application.DTOs;

namespace staff_application.Interfaces;

public interface IScheduleService
{
    Task<List<ShiftResponse>> GetShiftsAsync(Guid businessId, DateOnly startDate, DateOnly endDate, Guid? staffMemberId = null);
    Task<ShiftResponse?> GetShiftAsync(Guid businessId, Guid shiftId);
    Task<ShiftResponse> CreateShiftAsync(Guid businessId, CreateShiftRequest request);
    Task<ShiftResponse?> UpdateShiftAsync(Guid businessId, Guid shiftId, UpdateShiftRequest request);
    Task<bool> DeleteShiftAsync(Guid businessId, Guid shiftId);
    Task<List<ShiftResponse>> BulkCreateShiftsAsync(Guid businessId, BulkCreateShiftRequest request);
    Task<List<ShiftConflictResponse>> CheckConflictsAsync(Guid businessId, Guid staffMemberId, DateOnly date, TimeOnly startTime, TimeOnly endTime, Guid? locationId = null, Guid? excludeShiftId = null);
}
