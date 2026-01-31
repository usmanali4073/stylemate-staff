using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class StaffMemberConfiguration : IEntityTypeConfiguration<StaffMember>
{
    public void Configure(EntityTypeBuilder<StaffMember> builder)
    {
        builder.ToTable("staff_members");

        // Primary key
        builder.HasKey(e => e.Id);

        // Columns
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.BusinessId).HasColumnName("business_id").IsRequired();
        builder.Property(e => e.UserId).HasColumnName("user_id");
        builder.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
        builder.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
        builder.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        builder.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(50);
        builder.Property(e => e.JobTitle).HasColumnName("job_title").HasMaxLength(100);
        builder.Property(e => e.PhotoUrl).HasColumnName("photo_url").HasMaxLength(500);
        builder.Property(e => e.PermissionLevel).HasColumnName("permission_level").IsRequired();
        builder.Property(e => e.Status).HasColumnName("status").IsRequired();
        builder.Property(e => e.IsBookable).HasColumnName("is_bookable").IsRequired();
        builder.Property(e => e.IsDeleted).HasColumnName("is_deleted").IsRequired();
        builder.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // Global query filter for soft delete
        builder.HasQueryFilter(e => !e.IsDeleted);

        // Navigation properties
        builder.HasMany(e => e.StaffLocations)
            .WithOne(sl => sl.StaffMember)
            .HasForeignKey(sl => sl.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.StaffServices)
            .WithOne(ss => ss.StaffMember)
            .HasForeignKey(ss => ss.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Invitations)
            .WithOne(i => i.StaffMember)
            .HasForeignKey(i => i.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(e => e.BusinessId);
        builder.HasIndex(e => new { e.BusinessId, e.Email }).IsUnique();
        builder.HasIndex(e => e.UserId);
    }
}
