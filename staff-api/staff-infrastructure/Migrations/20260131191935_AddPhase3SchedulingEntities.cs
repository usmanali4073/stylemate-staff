using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace staff_infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase3SchedulingEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "role_id",
                table: "staff_locations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_override",
                table: "shifts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "pattern_id",
                table: "shifts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "recurring_shift_patterns",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_id = table.Column<Guid>(type: "uuid", nullable: true),
                    rrule = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    pattern_start = table.Column<DateOnly>(type: "date", nullable: false),
                    pattern_end = table.Column<DateOnly>(type: "date", nullable: true),
                    shift_type = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_recurring_shift_patterns", x => x.id);
                    table.ForeignKey(
                        name: "FK_recurring_shift_patterns_staff_members_staff_member_id",
                        column: x => x.staff_member_id,
                        principalTable: "staff_members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    is_immutable = table.Column<bool>(type: "boolean", nullable: false),
                    view_schedule = table.Column<bool>(type: "boolean", nullable: false),
                    manage_schedule = table.Column<bool>(type: "boolean", nullable: false),
                    view_time_off = table.Column<bool>(type: "boolean", nullable: false),
                    manage_time_off = table.Column<bool>(type: "boolean", nullable: false),
                    approve_time_off = table.Column<bool>(type: "boolean", nullable: false),
                    view_staff = table.Column<bool>(type: "boolean", nullable: false),
                    manage_staff = table.Column<bool>(type: "boolean", nullable: false),
                    view_services = table.Column<bool>(type: "boolean", nullable: false),
                    manage_services = table.Column<bool>(type: "boolean", nullable: false),
                    view_clients = table.Column<bool>(type: "boolean", nullable: false),
                    manage_clients = table.Column<bool>(type: "boolean", nullable: false),
                    view_reports = table.Column<bool>(type: "boolean", nullable: false),
                    manage_business_settings = table.Column<bool>(type: "boolean", nullable: false),
                    manage_location_settings = table.Column<bool>(type: "boolean", nullable: false),
                    view_bookings = table.Column<bool>(type: "boolean", nullable: false),
                    manage_bookings = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "time_off_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_time_off_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "time_off_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_member_id = table.Column<Guid>(type: "uuid", nullable: false),
                    time_off_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    is_all_day = table.Column<bool>(type: "boolean", nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    approval_notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    approved_by_staff_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_time_off_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_time_off_requests_staff_members_staff_member_id",
                        column: x => x.staff_member_id,
                        principalTable: "staff_members",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_time_off_requests_time_off_types_time_off_type_id",
                        column: x => x.time_off_type_id,
                        principalTable: "time_off_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_staff_locations_role_id",
                table: "staff_locations",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_shifts_pattern_id",
                table: "shifts",
                column: "pattern_id");

            migrationBuilder.CreateIndex(
                name: "IX_recurring_shift_patterns_business_id",
                table: "recurring_shift_patterns",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "IX_recurring_shift_patterns_business_id_location_id",
                table: "recurring_shift_patterns",
                columns: new[] { "business_id", "location_id" });

            migrationBuilder.CreateIndex(
                name: "IX_recurring_shift_patterns_business_id_staff_member_id",
                table: "recurring_shift_patterns",
                columns: new[] { "business_id", "staff_member_id" });

            migrationBuilder.CreateIndex(
                name: "IX_recurring_shift_patterns_staff_member_id",
                table: "recurring_shift_patterns",
                column: "staff_member_id");

            migrationBuilder.CreateIndex(
                name: "IX_roles_business_id",
                table: "roles",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "IX_roles_business_id_name",
                table: "roles",
                columns: new[] { "business_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_time_off_requests_business_id",
                table: "time_off_requests",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "IX_time_off_requests_business_id_staff_member_id_status",
                table: "time_off_requests",
                columns: new[] { "business_id", "staff_member_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_time_off_requests_business_id_start_date_end_date",
                table: "time_off_requests",
                columns: new[] { "business_id", "start_date", "end_date" });

            migrationBuilder.CreateIndex(
                name: "IX_time_off_requests_staff_member_id",
                table: "time_off_requests",
                column: "staff_member_id");

            migrationBuilder.CreateIndex(
                name: "IX_time_off_requests_time_off_type_id",
                table: "time_off_requests",
                column: "time_off_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_time_off_types_business_id",
                table: "time_off_types",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "IX_time_off_types_business_id_name",
                table: "time_off_types",
                columns: new[] { "business_id", "name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_shifts_recurring_shift_patterns_pattern_id",
                table: "shifts",
                column: "pattern_id",
                principalTable: "recurring_shift_patterns",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_staff_locations_roles_role_id",
                table: "staff_locations",
                column: "role_id",
                principalTable: "roles",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_shifts_recurring_shift_patterns_pattern_id",
                table: "shifts");

            migrationBuilder.DropForeignKey(
                name: "FK_staff_locations_roles_role_id",
                table: "staff_locations");

            migrationBuilder.DropTable(
                name: "recurring_shift_patterns");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "time_off_requests");

            migrationBuilder.DropTable(
                name: "time_off_types");

            migrationBuilder.DropIndex(
                name: "IX_staff_locations_role_id",
                table: "staff_locations");

            migrationBuilder.DropIndex(
                name: "IX_shifts_pattern_id",
                table: "shifts");

            migrationBuilder.DropColumn(
                name: "role_id",
                table: "staff_locations");

            migrationBuilder.DropColumn(
                name: "is_override",
                table: "shifts");

            migrationBuilder.DropColumn(
                name: "pattern_id",
                table: "shifts");
        }
    }
}
