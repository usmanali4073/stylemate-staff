using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using staff_domain.Entities;

namespace staff_infrastructure.Data.Configurations;

public class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        builder.ToTable("staff_invitations");

        // Primary key
        builder.HasKey(e => e.Id);

        // Columns
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.StaffMemberId).HasColumnName("staff_member_id").IsRequired();
        builder.Property(e => e.TokenHash).HasColumnName("token_hash").HasMaxLength(128).IsRequired();
        builder.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        builder.Property(e => e.ExpiresAt).HasColumnName("expires_at").IsRequired();
        builder.Property(e => e.Status).HasColumnName("status").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.AcceptedAt).HasColumnName("accepted_at");

        // Foreign key relationship - cascade delete handled in StaffMemberConfiguration
        builder.HasOne(e => e.StaffMember)
            .WithMany(sm => sm.Invitations)
            .HasForeignKey(e => e.StaffMemberId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(e => e.TokenHash);
        builder.HasIndex(e => e.StaffMemberId);
    }
}
