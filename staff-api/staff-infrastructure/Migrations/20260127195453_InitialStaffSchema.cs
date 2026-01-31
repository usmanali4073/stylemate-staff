using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace staff_infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialStaffSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "staff_members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    job_title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    photo_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    permission_level = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    is_bookable = table.Column<bool>(type: "boolean", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_members", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "staff_invitations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    accepted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_invitations", x => x.id);
                    table.ForeignKey(
                        name: "FK_staff_invitations_staff_members_staff_member_id",
                        column: x => x.staff_member_id,
                        principalTable: "staff_members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "staff_locations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_locations", x => x.id);
                    table.ForeignKey(
                        name: "FK_staff_locations_staff_members_staff_member_id",
                        column: x => x.staff_member_id,
                        principalTable: "staff_members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "staff_services",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_staff_services", x => x.id);
                    table.ForeignKey(
                        name: "FK_staff_services_staff_members_staff_member_id",
                        column: x => x.staff_member_id,
                        principalTable: "staff_members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_staff_invitations_staff_member_id",
                table: "staff_invitations",
                column: "staff_member_id");

            migrationBuilder.CreateIndex(
                name: "IX_staff_invitations_token_hash",
                table: "staff_invitations",
                column: "token_hash");

            migrationBuilder.CreateIndex(
                name: "IX_staff_locations_location_id",
                table: "staff_locations",
                column: "location_id");

            migrationBuilder.CreateIndex(
                name: "IX_staff_locations_staff_member_id_location_id",
                table: "staff_locations",
                columns: new[] { "staff_member_id", "location_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_staff_members_business_id",
                table: "staff_members",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "IX_staff_members_business_id_email",
                table: "staff_members",
                columns: new[] { "business_id", "email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_staff_members_user_id",
                table: "staff_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_staff_services_service_id",
                table: "staff_services",
                column: "service_id");

            migrationBuilder.CreateIndex(
                name: "IX_staff_services_staff_member_id_service_id",
                table: "staff_services",
                columns: new[] { "staff_member_id", "service_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "staff_invitations");

            migrationBuilder.DropTable(
                name: "staff_locations");

            migrationBuilder.DropTable(
                name: "staff_services");

            migrationBuilder.DropTable(
                name: "staff_members");
        }
    }
}
