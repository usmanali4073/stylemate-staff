using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace staff_infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationIdRemovePosition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "position",
                table: "shifts");

            migrationBuilder.AddColumn<Guid>(
                name: "location_id",
                table: "shifts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_shifts_location_id_date",
                table: "shifts",
                columns: new[] { "location_id", "date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_shifts_location_id_date",
                table: "shifts");

            migrationBuilder.DropColumn(
                name: "location_id",
                table: "shifts");

            migrationBuilder.AddColumn<string>(
                name: "position",
                table: "shifts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
