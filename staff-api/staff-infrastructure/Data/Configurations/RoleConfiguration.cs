using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("roles");

        // Primary key
        builder.HasKey(e => e.Id);

        // Columns
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.BusinessId).HasColumnName("business_id").IsRequired();
        builder.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
        builder.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
        builder.Property(e => e.IsDefault).HasColumnName("is_default").IsRequired();
        builder.Property(e => e.IsImmutable).HasColumnName("is_immutable").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // Owned entity - RolePermissions
        builder.OwnsOne(e => e.Permissions, permissions =>
        {
            // Scheduling permissions
            permissions.Property(p => p.ViewSchedule).HasColumnName("view_schedule").IsRequired();
            permissions.Property(p => p.ManageSchedule).HasColumnName("manage_schedule").IsRequired();

            // Time-off permissions
            permissions.Property(p => p.ViewTimeOff).HasColumnName("view_time_off").IsRequired();
            permissions.Property(p => p.ManageTimeOff).HasColumnName("manage_time_off").IsRequired();
            permissions.Property(p => p.ApproveTimeOff).HasColumnName("approve_time_off").IsRequired();

            // Staff permissions
            permissions.Property(p => p.ViewStaff).HasColumnName("view_staff").IsRequired();
            permissions.Property(p => p.ManageStaff).HasColumnName("manage_staff").IsRequired();

            // Services permissions
            permissions.Property(p => p.ViewServices).HasColumnName("view_services").IsRequired();
            permissions.Property(p => p.ManageServices).HasColumnName("manage_services").IsRequired();

            // Clients permissions
            permissions.Property(p => p.ViewClients).HasColumnName("view_clients").IsRequired();
            permissions.Property(p => p.ManageClients).HasColumnName("manage_clients").IsRequired();

            // Reports permissions
            permissions.Property(p => p.ViewReports).HasColumnName("view_reports").IsRequired();

            // Settings permissions
            permissions.Property(p => p.ManageBusinessSettings).HasColumnName("manage_business_settings").IsRequired();
            permissions.Property(p => p.ManageLocationSettings).HasColumnName("manage_location_settings").IsRequired();

            // Bookings permissions
            permissions.Property(p => p.ViewBookings).HasColumnName("view_bookings").IsRequired();
            permissions.Property(p => p.ManageBookings).HasColumnName("manage_bookings").IsRequired();
        });

        // Indexes
        builder.HasIndex(e => e.BusinessId);
        builder.HasIndex(e => new { e.BusinessId, e.Name }).IsUnique();
    }
}
