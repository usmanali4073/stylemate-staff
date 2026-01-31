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

    // Recurring pattern methods

    public async Task<List<RecurringShiftPatternResponse>> GetRecurringPatternsAsync(Guid businessId, Guid? staffMemberId = null)
    {
        var query = _context.RecurringShiftPatterns
            .AsNoTracking()
            .Include(p => p.StaffMember)
            .Where(p => p.BusinessId == businessId);

        if (staffMemberId.HasValue)
            query = query.Where(p => p.StaffMemberId == staffMemberId.Value);

        var patterns = await query.OrderBy(p => p.CreatedAt).ToListAsync();

        return patterns.Select(MapPatternToResponse).ToList();
    }

    public async Task<RecurringShiftPatternResponse?> GetRecurringPatternAsync(Guid businessId, Guid patternId)
    {
        var pattern = await _context.RecurringShiftPatterns
            .AsNoTracking()
            .Include(p => p.StaffMember)
            .Where(p => p.BusinessId == businessId && p.Id == patternId)
            .FirstOrDefaultAsync();

        return pattern == null ? null : MapPatternToResponse(pattern);
    }

    public async Task<RecurringShiftPatternResponse> CreateRecurringPatternAsync(Guid businessId, CreateRecurringShiftRequest request)
    {
        var staffMember = await _context.StaffMembers
            .Where(s => s.BusinessId == businessId && s.Id == request.StaffMemberId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            throw new InvalidOperationException("Staff member not found in this business");

        if (!request.RRule.Contains("FREQ=", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("RRule must contain FREQ parameter");

        var startTime = TimeOnly.ParseExact(request.StartTime, "HH:mm");
        var endTime = TimeOnly.ParseExact(request.EndTime, "HH:mm");

        if (startTime >= endTime)
            throw new InvalidOperationException("Start time must be before end time");

        var patternStart = DateOnly.ParseExact(request.PatternStart, "yyyy-MM-dd");
        DateOnly? patternEnd = null;
        if (!string.IsNullOrEmpty(request.PatternEnd))
            patternEnd = DateOnly.ParseExact(request.PatternEnd, "yyyy-MM-dd");

        if (!Enum.TryParse<ShiftType>(request.ShiftType, true, out var shiftType))
            shiftType = ShiftType.Custom;

        var pattern = new RecurringShiftPattern
        {
            BusinessId = businessId,
            StaffMemberId = request.StaffMemberId,
            LocationId = request.LocationId,
            RRule = request.RRule,
            StartTime = startTime,
            EndTime = endTime,
            PatternStart = patternStart,
            PatternEnd = patternEnd,
            ShiftType = shiftType,
            Notes = request.Notes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.RecurringShiftPatterns.Add(pattern);
        await _context.SaveChangesAsync();

        pattern.StaffMember = staffMember;
        return MapPatternToResponse(pattern);
    }

    public async Task<RecurringShiftPatternResponse?> UpdateRecurringPatternAsync(Guid businessId, Guid patternId, UpdateRecurringShiftRequest request)
    {
        var pattern = await _context.RecurringShiftPatterns
            .Include(p => p.StaffMember)
            .Where(p => p.BusinessId == businessId && p.Id == patternId)
            .FirstOrDefaultAsync();

        if (pattern == null)
            return null;

        if (request.LocationId.HasValue)
            pattern.LocationId = request.LocationId;

        if (!string.IsNullOrEmpty(request.RRule))
        {
            if (!request.RRule.Contains("FREQ=", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("RRule must contain FREQ parameter");
            pattern.RRule = request.RRule;
        }

        if (!string.IsNullOrEmpty(request.StartTime))
            pattern.StartTime = TimeOnly.ParseExact(request.StartTime, "HH:mm");

        if (!string.IsNullOrEmpty(request.EndTime))
            pattern.EndTime = TimeOnly.ParseExact(request.EndTime, "HH:mm");

        if (pattern.StartTime >= pattern.EndTime)
            throw new InvalidOperationException("Start time must be before end time");

        if (!string.IsNullOrEmpty(request.PatternEnd))
            pattern.PatternEnd = DateOnly.ParseExact(request.PatternEnd, "yyyy-MM-dd");

        if (!string.IsNullOrEmpty(request.ShiftType) && Enum.TryParse<ShiftType>(request.ShiftType, true, out var shiftType))
            pattern.ShiftType = shiftType;

        if (request.Notes != null)
            pattern.Notes = request.Notes;

        if (request.IsActive.HasValue)
            pattern.IsActive = request.IsActive.Value;

        pattern.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapPatternToResponse(pattern);
    }

    public async Task<bool> DeleteRecurringPatternAsync(Guid businessId, Guid patternId)
    {
        var pattern = await _context.RecurringShiftPatterns
            .Where(p => p.BusinessId == businessId && p.Id == patternId)
            .FirstOrDefaultAsync();

        if (pattern == null)
            return false;

        _context.RecurringShiftPatterns.Remove(pattern);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<ShiftOccurrence>> GetShiftOccurrencesAsync(
        Guid businessId, DateOnly startDate, DateOnly endDate,
        Guid? staffMemberId = null, Guid? locationId = null)
    {
        var occurrences = new List<ShiftOccurrence>();

        // 1. Fetch one-off shifts and overrides
        var shiftsQuery = _context.Shifts
            .AsNoTracking()
            .Include(s => s.StaffMember)
            .Where(s => s.BusinessId == businessId
                && s.Date >= startDate
                && s.Date <= endDate
                && (s.PatternId == null || s.IsOverride));

        if (staffMemberId.HasValue)
            shiftsQuery = shiftsQuery.Where(s => s.StaffMemberId == staffMemberId.Value);

        if (locationId.HasValue)
            shiftsQuery = shiftsQuery.Where(s => s.LocationId == locationId.Value);

        var shifts = await shiftsQuery.ToListAsync();

        foreach (var shift in shifts)
        {
            occurrences.Add(new ShiftOccurrence
            {
                Date = shift.Date.ToString("yyyy-MM-dd"),
                StartTime = shift.StartTime.ToString("HH:mm"),
                EndTime = shift.EndTime.ToString("HH:mm"),
                StaffMemberId = shift.StaffMemberId,
                StaffMemberName = shift.StaffMember != null
                    ? $"{shift.StaffMember.FirstName} {shift.StaffMember.LastName}"
                    : string.Empty,
                LocationId = shift.LocationId,
                ShiftType = shift.ShiftType.ToString(),
                IsFromPattern = shift.PatternId.HasValue,
                PatternId = shift.PatternId,
                ShiftId = shift.Id,
                Notes = shift.Notes
            });
        }

        // 2. Fetch active recurring patterns
        var patternsQuery = _context.RecurringShiftPatterns
            .AsNoTracking()
            .Include(p => p.StaffMember)
            .Where(p => p.BusinessId == businessId
                && p.IsActive
                && p.PatternStart <= endDate
                && (p.PatternEnd == null || p.PatternEnd >= startDate));

        if (staffMemberId.HasValue)
            patternsQuery = patternsQuery.Where(p => p.StaffMemberId == staffMemberId.Value);

        if (locationId.HasValue)
            patternsQuery = patternsQuery.Where(p => p.LocationId == locationId.Value);

        var patterns = await patternsQuery.ToListAsync();

        // 3. Expand patterns and check for overrides
        var overrideDates = shifts
            .Where(s => s.PatternId.HasValue)
            .Select(s => new { PatternId = s.PatternId!.Value, s.Date })
            .ToHashSet();

        foreach (var pattern in patterns)
        {
            var patternOccurrences = ExpandPattern(pattern, startDate, endDate);

            foreach (var occurrence in patternOccurrences)
            {
                var occurrenceDate = DateOnly.ParseExact(occurrence.Date, "yyyy-MM-dd");

                // Skip if this occurrence has been overridden
                if (overrideDates.Contains(new { PatternId = pattern.Id, Date = occurrenceDate }))
                    continue;

                occurrences.Add(occurrence);
            }
        }

        // Sort by date and time
        return occurrences
            .OrderBy(o => o.Date)
            .ThenBy(o => o.StartTime)
            .ToList();
    }

    public async Task<List<AvailabilitySlot>> GetAvailabilityAsync(
        Guid businessId, Guid staffMemberId, DateOnly startDate, DateOnly endDate)
    {
        var slots = new List<AvailabilitySlot>();

        // 1. Get shift occurrences
        var shiftOccurrences = await GetShiftOccurrencesAsync(businessId, startDate, endDate, staffMemberId);

        foreach (var shift in shiftOccurrences)
        {
            slots.Add(new AvailabilitySlot
            {
                Date = shift.Date,
                StartTime = shift.StartTime,
                EndTime = shift.EndTime,
                Type = "shift",
                Source = shift.ShiftId?.ToString() ?? shift.PatternId?.ToString() ?? string.Empty
            });
        }

        // 2. Get approved time-off requests
        var timeOffRequests = await _context.TimeOffRequests
            .AsNoTracking()
            .Where(t => t.BusinessId == businessId
                && t.StaffMemberId == staffMemberId
                && t.Status == TimeOffStatus.Approved
                && t.StartDate <= endDate
                && t.EndDate >= startDate)
            .ToListAsync();

        foreach (var timeOff in timeOffRequests)
        {
            // Iterate each day in the time-off range
            var currentDate = timeOff.StartDate;
            while (currentDate <= timeOff.EndDate && currentDate <= endDate)
            {
                if (currentDate >= startDate)
                {
                    var startTime = timeOff.IsAllDay ? "00:00" : timeOff.StartTime?.ToString("HH:mm") ?? "00:00";
                    var endTime = timeOff.IsAllDay ? "23:59" : timeOff.EndTime?.ToString("HH:mm") ?? "23:59";

                    slots.Add(new AvailabilitySlot
                    {
                        Date = currentDate.ToString("yyyy-MM-dd"),
                        StartTime = startTime,
                        EndTime = endTime,
                        Type = "time-off",
                        Source = timeOff.Id.ToString()
                    });
                }

                currentDate = currentDate.AddDays(1);
            }
        }

        // Sort by date and time
        return slots
            .OrderBy(s => s.Date)
            .ThenBy(s => s.StartTime)
            .ToList();
    }

    // Helper methods

    private static RecurringShiftPatternResponse MapPatternToResponse(RecurringShiftPattern pattern)
    {
        return new RecurringShiftPatternResponse
        {
            Id = pattern.Id,
            BusinessId = pattern.BusinessId,
            StaffMemberId = pattern.StaffMemberId,
            StaffMemberName = pattern.StaffMember != null
                ? $"{pattern.StaffMember.FirstName} {pattern.StaffMember.LastName}"
                : string.Empty,
            LocationId = pattern.LocationId,
            LocationName = null, // Cross-service: frontend resolves from business-management API
            RRule = pattern.RRule,
            StartTime = pattern.StartTime.ToString("HH:mm"),
            EndTime = pattern.EndTime.ToString("HH:mm"),
            PatternStart = pattern.PatternStart.ToString("yyyy-MM-dd"),
            PatternEnd = pattern.PatternEnd?.ToString("yyyy-MM-dd"),
            ShiftType = pattern.ShiftType.ToString(),
            Notes = pattern.Notes,
            IsActive = pattern.IsActive,
            CreatedAt = pattern.CreatedAt,
            UpdatedAt = pattern.UpdatedAt
        };
    }

    private static List<ShiftOccurrence> ExpandPattern(RecurringShiftPattern pattern, DateOnly startDate, DateOnly endDate)
    {
        var occurrences = new List<ShiftOccurrence>();

        // Determine effective date range
        var effectiveStart = pattern.PatternStart > startDate ? pattern.PatternStart : startDate;
        var effectiveEnd = pattern.PatternEnd.HasValue && pattern.PatternEnd.Value < endDate
            ? pattern.PatternEnd.Value
            : endDate;

        // Parse RRule for simple patterns
        var rrule = pattern.RRule.ToUpperInvariant();

        if (rrule.Contains("FREQ=DAILY"))
        {
            // Expand daily pattern
            var currentDate = effectiveStart;
            while (currentDate <= effectiveEnd)
            {
                occurrences.Add(CreateOccurrence(pattern, currentDate));
                currentDate = currentDate.AddDays(1);
            }
        }
        else if (rrule.Contains("FREQ=WEEKLY"))
        {
            // Parse BYDAY values
            var daysOfWeek = ParseByDay(rrule);

            if (daysOfWeek.Any())
            {
                // Expand weekly pattern
                var currentDate = effectiveStart;
                while (currentDate <= effectiveEnd)
                {
                    if (daysOfWeek.Contains(currentDate.DayOfWeek))
                    {
                        occurrences.Add(CreateOccurrence(pattern, currentDate));
                    }
                    currentDate = currentDate.AddDays(1);
                }
            }
        }
        // For other FREQ types (MONTHLY, YEARLY, etc.), return empty list
        // Frontend will handle complex patterns with rrule.js

        return occurrences;
    }

    private static List<DayOfWeek> ParseByDay(string rrule)
    {
        var daysOfWeek = new List<DayOfWeek>();

        if (!rrule.Contains("BYDAY="))
            return daysOfWeek;

        // Extract BYDAY parameter value
        var byDayIndex = rrule.IndexOf("BYDAY=", StringComparison.OrdinalIgnoreCase);
        var byDayStart = byDayIndex + 6; // Length of "BYDAY="
        var byDayEnd = rrule.IndexOf(';', byDayStart);
        var byDayValue = byDayEnd > 0
            ? rrule.Substring(byDayStart, byDayEnd - byDayStart)
            : rrule.Substring(byDayStart);

        // Parse day codes
        var dayCodes = byDayValue.Split(',');
        foreach (var code in dayCodes)
        {
            var trimmedCode = code.Trim();
            switch (trimmedCode)
            {
                case "MO":
                    daysOfWeek.Add(DayOfWeek.Monday);
                    break;
                case "TU":
                    daysOfWeek.Add(DayOfWeek.Tuesday);
                    break;
                case "WE":
                    daysOfWeek.Add(DayOfWeek.Wednesday);
                    break;
                case "TH":
                    daysOfWeek.Add(DayOfWeek.Thursday);
                    break;
                case "FR":
                    daysOfWeek.Add(DayOfWeek.Friday);
                    break;
                case "SA":
                    daysOfWeek.Add(DayOfWeek.Saturday);
                    break;
                case "SU":
                    daysOfWeek.Add(DayOfWeek.Sunday);
                    break;
            }
        }

        return daysOfWeek;
    }

    private static ShiftOccurrence CreateOccurrence(RecurringShiftPattern pattern, DateOnly date)
    {
        return new ShiftOccurrence
        {
            Date = date.ToString("yyyy-MM-dd"),
            StartTime = pattern.StartTime.ToString("HH:mm"),
            EndTime = pattern.EndTime.ToString("HH:mm"),
            StaffMemberId = pattern.StaffMemberId,
            StaffMemberName = pattern.StaffMember != null
                ? $"{pattern.StaffMember.FirstName} {pattern.StaffMember.LastName}"
                : string.Empty,
            LocationId = pattern.LocationId,
            ShiftType = pattern.ShiftType.ToString(),
            IsFromPattern = true,
            PatternId = pattern.Id,
            ShiftId = null,
            Notes = pattern.Notes
        };
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
            PatternId = shift.PatternId,
            IsOverride = shift.IsOverride,
            Notes = shift.Notes,
            CreatedAt = shift.CreatedAt,
            UpdatedAt = shift.UpdatedAt
        };
    }
}
