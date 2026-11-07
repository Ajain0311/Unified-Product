using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SuperApp.API.Models;

public static class WaterSupplierStatuses
{
    public const string Pending = "PENDING";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
}

public static class WaterOrderStatuses
{
    public const string Pending = "PENDING";
    public const string Accepted = "ACCEPTED";
    public const string Preparing = "PREPARING";
    public const string Dispatched = "DISPATCHED";
    public const string Delivered = "DELIVERED";
    public const string Cancelled = "CANCELLED";
    public const string Rejected = "REJECTED";
}

public class WaterSupplier
{
    [Key] public long Id { get; set; }
    public long UserId { get; set; }
    [ForeignKey(nameof(UserId))] public User User { get; set; } = null!;
    [Required, MaxLength(150)] public string BusinessName { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string ContactPhone { get; set; } = string.Empty;
    [Required, MaxLength(300)] public string Address { get; set; } = string.Empty;
    [Required, MaxLength(80)] public string City { get; set; } = string.Empty;
    [Required, MaxLength(1000)] public string DeliveryCities { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string BusinessDocumentNo { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string Status { get; set; } = WaterSupplierStatuses.Pending;
    [MaxLength(500)] public string? AdminNotes { get; set; }
    public long? ReviewedByAdminId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal MinimumDeliveryValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<WaterProduct> Products { get; set; } = new List<WaterProduct>();
}

public class WaterProduct
{
    [Key] public long Id { get; set; }
    public long SupplierId { get; set; }
    [ForeignKey(nameof(SupplierId))] public WaterSupplier Supplier { get; set; } = null!;
    [Required, MaxLength(100)] public string Brand { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string Name { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string BottleSize { get; set; } = string.Empty;
    public int BottlesPerCase { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal CasePrice { get; set; }
    public int MinimumCases { get; set; }
    public int AvailableCases { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class WaterOrder
{
    [Key] public long Id { get; set; }
    [Required, MaxLength(30)] public string OrderNumber { get; set; } = string.Empty;
    public long CustomerId { get; set; }
    [ForeignKey(nameof(CustomerId))] public User Customer { get; set; } = null!;
    public long SupplierId { get; set; }
    [ForeignKey(nameof(SupplierId))] public WaterSupplier Supplier { get; set; } = null!;
    [Required, MaxLength(300)] public string DeliveryAddress { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string Status { get; set; } = WaterOrderStatuses.Pending;
    [Required, MaxLength(20)] public string PaymentStatus { get; set; } = "UNPAID";
    [Column(TypeName = "decimal(10,2)")] public decimal TotalAmount { get; set; }
    [MaxLength(40)] public string? InvoiceNumber { get; set; }
    public DateTime? InvoiceDueAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<WaterOrderLine> Lines { get; set; } = new List<WaterOrderLine>();
    public WaterInvoice? Invoice { get; set; }
}

public class WaterOrderLine
{
    [Key] public long Id { get; set; }
    public long OrderId { get; set; }
    [ForeignKey(nameof(OrderId))] public WaterOrder Order { get; set; } = null!;
    public long ProductId { get; set; }
    [ForeignKey(nameof(ProductId))] public WaterProduct Product { get; set; } = null!;
    [Required, MaxLength(200)] public string ProductName { get; set; } = string.Empty;
    public int Cases { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal CasePrice { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal LineTotal { get; set; }
}

public class WaterInvoice
{
    [Key] public long Id { get; set; }
    public long OrderId { get; set; }
    [ForeignKey(nameof(OrderId))] public WaterOrder Order { get; set; } = null!;
    [Required, MaxLength(40)] public string InvoiceNumber { get; set; } = string.Empty;
    [Column(TypeName = "decimal(10,2)")] public decimal Amount { get; set; }
    [Required, MaxLength(20)] public string Status { get; set; } = "UNPAID";
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueAt { get; set; }
    [MaxLength(100)] public string? PaymentReference { get; set; }
    public DateTime? PaidAt { get; set; }
}

public static class WaterQuoteStatuses
{
    public const string Requested = "REQUESTED";
    public const string Quoted = "QUOTED";
    public const string Accepted = "ACCEPTED";
    public const string Declined = "DECLINED";
}

public class WaterQuote
{
    [Key] public long Id { get; set; }
    public long CustomerId { get; set; }
    [ForeignKey(nameof(CustomerId))] public User Customer { get; set; } = null!;
    public long SupplierId { get; set; }
    [ForeignKey(nameof(SupplierId))] public WaterSupplier Supplier { get; set; } = null!;
    [Required, MaxLength(300)] public string DeliveryAddress { get; set; } = string.Empty;
    [Required, MaxLength(80)] public string DeliveryCity { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string Status { get; set; } = WaterQuoteStatuses.Requested;
    [MaxLength(500)] public string? BuyerNotes { get; set; }
    [MaxLength(500)] public string? SupplierNotes { get; set; }
    public long? ResultOrderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public ICollection<WaterQuoteLine> Lines { get; set; } = new List<WaterQuoteLine>();
}

public class WaterQuoteLine
{
    [Key] public long Id { get; set; }
    public long QuoteId { get; set; }
    [ForeignKey(nameof(QuoteId))] public WaterQuote Quote { get; set; } = null!;
    public long ProductId { get; set; }
    [ForeignKey(nameof(ProductId))] public WaterProduct Product { get; set; } = null!;
    [Required, MaxLength(200)] public string ProductName { get; set; } = string.Empty;
    public int Cases { get; set; }
    [Column(TypeName = "decimal(10,2)")] public decimal? OfferedCasePrice { get; set; }
}
