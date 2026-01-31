using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class ShiftConfiguration : IEntityTypeConfiguration<Shift>
{
    public void Configure(EntityTypeBuilder<Shift> builder)
    {
        builder.ToTable("shifts");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.BusinessId).HasColumnName("business_id").IsRequired();
        builder.Property(e => e.StaffMemberId).HasColumnName("staff_member_id").IsRequired();
        builder.Property(e => e.Date).HasColumnName("date").IsRequired();
        builder.Property(e => e.StartTime).HasColumnName("start_time").IsRequired();
        builder.Property(e => e.EndTime).HasColumnName("end_time").IsRequired();
        builder.Property(e => e.ShiftType).HasColumnName("shift_type").IsRequired();
        builder.Property(e => e.Status).HasColumnName("status").IsRequired();
        builder.Property(e => e.LocationId).HasColumnName("location_id");
        builder.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(500);
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // FK to StaffMember with cascade delete
        builder.HasOne(e => e.StaffMember)
            .WithMany()
            .HasForeignKey(e => e.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes for range queries and conflict checks
        builder.HasIndex(e => new { e.BusinessId, e.Date });
        builder.HasIndex(e => new { e.StaffMemberId, e.Date });
        builder.HasIndex(e => new { e.LocationId, e.Date });
    }
}
