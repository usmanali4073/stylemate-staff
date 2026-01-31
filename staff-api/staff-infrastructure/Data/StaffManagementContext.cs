using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using staff_domain.Entities;
using staff_infrastructure.Data.Configurations;

namespace staff_infrastructure.Data;

public class StaffManagementContext : DbContext
{
    public StaffManagementContext(DbContextOptions<StaffManagementContext> options) : base(options)
    {
    }

    public DbSet<StaffMember> StaffMembers { get; set; }
    public DbSet<Invitation> Invitations { get; set; }
    public DbSet<StaffLocation> StaffLocations { get; set; }
    public DbSet<StaffService> StaffServices { get; set; }
    public DbSet<Shift> Shifts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply fluent configurations
        modelBuilder.ApplyConfiguration(new StaffMemberConfiguration());
        modelBuilder.ApplyConfiguration(new InvitationConfiguration());
        modelBuilder.ApplyConfiguration(new StaffLocationConfiguration());
        modelBuilder.ApplyConfiguration(new StaffServiceConfiguration());
        modelBuilder.ApplyConfiguration(new ShiftConfiguration());

        // Global UTC converter for all DateTime properties
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(new ValueConverter<DateTime, DateTime>(
                        v => v.ToUniversalTime(),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
                    ));
                }
            }
        }
    }
}
