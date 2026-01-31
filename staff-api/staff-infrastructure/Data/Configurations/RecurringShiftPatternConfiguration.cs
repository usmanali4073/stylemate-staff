using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class RecurringShiftPatternConfiguration : IEntityTypeConfiguration<RecurringShiftPattern>
{
    public void Configure(EntityTypeBuilder<RecurringShiftPattern> builder)
    {
        builder.ToTable("recurring_shift_patterns");

        // Primary key
        builder.HasKey(e => e.Id);

        // Columns
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.BusinessId).HasColumnName("business_id").IsRequired();
        builder.Property(e => e.StaffMemberId).HasColumnName("staff_member_id").IsRequired();
        builder.Property(e => e.LocationId).HasColumnName("location_id");
        builder.Property(e => e.RRule).HasColumnName("rrule").IsRequired().HasMaxLength(500);
        builder.Property(e => e.StartTime).HasColumnName("start_time").IsRequired();
        builder.Property(e => e.EndTime).HasColumnName("end_time").IsRequired();
        builder.Property(e => e.PatternStart).HasColumnName("pattern_start").IsRequired();
        builder.Property(e => e.PatternEnd).HasColumnName("pattern_end");
        builder.Property(e => e.ShiftType).HasColumnName("shift_type").IsRequired();
        builder.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(500);
        builder.Property(e => e.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // Foreign key relationships
        builder.HasOne(e => e.StaffMember)
            .WithMany()
            .HasForeignKey(e => e.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(e => e.BusinessId);
        builder.HasIndex(e => new { e.BusinessId, e.StaffMemberId });
        builder.HasIndex(e => new { e.BusinessId, e.LocationId });
    }
}
