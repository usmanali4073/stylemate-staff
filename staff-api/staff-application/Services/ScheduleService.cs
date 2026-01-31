using Microsoft.EntityFrameworkCore;
using staff_application.DTOs;
using staff_application.Interfaces;
using staff_domain.Entities;
using staff_domain.Enums;
using staff_infrastructure.Data;

namespace staff_application.Services;

public class ScheduleService : IScheduleService
{
    private readonly StaffManagementContext _context;
    private const double OvertimeThresholdHours = 40.0;

    public ScheduleService(StaffManagementContext context)
    {
        _context = context;
    }

    public async Task<List<ShiftResponse>> GetShiftsAsync(Guid businessId, DateOnly startDate, DateOnly endDate, Guid? staffMemberId = null)
    {
        var query = _context.Shifts
            .AsNoTracking()
            .Include(s => s.StaffMember)
            .Where(s => s.BusinessId == businessId && s.Date >= startDate && s.Date <= endDate);

        if (staffMemberId.HasValue)
            query = query.Where(s => s.StaffMemberId == staffMemberId.Value);

        var shifts = await query.OrderBy(s => s.Date).ThenBy(s => s.StartTime).ToListAsync();

        return shifts.Select(MapToResponse).ToList();
    }

    public async Task<ShiftResponse?> GetShiftAsync(Guid businessId, Guid shiftId)
    {
        var shift = await _context.Shifts
            .AsNoTracking()
            .Include(s => s.StaffMember)
            .Where(s => s.BusinessId == businessId && s.Id == shiftId)
            .FirstOrDefaultAsync();

        return shift == null ? null : MapToResponse(shift);
    }

    public async Task<ShiftResponse> CreateShiftAsync(Guid businessId, CreateShiftRequest request)
    {
        var staffMember = await _context.StaffMembers
            .Where(s => s.BusinessId == businessId && s.Id == request.StaffMemberId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            throw new InvalidOperationException("Staff member not found in this business");

        var date = DateOnly.ParseExact(request.Date, "yyyy-MM-dd");
        var startTime = TimeOnly.ParseExact(request.StartTime, "HH:mm");
        var endTime = TimeOnly.ParseExact(request.EndTime, "HH:mm");

        if (!Enum.TryParse<ShiftType>(request.ShiftType, true, out var shiftType))
            shiftType = ShiftType.Custom;

        var shift = new Shift
        {
            BusinessId = businessId,
            StaffMemberId = request.StaffMemberId,
            Date = date,
            StartTime = startTime,
            EndTime = endTime,
            ShiftType = shiftType,
            Status = ShiftStatus.Scheduled,
            LocationId = request.LocationId,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Shifts.Add(shift);
        await _context.SaveChangesAsync();

        shift.StaffMember = staffMember;
        return MapToResponse(shift);
    }

    public async Task<ShiftResponse?> UpdateShiftAsync(Guid businessId, Guid shiftId, UpdateShiftRequest request)
    {
        var shift = await _context.Shifts
            .Include(s => s.StaffMember)
            .Where(s => s.BusinessId == businessId && s.Id == shiftId)
            .FirstOrDefaultAsync();

        if (shift == null)
            return null;

        if (request.Date != null)
            shift.Date = DateOnly.ParseExact(request.Date, "yyyy-MM-dd");

        if (request.StartTime != null)
            shift.StartTime = TimeOnly.ParseExact(request.StartTime, "HH:mm");

        if (request.EndTime != null)
            shift.EndTime = TimeOnly.ParseExact(request.EndTime, "HH:mm");

        if (request.ShiftType != null && Enum.TryParse<ShiftType>(request.ShiftType, true, out var shiftType))
            shift.ShiftType = shiftType;

        if (request.Status != null && Enum.TryParse<ShiftStatus>(request.Status, true, out var status))
            shift.Status = status;

        if (request.LocationId.HasValue)
            shift.LocationId = request.LocationId;

        if (request.Notes != null)
            shift.Notes = request.Notes;

        shift.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(shift);
    }

    public async Task<bool> DeleteShiftAsync(Guid businessId, Guid shiftId)
    {
        var shift = await _context.Shifts
            .Where(s => s.BusinessId == businessId && s.Id == shiftId)
            .FirstOrDefaultAsync();

        if (shift == null)
            return false;

        if (shift.Status == ShiftStatus.Completed)
            throw new InvalidOperationException("Cannot delete a completed shift");

        _context.Shifts.Remove(shift);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<ShiftResponse>> BulkCreateShiftsAsync(Guid businessId, BulkCreateShiftRequest request)
    {
        var results = new List<ShiftResponse>();

        foreach (var shiftRequest in request.Shifts)
        {
            var response = await CreateShiftAsync(businessId, shiftRequest);
            results.Add(response);
        }

        return results;
    }

    public async Task<List<ShiftConflictResponse>> CheckConflictsAsync(
        Guid businessId, Guid staffMemberId, DateOnly date,
        TimeOnly startTime, TimeOnly endTime, Guid? locationId = null, Guid? excludeShiftId = null)
    {
        var conflicts = new List<ShiftConflictResponse>();

        // Check overlapping shifts (same staff, same time — true double-booking)
        var overlappingQuery = _context.Shifts
            .AsNoTracking()
            .Where(s => s.BusinessId == businessId
                && s.StaffMemberId == staffMemberId
                && s.Date == date
                && s.StartTime < endTime
                && s.EndTime > startTime);

        if (excludeShiftId.HasValue)
            overlappingQuery = overlappingQuery.Where(s => s.Id != excludeShiftId.Value);

        var overlapping = await overlappingQuery.ToListAsync();

        if (overlapping.Any())
        {
            // Separate into same-location overlaps (error) and different-location overlaps (warning)
            var sameLocationOverlaps = locationId.HasValue
                ? overlapping.Where(s => s.LocationId == locationId.Value).ToList()
                : overlapping;
            var differentLocationOverlaps = locationId.HasValue
                ? overlapping.Where(s => s.LocationId.HasValue && s.LocationId != locationId.Value).ToList()
                : new List<Shift>();

            if (sameLocationOverlaps.Any())
            {
                conflicts.Add(new ShiftConflictResponse
                {
                    Type = "overlap",
                    Message = $"Staff member has {sameLocationOverlaps.Count} overlapping shift(s) on this date at the same location",
                    Severity = "error"
                });
            }

            if (differentLocationOverlaps.Any())
            {
                conflicts.Add(new ShiftConflictResponse
                {
                    Type = "location_conflict",
                    Message = $"Staff member is already scheduled at another location during this time ({differentLocationOverlaps.Count} conflicting shift(s))",
                    Severity = "warning"
                });
            }

            // Overlaps with no location set — treat as error (exact duplicate)
            var noLocationOverlaps = locationId.HasValue
                ? overlapping.Where(s => !s.LocationId.HasValue).ToList()
                : new List<Shift>();
            if (noLocationOverlaps.Any() && !sameLocationOverlaps.Any())
            {
                conflicts.Add(new ShiftConflictResponse
                {
                    Type = "overlap",
                    Message = $"Staff member has {noLocationOverlaps.Count} overlapping shift(s) on this date",
                    Severity = "error"
                });
            }
        }

        // Check weekly overtime (40h threshold)
        var weekStart = date.AddDays(-(int)date.DayOfWeek);
        var weekEnd = weekStart.AddDays(6);

        var weeklyShiftsQuery = _context.Shifts
            .AsNoTracking()
            .Where(s => s.BusinessId == businessId
                && s.StaffMemberId == staffMemberId
                && s.Date >= weekStart
                && s.Date <= weekEnd);

        if (excludeShiftId.HasValue)
            weeklyShiftsQuery = weeklyShiftsQuery.Where(s => s.Id != excludeShiftId.Value);

        var weeklyShifts = await weeklyShiftsQuery.ToListAsync();

        var existingHours = weeklyShifts.Sum(s =>
            (s.EndTime.ToTimeSpan() - s.StartTime.ToTimeSpan()).TotalHours);
        var newShiftHours = (endTime.ToTimeSpan() - startTime.ToTimeSpan()).TotalHours;
        var totalHours = existingHours + newShiftHours;

        if (totalHours > OvertimeThresholdHours)
        {
            conflicts.Add(new ShiftConflictResponse
            {
                Type = "overtime",
                Message = $"Weekly hours ({totalHours:F1}h) would exceed {OvertimeThresholdHours}h threshold",
                Severity = "warning"
            });
        }

        return conflicts;
    }

    private static ShiftResponse MapToResponse(Shift shift)
    {
        return new ShiftResponse
        {
            Id = shift.Id,
            BusinessId = shift.BusinessId,
            StaffMemberId = shift.StaffMemberId,
            StaffMemberName = shift.StaffMember != null
                ? $"{shift.StaffMember.FirstName} {shift.StaffMember.LastName}"
                : string.Empty,
            Date = shift.Date.ToString("yyyy-MM-dd"),
            StartTime = shift.StartTime.ToString("HH:mm"),
            EndTime = shift.EndTime.ToString("HH:mm"),
            ShiftType = shift.ShiftType.ToString(),
            Status = shift.Status.ToString(),
            LocationId = shift.LocationId,
            LocationName = null, // Cross-service: frontend resolves from business-management API
            Notes = shift.Notes,
            CreatedAt = shift.CreatedAt,
            UpdatedAt = shift.UpdatedAt
        };
    }
}
