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

    // Recurring pattern methods
    Task<List<RecurringShiftPatternResponse>> GetRecurringPatternsAsync(Guid businessId, Guid? staffMemberId = null);
    Task<RecurringShiftPatternResponse?> GetRecurringPatternAsync(Guid businessId, Guid patternId);
    Task<RecurringShiftPatternResponse> CreateRecurringPatternAsync(Guid businessId, CreateRecurringShiftRequest request);
    Task<RecurringShiftPatternResponse?> UpdateRecurringPatternAsync(Guid businessId, Guid patternId, UpdateRecurringShiftRequest request);
    Task<bool> DeleteRecurringPatternAsync(Guid businessId, Guid patternId);

    // Combined schedule and availability
    Task<List<ShiftOccurrence>> GetShiftOccurrencesAsync(Guid businessId, DateOnly startDate, DateOnly endDate, Guid? staffMemberId = null, Guid? locationId = null);
    Task<List<AvailabilitySlot>> GetAvailabilityAsync(Guid businessId, Guid staffMemberId, DateOnly startDate, DateOnly endDate);
}
