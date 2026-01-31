using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class TimeOffTypeConfiguration : IEntityTypeConfiguration<TimeOffType>
{
    public void Configure(EntityTypeBuilder<TimeOffType> builder)
    {
        builder.ToTable("time_off_types");

        // Primary key
        builder.HasKey(e => e.Id);

        // Columns
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.BusinessId).HasColumnName("business_id").IsRequired();
        builder.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
        builder.Property(e => e.Color).HasColumnName("color").HasMaxLength(7);
        builder.Property(e => e.IsDefault).HasColumnName("is_default").IsRequired();
        builder.Property(e => e.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // Indexes
        builder.HasIndex(e => e.BusinessId);
        builder.HasIndex(e => new { e.BusinessId, e.Name }).IsUnique();
    }
}
