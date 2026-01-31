using Microsoft.EntityFrameworkCore;
using staff_application.DTOs;
using staff_application.Interfaces;
using staff_domain.Entities;
using staff_domain.Enums;
using staff_infrastructure.Data;

namespace staff_application.Services;

public class StaffService : IStaffService
{
    private readonly StaffManagementContext _context;

    public StaffService(StaffManagementContext context)
    {
        _context = context;
    }

    public async Task<List<StaffMemberListResponse>> GetBusinessStaffAsync(Guid businessId)
    {
        var staffMembers = await _context.StaffMembers
            .AsNoTracking()
            .Include(s => s.StaffLocations)
            .Where(s => s.BusinessId == businessId)
            .ToListAsync();

        return staffMembers.Select(s =>
        {
            var primaryLocation = s.StaffLocations.FirstOrDefault(sl => sl.IsPrimary);

            return new StaffMemberListResponse
            {
                Id = s.Id,
                FirstName = s.FirstName,
                LastName = s.LastName,
                Email = s.Email,
                JobTitle = s.JobTitle,
                PhotoUrl = s.PhotoUrl,
                PermissionLevel = s.PermissionLevel.ToString(),
                Status = s.Status.ToString(),
                IsBookable = s.IsBookable,
                PrimaryLocationName = null // Cross-service resolution deferred
            };
        }).ToList();
    }

    public async Task<StaffMemberResponse?> GetStaffMemberAsync(Guid businessId, Guid staffId)
    {
        var staffMember = await _context.StaffMembers
            .AsNoTracking()
            .Include(s => s.StaffLocations)
            .Include(s => s.Invitations)
            .Where(s => s.BusinessId == businessId && s.Id == staffId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            return null;

        var hasPendingInvitation = staffMember.Invitations
            .Any(i => i.Status == InvitationStatus.Pending && i.ExpiresAt > DateTime.UtcNow);

        return new StaffMemberResponse
        {
            Id = staffMember.Id,
            BusinessId = staffMember.BusinessId,
            UserId = staffMember.UserId,
            FirstName = staffMember.FirstName,
            LastName = staffMember.LastName,
            Email = staffMember.Email,
            Phone = staffMember.Phone,
            JobTitle = staffMember.JobTitle,
            PhotoUrl = staffMember.PhotoUrl,
            PermissionLevel = staffMember.PermissionLevel.ToString(),
            Status = staffMember.Status.ToString(),
            IsBookable = staffMember.IsBookable,
            CreatedAt = staffMember.CreatedAt,
            UpdatedAt = staffMember.UpdatedAt,
            Locations = staffMember.StaffLocations.Select(sl => new StaffLocationResponse
            {
                Id = sl.Id,
                StaffMemberId = sl.StaffMemberId,
                LocationId = sl.LocationId,
                LocationName = null, // Cross-service resolution deferred
                IsPrimary = sl.IsPrimary,
                AssignedAt = sl.AssignedAt
            }).ToList(),
            HasPendingInvitation = hasPendingInvitation
        };
    }

    public async Task<StaffMemberResponse> CreateStaffMemberAsync(Guid businessId, CreateStaffMemberRequest request)
    {
        // Check email uniqueness within business
        var emailExists = await _context.StaffMembers
            .AnyAsync(s => s.BusinessId == businessId && s.Email.ToLower() == request.Email.ToLower());

        if (emailExists)
            throw new InvalidOperationException("A staff member with this email already exists in this business");

        var staffMember = new StaffMember
        {
            BusinessId = businessId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            JobTitle = request.JobTitle,
            PhotoUrl = request.PhotoUrl,
            PermissionLevel = request.PermissionLevel,
            IsBookable = request.IsBookable,
            Status = StaffStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.StaffMembers.Add(staffMember);
        await _context.SaveChangesAsync();

        // Auto-assign locations if provided
        var locations = new List<StaffLocationResponse>();
        if (request.LocationIds is { Count: > 0 })
        {
            for (var i = 0; i < request.LocationIds.Count; i++)
            {
                var staffLocation = new StaffLocation
                {
                    StaffMemberId = staffMember.Id,
                    LocationId = request.LocationIds[i],
                    IsPrimary = i == 0, // First location is primary
                    AssignedAt = DateTime.UtcNow
                };
                _context.StaffLocations.Add(staffLocation);
            }
            await _context.SaveChangesAsync();

            var savedLocations = await _context.StaffLocations
                .AsNoTracking()
                .Where(sl => sl.StaffMemberId == staffMember.Id)
                .ToListAsync();

            locations = savedLocations.Select(sl => new StaffLocationResponse
            {
                Id = sl.Id,
                StaffMemberId = sl.StaffMemberId,
                LocationId = sl.LocationId,
                LocationName = null,
                IsPrimary = sl.IsPrimary,
                AssignedAt = sl.AssignedAt
            }).ToList();
        }

        return new StaffMemberResponse
        {
            Id = staffMember.Id,
            BusinessId = staffMember.BusinessId,
            UserId = staffMember.UserId,
            FirstName = staffMember.FirstName,
            LastName = staffMember.LastName,
            Email = staffMember.Email,
            Phone = staffMember.Phone,
            JobTitle = staffMember.JobTitle,
            PhotoUrl = staffMember.PhotoUrl,
            PermissionLevel = staffMember.PermissionLevel.ToString(),
            Status = staffMember.Status.ToString(),
            IsBookable = staffMember.IsBookable,
            CreatedAt = staffMember.CreatedAt,
            UpdatedAt = staffMember.UpdatedAt,
            Locations = locations,
            HasPendingInvitation = false
        };
    }

    public async Task<StaffMemberResponse?> UpdateStaffMemberAsync(Guid businessId, Guid staffId, UpdateStaffMemberRequest request)
    {
        var staffMember = await _context.StaffMembers
            .Include(s => s.StaffLocations)
            .Include(s => s.Invitations)
            .Where(s => s.BusinessId == businessId && s.Id == staffId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            return null;

        // Update only non-null fields
        if (request.FirstName != null)
            staffMember.FirstName = request.FirstName;

        if (request.LastName != null)
            staffMember.LastName = request.LastName;

        if (request.Phone != null)
            staffMember.Phone = request.Phone;

        if (request.JobTitle != null)
            staffMember.JobTitle = request.JobTitle;

        if (request.PhotoUrl != null)
            staffMember.PhotoUrl = request.PhotoUrl;

        if (request.PermissionLevel.HasValue)
            staffMember.PermissionLevel = request.PermissionLevel.Value;

        if (request.IsBookable.HasValue)
            staffMember.IsBookable = request.IsBookable.Value;

        staffMember.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var hasPendingInvitation = staffMember.Invitations
            .Any(i => i.Status == InvitationStatus.Pending && i.ExpiresAt > DateTime.UtcNow);

        return new StaffMemberResponse
        {
            Id = staffMember.Id,
            BusinessId = staffMember.BusinessId,
            UserId = staffMember.UserId,
            FirstName = staffMember.FirstName,
            LastName = staffMember.LastName,
            Email = staffMember.Email,
            Phone = staffMember.Phone,
            JobTitle = staffMember.JobTitle,
            PhotoUrl = staffMember.PhotoUrl,
            PermissionLevel = staffMember.PermissionLevel.ToString(),
            Status = staffMember.Status.ToString(),
            IsBookable = staffMember.IsBookable,
            CreatedAt = staffMember.CreatedAt,
            UpdatedAt = staffMember.UpdatedAt,
            Locations = staffMember.StaffLocations.Select(sl => new StaffLocationResponse
            {
                Id = sl.Id,
                StaffMemberId = sl.StaffMemberId,
                LocationId = sl.LocationId,
                LocationName = null, // Cross-service resolution deferred
                IsPrimary = sl.IsPrimary,
                AssignedAt = sl.AssignedAt
            }).ToList(),
            HasPendingInvitation = hasPendingInvitation
        };
    }

    public async Task<bool> ChangeStaffStatusAsync(Guid businessId, Guid staffId, StaffStatus newStatus)
    {
        var staffMember = await _context.StaffMembers
            .Where(s => s.BusinessId == businessId && s.Id == staffId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            return false;

        var currentStatus = staffMember.Status;

        // Enforce valid status transitions
        var isValidTransition = (currentStatus, newStatus) switch
        {
            (StaffStatus.Active, StaffStatus.Suspended) => true,  // STAFF-15
            (StaffStatus.Active, StaffStatus.Archived) => true,   // STAFF-13
            (StaffStatus.Suspended, StaffStatus.Active) => true,  // Reactivate
            (StaffStatus.Archived, StaffStatus.Active) => false,  // Cannot reactivate archived
            _ => currentStatus == newStatus  // Allow same status (no-op)
        };

        if (!isValidTransition)
            return false;

        staffMember.Status = newStatus;
        staffMember.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteStaffMemberAsync(Guid businessId, Guid staffId)
    {
        var staffMember = await _context.StaffMembers
            .Where(s => s.BusinessId == businessId && s.Id == staffId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            return false;

        // Only allow deletion if status is Archived (STAFF-14)
        if (staffMember.Status != StaffStatus.Archived)
            return false;

        // context.Remove() triggers SoftDeleteInterceptor
        _context.StaffMembers.Remove(staffMember);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<StaffLocationResponse>> GetStaffLocationsAsync(Guid staffId)
    {
        var locations = await _context.StaffLocations
            .AsNoTracking()
            .Where(sl => sl.StaffMemberId == staffId)
            .ToListAsync();

        return locations.Select(sl => new StaffLocationResponse
        {
            Id = sl.Id,
            StaffMemberId = sl.StaffMemberId,
            LocationId = sl.LocationId,
            LocationName = null, // Cross-service resolution deferred
            IsPrimary = sl.IsPrimary,
            AssignedAt = sl.AssignedAt
        }).ToList();
    }

    public async Task<StaffLocationResponse?> AssignStaffLocationAsync(Guid businessId, Guid staffId, AssignStaffLocationRequest request)
    {
        // Verify staff member exists and belongs to business
        var staffMember = await _context.StaffMembers
            .Where(s => s.BusinessId == businessId && s.Id == staffId)
            .FirstOrDefaultAsync();

        if (staffMember == null)
            return null;

        // Check for duplicate assignment
        var existingAssignment = await _context.StaffLocations
            .FirstOrDefaultAsync(sl => sl.StaffMemberId == staffId && sl.LocationId == request.LocationId);

        if (existingAssignment != null)
            throw new InvalidOperationException("Staff member is already assigned to this location");

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // If IsPrimary is true, unset all other primary flags
            if (request.IsPrimary)
            {
                var existingPrimary = await _context.StaffLocations
                    .Where(sl => sl.StaffMemberId == staffId && sl.IsPrimary)
                    .ToListAsync();

                foreach (var location in existingPrimary)
                {
                    location.IsPrimary = false;
                }
            }

            var staffLocation = new StaffLocation
            {
                StaffMemberId = staffId,
                LocationId = request.LocationId,
                IsPrimary = request.IsPrimary,
                AssignedAt = DateTime.UtcNow
            };

            _context.StaffLocations.Add(staffLocation);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new StaffLocationResponse
            {
                Id = staffLocation.Id,
                StaffMemberId = staffLocation.StaffMemberId,
                LocationId = staffLocation.LocationId,
                LocationName = null, // Cross-service resolution deferred
                IsPrimary = staffLocation.IsPrimary,
                AssignedAt = staffLocation.AssignedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> RemoveStaffLocationAsync(Guid staffId, Guid locationId)
    {
        var staffLocation = await _context.StaffLocations
            .FirstOrDefaultAsync(sl => sl.StaffMemberId == staffId && sl.LocationId == locationId);

        if (staffLocation == null)
            return false;

        // Cannot remove primary location
        if (staffLocation.IsPrimary)
            throw new InvalidOperationException("Cannot remove primary location. Assign a different primary location first.");

        _context.StaffLocations.Remove(staffLocation);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> SetPrimaryLocationAsync(Guid staffId, Guid locationId)
    {
        var targetLocation = await _context.StaffLocations
            .FirstOrDefaultAsync(sl => sl.StaffMemberId == staffId && sl.LocationId == locationId);

        if (targetLocation == null)
            return false;

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Unset all primary flags for this staff member
            var allLocations = await _context.StaffLocations
                .Where(sl => sl.StaffMemberId == staffId)
                .ToListAsync();

            foreach (var location in allLocations)
            {
                location.IsPrimary = false;
            }

            // Set target as primary
            targetLocation.IsPrimary = true;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<StaffServiceResponse?> AssignStaffServiceAsync(Guid staffId, AssignStaffServiceRequest request)
    {
        // Verify staff member exists
        var staffMember = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.Id == staffId);

        if (staffMember == null)
            return null;

        // Check for duplicate assignment
        var existingAssignment = await _context.StaffServices
            .FirstOrDefaultAsync(ss => ss.StaffMemberId == staffId && ss.ServiceId == request.ServiceId);

        if (existingAssignment != null)
            throw new InvalidOperationException("Staff member is already assigned to this service");

        var staffServiceEntity = new staff_domain.Entities.StaffService
        {
            StaffMemberId = staffId,
            ServiceId = request.ServiceId,
            AssignedAt = DateTime.UtcNow
        };

        _context.StaffServices.Add(staffServiceEntity);
        await _context.SaveChangesAsync();

        return new StaffServiceResponse
        {
            Id = staffServiceEntity.Id,
            StaffMemberId = staffServiceEntity.StaffMemberId,
            ServiceId = staffServiceEntity.ServiceId,
            ServiceName = null, // Cross-service resolution deferred
            AssignedAt = staffServiceEntity.AssignedAt
        };
    }

    public async Task<bool> RemoveStaffServiceAsync(Guid staffId, Guid serviceId)
    {
        var staffService = await _context.StaffServices
            .FirstOrDefaultAsync(ss => ss.StaffMemberId == staffId && ss.ServiceId == serviceId);

        if (staffService == null)
            return false;

        _context.StaffServices.Remove(staffService);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<StaffServiceResponse>> GetStaffServicesAsync(Guid staffId)
    {
        var services = await _context.StaffServices
            .AsNoTracking()
            .Where(ss => ss.StaffMemberId == staffId)
            .ToListAsync();

        return services.Select(ss => new StaffServiceResponse
        {
            Id = ss.Id,
            StaffMemberId = ss.StaffMemberId,
            ServiceId = ss.ServiceId,
            ServiceName = null, // Cross-service resolution deferred
            AssignedAt = ss.AssignedAt
        }).ToList();
    }
}
