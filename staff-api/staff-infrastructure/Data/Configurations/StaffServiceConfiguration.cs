using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class StaffServiceConfiguration : IEntityTypeConfiguration<StaffService>
{
    public void Configure(EntityTypeBuilder<StaffService> builder)
    {
        builder.ToTable("staff_services");

        // Primary key
        builder.HasKey(e => e.Id);

        // Columns
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.StaffMemberId).HasColumnName("staff_member_id").IsRequired();
        builder.Property(e => e.ServiceId).HasColumnName("service_id").IsRequired();
        builder.Property(e => e.AssignedAt).HasColumnName("assigned_at").IsRequired();

        // Foreign key relationship - cascade delete handled in StaffMemberConfiguration
        // No FK to Service entity (cross-service reference)
        builder.HasOne(e => e.StaffMember)
            .WithMany(sm => sm.StaffServices)
            .HasForeignKey(e => e.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint: one staff member can only be assigned to a service once
        builder.HasIndex(e => new { e.StaffMemberId, e.ServiceId }).IsUnique();

        // Index for querying by service
        builder.HasIndex(e => e.ServiceId);
    }
}
