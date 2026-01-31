using Microsoft.EntityFrameworkCore;
using staff_application.DTOs;
using staff_application.Interfaces;
using staff_domain.Entities;
using staff_domain.Enums;
using staff_infrastructure.Data;

namespace staff_application.Services;

public class TimeOffService : ITimeOffService
{
    private readonly StaffManagementContext _context;

    public TimeOffService(StaffManagementContext context)
    {
        _context = context;
    }

    // Time-off types

    public async Task EnsureDefaultTypesAsync(Guid businessId)
    {
        var hasTypes = await _context.TimeOffTypes
            .AnyAsync(t => t.BusinessId == businessId && t.IsDefault);

        if (!hasTypes)
        {
            var defaultTypes = new[]
            {
                new TimeOffType
                {
                    BusinessId = businessId,
                    Name = "Vacation",
                    Color = "#4CAF50",
                    IsDefault = true,
                    IsActive = true
                },
                new TimeOffType
                {
                    BusinessId = businessId,
                    Name = "Sick",
                    Color = "#F44336",
                    IsDefault = true,
                    IsActive = true
                },
                new TimeOffType
                {
                    BusinessId = businessId,
                    Name = "Personal",
                    Color = "#2196F3",
                    IsDefault = true,
                    IsActive = true
                }
            };

            _context.TimeOffTypes.AddRange(defaultTypes);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<TimeOffTypeResponse>> GetTypesAsync(Guid businessId)
    {
        await EnsureDefaultTypesAsync(businessId);

        var types = await _context.TimeOffTypes
            .AsNoTracking()
            .Where(t => t.BusinessId == businessId)
            .OrderByDescending(t => t.IsDefault)
            .ThenBy(t => t.Name)
            .ToListAsync();

        return types.Select(MapTypeToResponse).ToList();
    }

    public async Task<TimeOffTypeResponse?> GetTypeAsync(Guid businessId, Guid typeId)
    {
        var type = await _context.TimeOffTypes
            .AsNoTracking()
            .Where(t => t.BusinessId == businessId && t.Id == typeId)
            .FirstOrDefaultAsync();

        return type == null ? null : MapTypeToResponse(type);
    }

    public async Task<TimeOffTypeResponse> CreateTypeAsync(Guid businessId, CreateTimeOffTypeRequest request)
    {
        // Check for duplicate name
        var exists = await _context.TimeOffTypes
            .AnyAsync(t => t.BusinessId == businessId && t.Name.ToLower() == request.Name.ToLower());

        if (exists)
            throw new InvalidOperationException($"A time-off type named '{request.Name}' already exists");

        var type = new TimeOffType
        {
            BusinessId = businessId,
            Name = request.Name,
            Color = request.Color ?? "#9E9E9E",
            IsDefault = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TimeOffTypes.Add(type);
        await _context.SaveChangesAsync();

        return MapTypeToResponse(type);
    }

    public async Task<TimeOffTypeResponse?> UpdateTypeAsync(Guid businessId, Guid typeId, UpdateTimeOffTypeRequest request)
    {
        var type = await _context.TimeOffTypes
            .Where(t => t.BusinessId == businessId && t.Id == typeId)
            .FirstOrDefaultAsync();

        if (type == null)
            return null;

        if (request.Name != null)
        {
            // Check for duplicate name (excluding self)
            var exists = await _context.TimeOffTypes
                .AnyAsync(t => t.BusinessId == businessId && t.Id != typeId && t.Name.ToLower() == request.Name.ToLower());

            if (exists)
                throw new InvalidOperationException($"A time-off type named '{request.Name}' already exists");

            type.Name = request.Name;
        }

        if (request.Color != null)
            type.Color = request.Color;

        if (request.IsActive.HasValue)
            type.IsActive = request.IsActive.Value;

        type.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapTypeToResponse(type);
    }

    public async Task<bool> DeleteTypeAsync(Guid businessId, Guid typeId)
    {
        var type = await _context.TimeOffTypes
            .Where(t => t.BusinessId == businessId && t.Id == typeId)
            .FirstOrDefaultAsync();

        if (type == null)
            return false;

        // Block deletion if there are active time-off requests using this type
        var hasActiveRequests = await _context.TimeOffRequests
            .AnyAsync(r => r.TimeOffTypeId == typeId && r.Status == TimeOffStatus.Approved);

        if (hasActiveRequests)
            throw new InvalidOperationException("Cannot delete time-off type that has active approved requests");

        _context.TimeOffTypes.Remove(type);
        await _context.SaveChangesAsync();

        return true;
    }

    // Time-off requests

    public async Task<List<TimeOffRequestResponse>> GetRequestsAsync(Guid businessId, Guid? staffMemberId = null, string? status = null)
    {
        var query = _context.TimeOffRequests
            .AsNoTracking()
            .Include(r => r.StaffMember)
            .Include(r => r.TimeOffType)
            .Where(r => r.BusinessId == businessId);

        if (staffMemberId.HasValue)
            query = query.Where(r => r.StaffMemberId == staffMemberId.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<TimeOffStatus>(status, true, out var statusEnum))
            query = query.Where(r => r.Status == statusEnum);

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        // Resolve approver names
        var approverIds = requests
            .Where(r => r.ApprovedByStaffId.HasValue)
            .Select(r => r.ApprovedByStaffId!.Value)
            .Distinct()
            .ToList();

        var approvers = await _context.StaffMembers
            .AsNoTracking()
            .Where(s => approverIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => $"{s.FirstName} {s.LastName}");

        return requests.Select(r => MapRequestToResponse(r, approvers)).ToList();
    }

    public async Task<TimeOffRequestResponse?> GetRequestAsync(Guid businessId, Guid requestId)
    {
        var request = await _context.TimeOffRequests
            .AsNoTracking()
            .Include(r => r.StaffMember)
            .Include(r => r.TimeOffType)
            .Where(r => r.BusinessId == businessId && r.Id == requestId)
            .FirstOrDefaultAsync();

        if (request == null)
            return null;

        // Resolve approver name if exists
        var approvers = new Dictionary<Guid, string>();
        if (request.ApprovedByStaffId.HasValue)
        {
            var approver = await _context.StaffMembers
                .AsNoTracking()
                .Where(s => s.Id == request.ApprovedByStaffId.Value)
                .FirstOrDefaultAsync();

            if (approver != null)
                approvers[approver.Id] = $"{approver.FirstName} {approver.LastName}";
        }

        return MapRequestToResponse(request, approvers);
    }

    public async Task<TimeOffRequestResponse> CreateRequestAsync(Guid businessId, CreateTimeOffRequest request)
    {
        // Validate staff member exists in business
        var staffMember = await _context.StaffMembers
            .Where(s => s.BusinessId == businessId && s.Id == request.StaffMemberId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            throw new InvalidOperationException("Staff member not found in this business");

        // Validate time-off type exists
        var timeOffType = await _context.TimeOffTypes
            .Where(t => t.BusinessId == businessId && t.Id == request.TimeOffTypeId)
            .FirstOrDefaultAsync();

        if (timeOffType == null)
            throw new InvalidOperationException("Time-off type not found");

        // Parse dates
        var startDate = DateOnly.ParseExact(request.StartDate, "yyyy-MM-dd");
        var endDate = DateOnly.ParseExact(request.EndDate, "yyyy-MM-dd");

        if (endDate < startDate)
            throw new InvalidOperationException("End date must be on or after start date");

        // Parse times if not all-day
        TimeOnly? startTime = null;
        TimeOnly? endTime = null;

        if (!request.IsAllDay)
        {
            if (string.IsNullOrEmpty(request.StartTime) || string.IsNullOrEmpty(request.EndTime))
                throw new InvalidOperationException("Start time and end time are required for partial-day requests");

            startTime = TimeOnly.ParseExact(request.StartTime, "HH:mm");
            endTime = TimeOnly.ParseExact(request.EndTime, "HH:mm");
        }

        // Check for overlapping approved requests
        var hasOverlap = await _context.TimeOffRequests
            .AnyAsync(r => r.BusinessId == businessId
                && r.StaffMemberId == request.StaffMemberId
                && r.Status == TimeOffStatus.Approved
                && r.StartDate <= endDate
                && r.EndDate >= startDate);

        if (hasOverlap)
            throw new InvalidOperationException("This time-off request overlaps with an existing approved request");

        var timeOffRequest = new TimeOffRequest
        {
            BusinessId = businessId,
            StaffMemberId = request.StaffMemberId,
            TimeOffTypeId = request.TimeOffTypeId,
            StartDate = startDate,
            EndDate = endDate,
            IsAllDay = request.IsAllDay,
            StartTime = startTime,
            EndTime = endTime,
            Status = TimeOffStatus.Pending,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TimeOffRequests.Add(timeOffRequest);
        await _context.SaveChangesAsync();

        // Load navigation properties for response
        timeOffRequest.StaffMember = staffMember;
        timeOffRequest.TimeOffType = timeOffType;

        return MapRequestToResponse(timeOffRequest, new Dictionary<Guid, string>());
    }

    public async Task<TimeOffRequestResponse?> ApproveRequestAsync(Guid businessId, Guid requestId, Guid approverStaffId, ApproveTimeOffRequest request)
    {
        var timeOffRequest = await _context.TimeOffRequests
            .Include(r => r.StaffMember)
            .Include(r => r.TimeOffType)
            .Where(r => r.BusinessId == businessId && r.Id == requestId)
            .FirstOrDefaultAsync();

        if (timeOffRequest == null)
            return null;

        if (timeOffRequest.Status != TimeOffStatus.Pending)
            throw new InvalidOperationException($"Cannot approve a request with status '{timeOffRequest.Status}'");

        // Check for shifts during time-off period (warning, but still allow approval)
        var shiftsQuery = _context.Shifts
            .AsNoTracking()
            .Where(s => s.BusinessId == businessId
                && s.StaffMemberId == timeOffRequest.StaffMemberId
                && s.Date >= timeOffRequest.StartDate
                && s.Date <= timeOffRequest.EndDate
                && (s.Status == ShiftStatus.Scheduled || s.Status == ShiftStatus.Confirmed));

        var conflictingShifts = await shiftsQuery.ToListAsync();

        // Log warning but don't block approval (business can handle shift reassignment separately)
        if (conflictingShifts.Any())
        {
            // In a real system, this would trigger notifications or workflow
            // For now, we just proceed with approval
        }

        timeOffRequest.Status = TimeOffStatus.Approved;
        timeOffRequest.ApprovalNotes = request.ApprovalNotes;
        timeOffRequest.ApprovedByStaffId = approverStaffId;
        timeOffRequest.ApprovedAt = DateTime.UtcNow;
        timeOffRequest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Resolve approver name
        var approvers = new Dictionary<Guid, string>();
        var approver = await _context.StaffMembers
            .AsNoTracking()
            .Where(s => s.Id == approverStaffId)
            .FirstOrDefaultAsync();

        if (approver != null)
            approvers[approver.Id] = $"{approver.FirstName} {approver.LastName}";

        return MapRequestToResponse(timeOffRequest, approvers);
    }

    public async Task<TimeOffRequestResponse?> DenyRequestAsync(Guid businessId, Guid requestId, Guid approverStaffId, DenyTimeOffRequest request)
    {
        var timeOffRequest = await _context.TimeOffRequests
            .Include(r => r.StaffMember)
            .Include(r => r.TimeOffType)
            .Where(r => r.BusinessId == businessId && r.Id == requestId)
            .FirstOrDefaultAsync();

        if (timeOffRequest == null)
            return null;

        if (timeOffRequest.Status != TimeOffStatus.Pending)
            throw new InvalidOperationException($"Cannot deny a request with status '{timeOffRequest.Status}'");

        timeOffRequest.Status = TimeOffStatus.Denied;
        timeOffRequest.ApprovalNotes = request.ApprovalNotes;
        timeOffRequest.ApprovedByStaffId = approverStaffId;
        timeOffRequest.ApprovedAt = DateTime.UtcNow;
        timeOffRequest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Resolve approver name
        var approvers = new Dictionary<Guid, string>();
        var approver = await _context.StaffMembers
            .AsNoTracking()
            .Where(s => s.Id == approverStaffId)
            .FirstOrDefaultAsync();

        if (approver != null)
            approvers[approver.Id] = $"{approver.FirstName} {approver.LastName}";

        return MapRequestToResponse(timeOffRequest, approvers);
    }

    public async Task<TimeOffRequestResponse?> CancelRequestAsync(Guid businessId, Guid requestId)
    {
        var timeOffRequest = await _context.TimeOffRequests
            .Include(r => r.StaffMember)
            .Include(r => r.TimeOffType)
            .Where(r => r.BusinessId == businessId && r.Id == requestId)
            .FirstOrDefaultAsync();

        if (timeOffRequest == null)
            return null;

        if (timeOffRequest.Status != TimeOffStatus.Pending)
            throw new InvalidOperationException($"Cannot cancel a request with status '{timeOffRequest.Status}'");

        timeOffRequest.Status = TimeOffStatus.Cancelled;
        timeOffRequest.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Resolve approver name if exists
        var approvers = new Dictionary<Guid, string>();
        if (timeOffRequest.ApprovedByStaffId.HasValue)
        {
            var approver = await _context.StaffMembers
                .AsNoTracking()
                .Where(s => s.Id == timeOffRequest.ApprovedByStaffId.Value)
                .FirstOrDefaultAsync();

            if (approver != null)
                approvers[approver.Id] = $"{approver.FirstName} {approver.LastName}";
        }

        return MapRequestToResponse(timeOffRequest, approvers);
    }

    public async Task<int> GetPendingRequestsCountAsync(Guid businessId)
    {
        return await _context.TimeOffRequests
            .AsNoTracking()
            .CountAsync(r => r.BusinessId == businessId && r.Status == TimeOffStatus.Pending);
    }

    // Mapping helpers

    private static TimeOffTypeResponse MapTypeToResponse(TimeOffType type)
    {
        return new TimeOffTypeResponse
        {
            Id = type.Id,
            BusinessId = type.BusinessId,
            Name = type.Name,
            Color = type.Color,
            IsDefault = type.IsDefault,
            IsActive = type.IsActive,
            CreatedAt = type.CreatedAt
        };
    }

    private static TimeOffRequestResponse MapRequestToResponse(TimeOffRequest request, Dictionary<Guid, string> approvers)
    {
        return new TimeOffRequestResponse
        {
            Id = request.Id,
            BusinessId = request.BusinessId,
            StaffMemberId = request.StaffMemberId,
            StaffMemberName = request.StaffMember != null
                ? $"{request.StaffMember.FirstName} {request.StaffMember.LastName}"
                : string.Empty,
            TimeOffTypeId = request.TimeOffTypeId,
            TimeOffTypeName = request.TimeOffType?.Name ?? string.Empty,
            TimeOffTypeColor = request.TimeOffType?.Color ?? "#9E9E9E",
            StartDate = request.StartDate.ToString("yyyy-MM-dd"),
            EndDate = request.EndDate.ToString("yyyy-MM-dd"),
            IsAllDay = request.IsAllDay,
            StartTime = request.StartTime?.ToString("HH:mm"),
            EndTime = request.EndTime?.ToString("HH:mm"),
            Status = request.Status.ToString(),
            Notes = request.Notes,
            ApprovalNotes = request.ApprovalNotes,
            ApprovedByStaffId = request.ApprovedByStaffId,
            ApprovedByStaffName = request.ApprovedByStaffId.HasValue && approvers.TryGetValue(request.ApprovedByStaffId.Value, out var name)
                ? name
                : null,
            ApprovedAt = request.ApprovedAt,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt
        };
    }
}
