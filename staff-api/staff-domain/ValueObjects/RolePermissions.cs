namespace staff_domain.ValueObjects;

public class RolePermissions
{
    // Scheduling permissions
    public bool ViewSchedule { get; set; } = false;
    public bool ManageSchedule { get; set; } = false;

    // Time-off permissions
    public bool ViewTimeOff { get; set; } = false;
    public bool ManageTimeOff { get; set; } = false;
    public bool ApproveTimeOff { get; set; } = false;

    // Staff permissions
    public bool ViewStaff { get; set; } = false;
    public bool ManageStaff { get; set; } = false;

    // Services permissions
    public bool ViewServices { get; set; } = false;
    public bool ManageServices { get; set; } = false;

    // Clients permissions
    public bool ViewClients { get; set; } = false;
    public bool ManageClients { get; set; } = false;

    // Reports permissions
    public bool ViewReports { get; set; } = false;

    // Settings permissions
    public bool ManageBusinessSettings { get; set; } = false;
    public bool ManageLocationSettings { get; set; } = false;

    // Bookings permissions
    public bool ViewBookings { get; set; } = false;
    public bool ManageBookings { get; set; } = false;

    /// <summary>
    /// Check if a specific permission is granted using "Area.Action" format
    /// </summary>
    public bool HasPermission(string permission)
    {
        return permission switch
        {
            "Scheduling.View" => ViewSchedule,
            "Scheduling.Manage" => ManageSchedule,
            "TimeOff.View" => ViewTimeOff,
            "TimeOff.Manage" => ManageTimeOff,
            "TimeOff.Approve" => ApproveTimeOff,
            "Staff.View" => ViewStaff,
            "Staff.Manage" => ManageStaff,
            "Services.View" => ViewServices,
            "Services.Manage" => ManageServices,
            "Clients.View" => ViewClients,
            "Clients.Manage" => ManageClients,
            "Reports.View" => ViewReports,
            "Settings.ManageBusiness" => ManageBusinessSettings,
            "Settings.ManageLocation" => ManageLocationSettings,
            "Bookings.View" => ViewBookings,
            "Bookings.Manage" => ManageBookings,
            _ => false
        };
    }

    /// <summary>
    /// Create Owner role permissions (all permissions enabled)
    /// </summary>
    public static RolePermissions OwnerPermissions()
    {
        return new RolePermissions
        {
            ViewSchedule = true,
            ManageSchedule = true,
            ViewTimeOff = true,
            ManageTimeOff = true,
            ApproveTimeOff = true,
            ViewStaff = true,
            ManageStaff = true,
            ViewServices = true,
            ManageServices = true,
            ViewClients = true,
            ManageClients = true,
            ViewReports = true,
            ManageBusinessSettings = true,
            ManageLocationSettings = true,
            ViewBookings = true,
            ManageBookings = true
        };
    }

    /// <summary>
    /// Create Manager role permissions (scheduling, time-off, viewing, and bookings)
    /// </summary>
    public static RolePermissions ManagerPermissions()
    {
        return new RolePermissions
        {
            ViewSchedule = true,
            ManageSchedule = true,
            ViewTimeOff = true,
            ManageTimeOff = true,
            ApproveTimeOff = true,
            ViewStaff = true,
            ViewServices = true,
            ViewClients = true,
            ViewBookings = true,
            ManageBookings = true
        };
    }

    /// <summary>
    /// Create Employee role permissions (view own schedule, request time-off, view own bookings)
    /// </summary>
    public static RolePermissions EmployeePermissions()
    {
        return new RolePermissions
        {
            ViewSchedule = true,
            ViewTimeOff = true,
            ViewBookings = true
        };
    }
}
