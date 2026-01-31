using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class StaffLocationConfiguration : IEntityTypeConfiguration<StaffLocation>
{
    public void Configure(EntityTypeBuilder<StaffLocation> builder)
    {
        builder.ToTable("staff_locations");

        // Primary key
        builder.HasKey(e => e.Id);

        // Columns
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.StaffMemberId).HasColumnName("staff_member_id").IsRequired();
        builder.Property(e => e.LocationId).HasColumnName("location_id").IsRequired();
        builder.Property(e => e.IsPrimary).HasColumnName("is_primary").IsRequired();
        builder.Property(e => e.AssignedAt).HasColumnName("assigned_at").IsRequired();

        // Foreign key relationship - cascade delete handled in StaffMemberConfiguration
        // No FK to BusinessLocation (cross-service reference)
        builder.HasOne(e => e.StaffMember)
            .WithMany(sm => sm.StaffLocations)
            .HasForeignKey(e => e.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint: one staff member can only be assigned to a location once
        builder.HasIndex(e => new { e.StaffMemberId, e.LocationId }).IsUnique();

        // Index for querying by location
        builder.HasIndex(e => e.LocationId);
    }
}
