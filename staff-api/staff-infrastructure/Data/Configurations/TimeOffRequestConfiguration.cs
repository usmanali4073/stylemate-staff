using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class TimeOffRequestConfiguration : IEntityTypeConfiguration<TimeOffRequest>
{
    public void Configure(EntityTypeBuilder<TimeOffRequest> builder)
    {
        builder.ToTable("time_off_requests");

        // Primary key
        builder.HasKey(e => e.Id);

        // Columns
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.BusinessId).HasColumnName("business_id").IsRequired();
        builder.Property(e => e.StaffMemberId).HasColumnName("staff_member_id").IsRequired();
        builder.Property(e => e.TimeOffTypeId).HasColumnName("time_off_type_id").IsRequired();
        builder.Property(e => e.StartDate).HasColumnName("start_date").IsRequired();
        builder.Property(e => e.EndDate).HasColumnName("end_date").IsRequired();
        builder.Property(e => e.IsAllDay).HasColumnName("is_all_day").IsRequired();
        builder.Property(e => e.StartTime).HasColumnName("start_time");
        builder.Property(e => e.EndTime).HasColumnName("end_time");
        builder.Property(e => e.Status).HasColumnName("status").IsRequired();
        builder.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(1000);
        builder.Property(e => e.ApprovalNotes).HasColumnName("approval_notes").HasMaxLength(1000);
        builder.Property(e => e.ApprovedByStaffId).HasColumnName("approved_by_staff_id");
        builder.Property(e => e.ApprovedAt).HasColumnName("approved_at");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // Foreign key relationships
        builder.HasOne(e => e.StaffMember)
            .WithMany()
            .HasForeignKey(e => e.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.TimeOffType)
            .WithMany()
            .HasForeignKey(e => e.TimeOffTypeId)
            .OnDelete(DeleteBehavior.Restrict); // Don't cascade-delete type when requests exist

        // Indexes
        builder.HasIndex(e => e.BusinessId);
        builder.HasIndex(e => new { e.BusinessId, e.StaffMemberId, e.Status });
        builder.HasIndex(e => new { e.BusinessId, e.StartDate, e.EndDate });
    }
}
