using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using SuperApp.API.Data;

#nullable disable

namespace SuperApp.API.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261107103000_AddRestaurantDeliveryRadius")]
public sealed class AddRestaurantDeliveryRadius : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        var isPostgres = migrationBuilder.ActiveProvider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;
        migrationBuilder.AddColumn<decimal>(
            name: isPostgres ? "delivery_radius_km" : "DeliveryRadiusKm",
            table: isPostgres ? "restaurants" : "Restaurants",
            type: isPostgres ? "numeric(6,2)" : "decimal(6,2)",
            precision: 6,
            scale: 2,
            nullable: true);

        var recordTable = isPostgres ? "idempotency_records" : "IdempotencyRecords";
        if (isPostgres)
        {
            migrationBuilder.CreateTable(
                name: recordTable,
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false).Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    operation = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    request_key = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    request_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    response_status_code = table.Column<int>(type: "integer", nullable: false),
                    response_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table => table.PrimaryKey("pk_idempotency_records", x => x.id));
        }
        else
        {
            migrationBuilder.CreateTable(
                name: recordTable,
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Operation = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    RequestKey = table.Column<string>(type: "nvarchar(36)", maxLength: 36, nullable: false),
                    RequestHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ResponseStatusCode = table.Column<int>(type: "int", nullable: false),
                    ResponseJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table => table.PrimaryKey("PK_IdempotencyRecords", x => x.Id));
        }

        migrationBuilder.CreateIndex(
            name: isPostgres ? "ix_idempotency_records_user_id_operation_request_key" : "IX_IdempotencyRecords_UserId_Operation_RequestKey",
            table: recordTable,
            columns: isPostgres ? ["user_id", "operation", "request_key"] : ["UserId", "Operation", "RequestKey"],
            unique: true);
        migrationBuilder.CreateIndex(
            name: isPostgres ? "ix_idempotency_records_expires_at" : "IX_IdempotencyRecords_ExpiresAt",
            table: recordTable,
            column: isPostgres ? "expires_at" : "ExpiresAt");

        var appSettingsTable = isPostgres ? "app_settings" : "AppSettings";
        var key = isPostgres ? "setting_key" : "SettingKey";
        var value = isPostgres ? "setting_value" : "SettingValue";
        var description = isPostgres ? "description" : "Description";
        var updatedAt = isPostgres ? "updated_at" : "UpdatedAt";
        var zones = "[{\"MinLatitude\":24.1,\"MaxLatitude\":25.5,\"MinLongitude\":74.0,\"MaxLongitude\":75.5}]";
        var values = new (string Key, string Value, string Description)[]
        {
            ("serviceability_center_latitude", "24.66", "Approved Mandphiya serviceability center latitude"),
            ("serviceability_center_longitude", "74.4", "Approved Mandphiya serviceability center longitude"),
            ("food_default_service_radius_km", "20", "Default food delivery service radius in kilometers"),
            ("ride_pickup_radius_km", "20", "Maximum pickup distance from Mandphiya in kilometers"),
            ("ride_max_road_distance_km", "20", "Maximum verified road route distance in kilometers"),
            ("ride_destination_zones", zones, "Configured supported ride destination zones"),
            ("gps_max_cached_age_seconds", "60", "Maximum accepted GPS fix age in seconds"),
            ("gps_max_accuracy_meters", "50", "Maximum accepted horizontal GPS accuracy in meters")
        };
        foreach (var setting in values)
        {
            var quotedValue = setting.Value.Replace("'", "''", StringComparison.Ordinal);
            var quotedDescription = setting.Description.Replace("'", "''", StringComparison.Ordinal);
            migrationBuilder.Sql(isPostgres
                ? $"INSERT INTO {appSettingsTable} ({key}, {value}, {description}, {updatedAt}) SELECT '{setting.Key}', '{quotedValue}', '{quotedDescription}', NOW() WHERE NOT EXISTS (SELECT 1 FROM {appSettingsTable} WHERE {key} = '{setting.Key}');"
                : $"IF NOT EXISTS (SELECT 1 FROM {appSettingsTable} WHERE {key} = '{setting.Key}') INSERT INTO {appSettingsTable} ({key}, {value}, {description}, {updatedAt}) VALUES ('{setting.Key}', '{quotedValue}', '{quotedDescription}', SYSUTCDATETIME());");
        }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        var isPostgres = migrationBuilder.ActiveProvider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;
        migrationBuilder.DropTable(name: isPostgres ? "idempotency_records" : "IdempotencyRecords");
        migrationBuilder.DropColumn(
            name: isPostgres ? "delivery_radius_km" : "DeliveryRadiusKm",
            table: isPostgres ? "restaurants" : "Restaurants");
        // Preserve operational configuration values; administrators may have changed them since the migration ran.
    }
}
