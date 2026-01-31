using Microsoft.EntityFrameworkCore;
using staff_application.DTOs;
using staff_application.Interfaces;
using staff_domain.Entities;
using staff_domain.ValueObjects;
using staff_infrastructure.Data;

namespace staff_application.Services;

public class RoleService : IRoleService
{
    private readonly StaffManagementContext _context;

    // Reserved role names that cannot be used for custom roles
    private static readonly HashSet<string> ReservedRoleNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "Owner", "Manager", "Employee"
    };

    public RoleService(StaffManagementContext context)
    {
        _context = context;
    }

    public async Task<List<RoleResponse>> GetRolesAsync(Guid businessId)
    {
        // Ensure default roles exist before returning
        await EnsureDefaultRolesAsync(businessId);

        var roles = await _context.Roles
            .AsNoTracking()
            .Where(r => r.BusinessId == businessId)
            .OrderBy(r => r.IsDefault ? 0 : 1) // Default roles first
            .ThenBy(r => r.Name)
            .ToListAsync();

        return roles.Select(MapToResponse).ToList();
    }

    public async Task<RoleResponse?> GetRoleAsync(Guid businessId, Guid roleId)
    {
        var role = await _context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.BusinessId == businessId && r.Id == roleId);

        return role == null ? null : MapToResponse(role);
    }

    public async Task<RoleResponse> CreateRoleAsync(Guid businessId, CreateRoleRequest request)
    {
        // Check if name is reserved
        if (ReservedRoleNames.Contains(request.Name))
        {
            throw new InvalidOperationException($"Role name '{request.Name}' is reserved for default roles");
        }

        // Check name uniqueness within business
        var nameExists = await _context.Roles
            .AnyAsync(r => r.BusinessId == businessId && r.Name.ToLower() == request.Name.ToLower());

        if (nameExists)
        {
            throw new InvalidOperationException("A role with this name already exists in this business");
        }

        // Clone permissions from another role if specified
        RolePermissions permissions;
        if (request.CloneFromRoleId.HasValue)
        {
            var sourceRole = await _context.Roles
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.BusinessId == businessId && r.Id == request.CloneFromRoleId.Value);

            if (sourceRole == null)
            {
                throw new InvalidOperationException("Source role not found");
            }

            permissions = new RolePermissions
            {
                ViewSchedule = sourceRole.Permissions.ViewSchedule,
                ManageSchedule = sourceRole.Permissions.ManageSchedule,
                ViewTimeOff = sourceRole.Permissions.ViewTimeOff,
                ManageTimeOff = sourceRole.Permissions.ManageTimeOff,
                ApproveTimeOff = sourceRole.Permissions.ApproveTimeOff,
                ViewStaff = sourceRole.Permissions.ViewStaff,
                ManageStaff = sourceRole.Permissions.ManageStaff,
                ViewServices = sourceRole.Permissions.ViewServices,
                ManageServices = sourceRole.Permissions.ManageServices,
                ViewClients = sourceRole.Permissions.ViewClients,
                ManageClients = sourceRole.Permissions.ManageClients,
                ViewReports = sourceRole.Permissions.ViewReports,
                ManageBusinessSettings = sourceRole.Permissions.ManageBusinessSettings,
                ManageLocationSettings = sourceRole.Permissions.ManageLocationSettings,
                ViewBookings = sourceRole.Permissions.ViewBookings,
                ManageBookings = sourceRole.Permissions.ManageBookings
            };
        }
        else if (request.Permissions != null)
        {
            permissions = MapToPermissions(request.Permissions);
        }
        else
        {
            // Default to no permissions
            permissions = new RolePermissions();
        }

        var role = new Role
        {
            BusinessId = businessId,
            Name = request.Name,
            Description = request.Description,
            IsDefault = false,
            IsImmutable = false,
            Permissions = permissions,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        return MapToResponse(role);
    }

    public async Task<RoleResponse?> UpdateRoleAsync(Guid businessId, Guid roleId, UpdateRoleRequest request)
    {
        var role = await _context.Roles
            .FirstOrDefaultAsync(r => r.BusinessId == businessId && r.Id == roleId);

        if (role == null)
            return null;

        // Block name changes for immutable roles
        if (request.Name != null && role.IsImmutable && !role.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Cannot change the name of a default role");
        }

        // If updating name, check if new name is reserved
        if (request.Name != null && !role.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase))
        {
            if (ReservedRoleNames.Contains(request.Name))
            {
                throw new InvalidOperationException($"Role name '{request.Name}' is reserved for default roles");
            }

            // Check name uniqueness
            var nameExists = await _context.Roles
                .AnyAsync(r => r.BusinessId == businessId && r.Id != roleId && r.Name.ToLower() == request.Name.ToLower());

            if (nameExists)
            {
                throw new InvalidOperationException("A role with this name already exists in this business");
            }

            role.Name = request.Name;
        }

        // Update description
        if (request.Description != null)
        {
            role.Description = request.Description;
        }

        // Update permissions
        if (request.Permissions != null)
        {
            // Block ALL permission changes on Owner role
            if (role.Name.Equals("Owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Cannot modify Owner role permissions - all permissions are always enabled");
            }

            // Allow permission updates on Manager/Employee defaults and all custom roles
            role.Permissions = MapToPermissions(request.Permissions);
        }

        role.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToResponse(role);
    }

    public async Task<bool> DeleteRoleAsync(Guid businessId, Guid roleId)
    {
        var role = await _context.Roles
            .FirstOrDefaultAsync(r => r.BusinessId == businessId && r.Id == roleId);

        if (role == null)
            return false;

        // Block deletion of default roles
        if (role.IsDefault)
        {
            throw new InvalidOperationException("Cannot delete default roles (Owner, Manager, Employee)");
        }

        // Check if any StaffLocation references this role
        var isInUse = await _context.StaffLocations
            .AnyAsync(sl => sl.RoleId == roleId);

        if (isInUse)
        {
            throw new InvalidOperationException("Cannot delete role that is assigned to staff members. Reassign staff first.");
        }

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task EnsureDefaultRolesAsync(Guid businessId)
    {
        // Check if default roles already exist
        var existingDefaults = await _context.Roles
            .Where(r => r.BusinessId == businessId && r.IsDefault)
            .Select(r => r.Name)
            .ToListAsync();

        var rolesToCreate = new List<Role>();

        // Owner role
        if (!existingDefaults.Any(n => n.Equals("Owner", StringComparison.OrdinalIgnoreCase)))
        {
            rolesToCreate.Add(new Role
            {
                BusinessId = businessId,
                Name = "Owner",
                Description = "Full access to all features and settings",
                IsDefault = true,
                IsImmutable = true,
                Permissions = RolePermissions.OwnerPermissions(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        // Manager role
        if (!existingDefaults.Any(n => n.Equals("Manager", StringComparison.OrdinalIgnoreCase)))
        {
            rolesToCreate.Add(new Role
            {
                BusinessId = businessId,
                Name = "Manager",
                Description = "Can manage schedules, time-off, and bookings",
                IsDefault = true,
                IsImmutable = true,
                Permissions = RolePermissions.ManagerPermissions(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        // Employee role
        if (!existingDefaults.Any(n => n.Equals("Employee", StringComparison.OrdinalIgnoreCase)))
        {
            rolesToCreate.Add(new Role
            {
                BusinessId = businessId,
                Name = "Employee",
                Description = "Can view own schedule and bookings",
                IsDefault = true,
                IsImmutable = true,
                Permissions = RolePermissions.EmployeePermissions(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        if (rolesToCreate.Count > 0)
        {
            _context.Roles.AddRange(rolesToCreate);
            await _context.SaveChangesAsync();
        }
    }

    public Task<List<PermissionAreaDto>> GetPermissionAreasAsync()
    {
        var areas = new List<PermissionAreaDto>
        {
            new PermissionAreaDto
            {
                Area = "Scheduling",
                Actions = new List<PermissionActionDto>
                {
                    new PermissionActionDto { Name = "ViewSchedule", Description = "View staff schedules" },
                    new PermissionActionDto { Name = "ManageSchedule", Description = "Create and edit schedules" }
                }
            },
            new PermissionAreaDto
            {
                Area = "TimeOff",
                Actions = new List<PermissionActionDto>
                {
                    new PermissionActionDto { Name = "ViewTimeOff", Description = "View time-off requests" },
                    new PermissionActionDto { Name = "ManageTimeOff", Description = "Create and edit time-off requests" },
                    new PermissionActionDto { Name = "ApproveTimeOff", Description = "Approve or deny time-off requests" }
                }
            },
            new PermissionAreaDto
            {
                Area = "Staff",
                Actions = new List<PermissionActionDto>
                {
                    new PermissionActionDto { Name = "ViewStaff", Description = "View staff members" },
                    new PermissionActionDto { Name = "ManageStaff", Description = "Add, edit, and remove staff members" }
                }
            },
            new PermissionAreaDto
            {
                Area = "Services",
                Actions = new List<PermissionActionDto>
                {
                    new PermissionActionDto { Name = "ViewServices", Description = "View services catalog" },
                    new PermissionActionDto { Name = "ManageServices", Description = "Add, edit, and remove services" }
                }
            },
            new PermissionAreaDto
            {
                Area = "Clients",
                Actions = new List<PermissionActionDto>
                {
                    new PermissionActionDto { Name = "ViewClients", Description = "View client information" },
                    new PermissionActionDto { Name = "ManageClients", Description = "Add, edit, and remove clients" }
                }
            },
            new PermissionAreaDto
            {
                Area = "Reports",
                Actions = new List<PermissionActionDto>
                {
                    new PermissionActionDto { Name = "ViewReports", Description = "View business reports and analytics" }
                }
            },
            new PermissionAreaDto
            {
                Area = "Settings",
                Actions = new List<PermissionActionDto>
                {
                    new PermissionActionDto { Name = "ManageBusinessSettings", Description = "Manage business-level settings" },
                    new PermissionActionDto { Name = "ManageLocationSettings", Description = "Manage location-level settings" }
                }
            },
            new PermissionAreaDto
            {
                Area = "Bookings",
                Actions = new List<PermissionActionDto>
                {
                    new PermissionActionDto { Name = "ViewBookings", Description = "View appointments and bookings" },
                    new PermissionActionDto { Name = "ManageBookings", Description = "Create, edit, and cancel bookings" }
                }
            }
        };

        return Task.FromResult(areas);
    }

    public async Task AssignRoleToStaffLocationAsync(Guid businessId, AssignRoleRequest request)
    {
        // Verify role exists and belongs to business
        var role = await _context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.BusinessId == businessId && r.Id == request.RoleId);

        if (role == null)
        {
            throw new InvalidOperationException("Role not found");
        }

        // Find StaffLocation by StaffMemberId + LocationId
        var staffLocation = await _context.StaffLocations
            .Include(sl => sl.StaffMember)
            .FirstOrDefaultAsync(sl => sl.StaffMemberId == request.StaffMemberId && sl.LocationId == request.LocationId);

        if (staffLocation == null)
        {
            throw new InvalidOperationException("Staff member is not assigned to this location");
        }

        // Verify staff member belongs to the business
        if (staffLocation.StaffMember.BusinessId != businessId)
        {
            throw new InvalidOperationException("Staff member does not belong to this business");
        }

        // Update role assignment
        staffLocation.RoleId = request.RoleId;
        await _context.SaveChangesAsync();
    }

    // Private mapping helpers

    private RoleResponse MapToResponse(Role role)
    {
        return new RoleResponse
        {
            Id = role.Id,
            BusinessId = role.BusinessId,
            Name = role.Name,
            Description = role.Description,
            IsDefault = role.IsDefault,
            IsImmutable = role.IsImmutable,
            Permissions = MapPermissionsToDto(role.Permissions),
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        };
    }

    private RolePermissionsDto MapPermissionsToDto(RolePermissions permissions)
    {
        return new RolePermissionsDto
        {
            ViewSchedule = permissions.ViewSchedule,
            ManageSchedule = permissions.ManageSchedule,
            ViewTimeOff = permissions.ViewTimeOff,
            ManageTimeOff = permissions.ManageTimeOff,
            ApproveTimeOff = permissions.ApproveTimeOff,
            ViewStaff = permissions.ViewStaff,
            ManageStaff = permissions.ManageStaff,
            ViewServices = permissions.ViewServices,
            ManageServices = permissions.ManageServices,
            ViewClients = permissions.ViewClients,
            ManageClients = permissions.ManageClients,
            ViewReports = permissions.ViewReports,
            ManageBusinessSettings = permissions.ManageBusinessSettings,
            ManageLocationSettings = permissions.ManageLocationSettings,
            ViewBookings = permissions.ViewBookings,
            ManageBookings = permissions.ManageBookings
        };
    }

    private RolePermissions MapToPermissions(RolePermissionsDto dto)
    {
        return new RolePermissions
        {
            ViewSchedule = dto.ViewSchedule,
            ManageSchedule = dto.ManageSchedule,
            ViewTimeOff = dto.ViewTimeOff,
            ManageTimeOff = dto.ManageTimeOff,
            ApproveTimeOff = dto.ApproveTimeOff,
            ViewStaff = dto.ViewStaff,
            ManageStaff = dto.ManageStaff,
            ViewServices = dto.ViewServices,
            ManageServices = dto.ManageServices,
            ViewClients = dto.ViewClients,
            ManageClients = dto.ManageClients,
            ViewReports = dto.ViewReports,
            ManageBusinessSettings = dto.ManageBusinessSettings,
            ManageLocationSettings = dto.ManageLocationSettings,
            ViewBookings = dto.ViewBookings,
            ManageBookings = dto.ManageBookings
        };
    }
}
