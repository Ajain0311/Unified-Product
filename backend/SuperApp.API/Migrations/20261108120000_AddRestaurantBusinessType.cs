using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using SuperApp.API.Data;

#nullable disable

namespace SuperApp.API.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261108120000_AddRestaurantBusinessType")]
public sealed class AddRestaurantBusinessType : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        var postgres = migrationBuilder.ActiveProvider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;
        migrationBuilder.Sql(postgres
            ? "INSERT INTO roles (name, description, is_active, created_at) SELECT 'WATER_SUPPLIER', 'Verified water supplier', TRUE, NOW() WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'WATER_SUPPLIER'); SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));"
            : "IF NOT EXISTS (SELECT 1 FROM Roles WHERE Name = 'WATER_SUPPLIER') INSERT INTO Roles (Name, Description, IsActive, CreatedAt) VALUES ('WATER_SUPPLIER', 'Verified water supplier', 1, SYSUTCDATETIME());");
        migrationBuilder.AddColumn<string>(
            name: postgres ? "business_type" : "BusinessType",
            table: postgres ? "restaurants" : "Restaurants",
            type: postgres ? "character varying(24)" : "nvarchar(24)",
            maxLength: 24,
            nullable: false,
            defaultValue: "RESTAURANT");
        migrationBuilder.CreateIndex(
            name: postgres ? "ix_restaurants_business_type_is_active_city" : "IX_Restaurants_BusinessType_IsActive_City",
            table: postgres ? "restaurants" : "Restaurants",
            columns: postgres ? ["business_type", "is_active", "city"] : ["BusinessType", "IsActive", "City"]);

        migrationBuilder.AddColumn<int>(name: postgres ? "reservation_capacity" : "ReservationCapacity", table: postgres ? "restaurants" : "Restaurants", type: postgres ? "integer" : "int", nullable: true);
        migrationBuilder.AddColumn<int>(name: postgres ? "reservation_duration_minutes" : "ReservationDurationMinutes", table: postgres ? "restaurants" : "Restaurants", type: postgres ? "integer" : "int", nullable: true);
        if (postgres)
        {
            migrationBuilder.CreateTable("bar_reservations", table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false).Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                restaurant_id = table.Column<long>(type: "bigint", nullable: false),
                user_id = table.Column<long>(type: "bigint", nullable: false),
                reservation_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                party_size = table.Column<int>(type: "integer", nullable: false),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                customer_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                venue_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            }, constraints: table =>
            {
                table.PrimaryKey("pk_bar_reservations", x => x.id);
                table.ForeignKey("fk_bar_reservations_restaurants_restaurant_id", x => x.restaurant_id, "restaurants", "id", onDelete: ReferentialAction.NoAction);
                table.ForeignKey("fk_bar_reservations_users_user_id", x => x.user_id, "users", "id", onDelete: ReferentialAction.NoAction);
            });
            migrationBuilder.CreateIndex("ix_bar_reservations_restaurant_id_reservation_at_status", "bar_reservations", ["restaurant_id", "reservation_at", "status"]);
            migrationBuilder.CreateIndex("ix_bar_reservations_user_id_created_at", "bar_reservations", ["user_id", "created_at"]);
        }
        else
        {
            migrationBuilder.CreateTable("BarReservations", table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                RestaurantId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                ReservationAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                PartySize = table.Column<int>(type: "int", nullable: false),
                Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                CustomerNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                VenueNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            }, constraints: table =>
            {
                table.PrimaryKey("PK_BarReservations", x => x.Id);
                table.ForeignKey("FK_BarReservations_Restaurants_RestaurantId", x => x.RestaurantId, "Restaurants", "Id", onDelete: ReferentialAction.NoAction);
                table.ForeignKey("FK_BarReservations_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.NoAction);
            });
            migrationBuilder.CreateIndex("IX_BarReservations_RestaurantId_ReservationAt_Status", "BarReservations", ["RestaurantId", "ReservationAt", "Status"]);
            migrationBuilder.CreateIndex("IX_BarReservations_UserId_CreatedAt", "BarReservations", ["UserId", "CreatedAt"]);
        }

        if (postgres)
            migrationBuilder.Sql("ALTER TABLE role_applications ADD COLUMN IF NOT EXISTS business_type character varying(24) NULL;");
        else
            migrationBuilder.Sql("IF COL_LENGTH('RoleApplications', 'BusinessType') IS NULL ALTER TABLE RoleApplications ADD BusinessType nvarchar(24) NULL;");

        migrationBuilder.Sql(postgres ? """
            CREATE TABLE water_suppliers (
                id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id), business_name VARCHAR(150) NOT NULL,
                contact_phone VARCHAR(20) NOT NULL, address VARCHAR(300) NOT NULL, city VARCHAR(80) NOT NULL,
                delivery_cities VARCHAR(1000) NOT NULL, business_document_no VARCHAR(40) NOT NULL, status VARCHAR(20) NOT NULL,
                admin_notes VARCHAR(500) NULL, reviewed_by_admin_id BIGINT NULL, reviewed_at TIMESTAMPTZ NULL,
                minimum_delivery_value NUMERIC(10,2) NOT NULL, created_at TIMESTAMPTZ NOT NULL,
                updated_at TIMESTAMPTZ NULL
            );
            CREATE UNIQUE INDEX ix_water_suppliers_user_id ON water_suppliers(user_id);
            CREATE INDEX ix_water_suppliers_status ON water_suppliers(status);
            CREATE INDEX ix_water_suppliers_city ON water_suppliers(city);
            CREATE TABLE water_products (
                id BIGSERIAL PRIMARY KEY, supplier_id BIGINT NOT NULL REFERENCES water_suppliers(id) ON DELETE CASCADE,
                brand VARCHAR(100) NOT NULL, name VARCHAR(200) NOT NULL, bottle_size VARCHAR(100) NOT NULL,
                bottles_per_case INTEGER NOT NULL, case_price NUMERIC(10,2) NOT NULL, minimum_cases INTEGER NOT NULL,
                available_cases INTEGER NOT NULL, is_active BOOLEAN NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NULL
            );
            CREATE INDEX ix_water_products_supplier_id_is_active ON water_products(supplier_id, is_active);
            CREATE TABLE water_orders (
                id BIGSERIAL PRIMARY KEY, order_number VARCHAR(30) NOT NULL, customer_id BIGINT NOT NULL REFERENCES users(id),
                supplier_id BIGINT NOT NULL REFERENCES water_suppliers(id), delivery_address VARCHAR(300) NOT NULL,
                status VARCHAR(20) NOT NULL, payment_status VARCHAR(20) NOT NULL, total_amount NUMERIC(10,2) NOT NULL,
                invoice_number VARCHAR(40) NULL, invoice_due_at TIMESTAMPTZ NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NULL
            );
            CREATE UNIQUE INDEX ix_water_orders_order_number ON water_orders(order_number);
            CREATE UNIQUE INDEX ix_water_orders_invoice_number ON water_orders(invoice_number);
            CREATE INDEX ix_water_orders_customer_id_created_at ON water_orders(customer_id, created_at);
            CREATE INDEX ix_water_orders_supplier_id_status_created_at ON water_orders(supplier_id, status, created_at);
            CREATE TABLE water_order_lines (
                id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES water_orders(id) ON DELETE CASCADE,
                product_id BIGINT NOT NULL REFERENCES water_products(id), product_name VARCHAR(200) NOT NULL, cases INTEGER NOT NULL,
                case_price NUMERIC(10,2) NOT NULL, line_total NUMERIC(10,2) NOT NULL
            );
            CREATE INDEX ix_water_order_lines_order_id ON water_order_lines(order_id);
            CREATE TABLE water_invoices (
                id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES water_orders(id), invoice_number VARCHAR(40) NOT NULL,
                amount NUMERIC(10,2) NOT NULL, status VARCHAR(20) NOT NULL, issued_at TIMESTAMPTZ NOT NULL, due_at TIMESTAMPTZ NULL,
                payment_reference VARCHAR(100) NULL, paid_at TIMESTAMPTZ NULL
            );
            CREATE UNIQUE INDEX ix_water_invoices_order_id ON water_invoices(order_id);
            CREATE UNIQUE INDEX ix_water_invoices_invoice_number ON water_invoices(invoice_number);
            CREATE TABLE water_quotes (
                id BIGSERIAL PRIMARY KEY, customer_id BIGINT NOT NULL REFERENCES users(id), supplier_id BIGINT NOT NULL REFERENCES water_suppliers(id),
                delivery_address VARCHAR(300) NOT NULL, delivery_city VARCHAR(80) NOT NULL, status VARCHAR(20) NOT NULL,
                buyer_notes VARCHAR(500) NULL, supplier_notes VARCHAR(500) NULL, result_order_id BIGINT NULL,
                created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NULL
            );
            CREATE INDEX ix_water_quotes_customer_id_created_at ON water_quotes(customer_id, created_at);
            CREATE INDEX ix_water_quotes_supplier_id_status_created_at ON water_quotes(supplier_id, status, created_at);
            CREATE TABLE water_quote_lines (
                id BIGSERIAL PRIMARY KEY, quote_id BIGINT NOT NULL REFERENCES water_quotes(id) ON DELETE CASCADE,
                product_id BIGINT NOT NULL REFERENCES water_products(id), product_name VARCHAR(200) NOT NULL,
                cases INTEGER NOT NULL, offered_case_price NUMERIC(10,2) NULL
            );
            CREATE INDEX ix_water_quote_lines_quote_id ON water_quote_lines(quote_id);
            """ : """
            CREATE TABLE WaterSuppliers (
                Id bigint IDENTITY PRIMARY KEY, UserId bigint NOT NULL REFERENCES Users(Id), BusinessName nvarchar(150) NOT NULL,
                ContactPhone nvarchar(20) NOT NULL, Address nvarchar(300) NOT NULL, City nvarchar(80) NOT NULL,
                DeliveryCities nvarchar(1000) NOT NULL, BusinessDocumentNo nvarchar(40) NOT NULL, Status nvarchar(20) NOT NULL,
                AdminNotes nvarchar(500) NULL, ReviewedByAdminId bigint NULL, ReviewedAt datetime2 NULL,
                MinimumDeliveryValue decimal(10,2) NOT NULL, CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL
            );
            CREATE UNIQUE INDEX IX_WaterSuppliers_UserId ON WaterSuppliers(UserId);
            CREATE INDEX IX_WaterSuppliers_Status ON WaterSuppliers(Status);
            CREATE INDEX IX_WaterSuppliers_City ON WaterSuppliers(City);
            CREATE TABLE WaterProducts (
                Id bigint IDENTITY PRIMARY KEY, SupplierId bigint NOT NULL REFERENCES WaterSuppliers(Id) ON DELETE CASCADE,
                Brand nvarchar(100) NOT NULL, Name nvarchar(200) NOT NULL, BottleSize nvarchar(100) NOT NULL,
                BottlesPerCase int NOT NULL, CasePrice decimal(10,2) NOT NULL, MinimumCases int NOT NULL,
                AvailableCases int NOT NULL, IsActive bit NOT NULL, CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL
            );
            CREATE INDEX IX_WaterProducts_SupplierId_IsActive ON WaterProducts(SupplierId, IsActive);
            CREATE TABLE WaterOrders (
                Id bigint IDENTITY PRIMARY KEY, OrderNumber nvarchar(30) NOT NULL, CustomerId bigint NOT NULL REFERENCES Users(Id),
                SupplierId bigint NOT NULL REFERENCES WaterSuppliers(Id), DeliveryAddress nvarchar(300) NOT NULL,
                Status nvarchar(20) NOT NULL, PaymentStatus nvarchar(20) NOT NULL, TotalAmount decimal(10,2) NOT NULL,
                InvoiceNumber nvarchar(40) NULL, InvoiceDueAt datetime2 NULL, CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL
            );
            CREATE UNIQUE INDEX IX_WaterOrders_OrderNumber ON WaterOrders(OrderNumber);
            CREATE UNIQUE INDEX IX_WaterOrders_InvoiceNumber ON WaterOrders(InvoiceNumber) WHERE InvoiceNumber IS NOT NULL;
            CREATE INDEX IX_WaterOrders_CustomerId_CreatedAt ON WaterOrders(CustomerId, CreatedAt);
            CREATE INDEX IX_WaterOrders_SupplierId_Status_CreatedAt ON WaterOrders(SupplierId, Status, CreatedAt);
            CREATE TABLE WaterOrderLines (
                Id bigint IDENTITY PRIMARY KEY, OrderId bigint NOT NULL REFERENCES WaterOrders(Id) ON DELETE CASCADE,
                ProductId bigint NOT NULL REFERENCES WaterProducts(Id), ProductName nvarchar(200) NOT NULL, Cases int NOT NULL,
                CasePrice decimal(10,2) NOT NULL, LineTotal decimal(10,2) NOT NULL
            );
            CREATE INDEX IX_WaterOrderLines_OrderId ON WaterOrderLines(OrderId);
            CREATE TABLE WaterInvoices (
                Id bigint IDENTITY PRIMARY KEY, OrderId bigint NOT NULL REFERENCES WaterOrders(Id), InvoiceNumber nvarchar(40) NOT NULL,
                Amount decimal(10,2) NOT NULL, Status nvarchar(20) NOT NULL, IssuedAt datetime2 NOT NULL, DueAt datetime2 NULL,
                PaymentReference nvarchar(100) NULL, PaidAt datetime2 NULL
            );
            CREATE UNIQUE INDEX IX_WaterInvoices_OrderId ON WaterInvoices(OrderId);
            CREATE UNIQUE INDEX IX_WaterInvoices_InvoiceNumber ON WaterInvoices(InvoiceNumber);
            CREATE TABLE WaterQuotes (
                Id bigint IDENTITY PRIMARY KEY, CustomerId bigint NOT NULL REFERENCES Users(Id), SupplierId bigint NOT NULL REFERENCES WaterSuppliers(Id),
                DeliveryAddress nvarchar(300) NOT NULL, DeliveryCity nvarchar(80) NOT NULL, Status nvarchar(20) NOT NULL,
                BuyerNotes nvarchar(500) NULL, SupplierNotes nvarchar(500) NULL, ResultOrderId bigint NULL,
                CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL
            );
            CREATE INDEX IX_WaterQuotes_CustomerId_CreatedAt ON WaterQuotes(CustomerId, CreatedAt);
            CREATE INDEX IX_WaterQuotes_SupplierId_Status_CreatedAt ON WaterQuotes(SupplierId, Status, CreatedAt);
            CREATE TABLE WaterQuoteLines (
                Id bigint IDENTITY PRIMARY KEY, QuoteId bigint NOT NULL REFERENCES WaterQuotes(Id) ON DELETE CASCADE,
                ProductId bigint NOT NULL REFERENCES WaterProducts(Id), ProductName nvarchar(200) NOT NULL,
                Cases int NOT NULL, OfferedCasePrice decimal(10,2) NULL
            );
            CREATE INDEX IX_WaterQuoteLines_QuoteId ON WaterQuoteLines(QuoteId);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        var postgres = migrationBuilder.ActiveProvider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;
        migrationBuilder.Sql(postgres ? "DELETE FROM roles WHERE name = 'WATER_SUPPLIER';" : "DELETE FROM Roles WHERE Name = 'WATER_SUPPLIER';");
        migrationBuilder.DropIndex(
            name: postgres ? "ix_restaurants_business_type_is_active_city" : "IX_Restaurants_BusinessType_IsActive_City",
            table: postgres ? "restaurants" : "Restaurants");
        migrationBuilder.DropTable(postgres ? "bar_reservations" : "BarReservations");
        migrationBuilder.DropColumn(name: postgres ? "reservation_capacity" : "ReservationCapacity", table: postgres ? "restaurants" : "Restaurants");
        migrationBuilder.DropColumn(name: postgres ? "reservation_duration_minutes" : "ReservationDurationMinutes", table: postgres ? "restaurants" : "Restaurants");
        migrationBuilder.DropColumn(
            name: postgres ? "business_type" : "BusinessType",
            table: postgres ? "restaurants" : "Restaurants");
        if (postgres)
            migrationBuilder.Sql("ALTER TABLE role_applications DROP COLUMN IF EXISTS business_type;");
        else
            migrationBuilder.Sql("IF COL_LENGTH('RoleApplications', 'BusinessType') IS NOT NULL ALTER TABLE RoleApplications DROP COLUMN BusinessType;");
        migrationBuilder.Sql(postgres ? "DROP TABLE water_quote_lines; DROP TABLE water_quotes; DROP TABLE water_invoices; DROP TABLE water_order_lines; DROP TABLE water_orders; DROP TABLE water_products; DROP TABLE water_suppliers;" : "DROP TABLE WaterQuoteLines; DROP TABLE WaterQuotes; DROP TABLE WaterInvoices; DROP TABLE WaterOrderLines; DROP TABLE WaterOrders; DROP TABLE WaterProducts; DROP TABLE WaterSuppliers;");
    }
}
