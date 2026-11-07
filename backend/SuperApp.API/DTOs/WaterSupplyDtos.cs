using System.ComponentModel.DataAnnotations;

namespace SuperApp.API.DTOs;

public sealed class WaterSupplierApplicationRequest
{
    [Required, MaxLength(150)] public string BusinessName { get; set; } = string.Empty;
    [Required, MaxLength(20)] public string ContactPhone { get; set; } = string.Empty;
    [Required, MaxLength(300)] public string Address { get; set; } = string.Empty;
    [Required, MaxLength(80)] public string City { get; set; } = string.Empty;
    [Required, MaxLength(1000)] public string DeliveryCities { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string BusinessDocumentNo { get; set; } = string.Empty;
    [Range(typeof(decimal), "0", "9999999999")] public decimal MinimumDeliveryValue { get; set; }
}

public sealed class WaterProductRequest
{
    public long? Id { get; set; }
    [Required, MaxLength(100)] public string Brand { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string Name { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string BottleSize { get; set; } = string.Empty;
    [Range(1, int.MaxValue)] public int BottlesPerCase { get; set; }
    [Range(typeof(decimal), "0.01", "99999999")] public decimal CasePrice { get; set; }
    [Range(1, int.MaxValue)] public int MinimumCases { get; set; }
    [Range(0, int.MaxValue)] public int AvailableCases { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class WaterOrderRequest
{
    [Range(1, long.MaxValue)] public long SupplierId { get; set; }
    [Required, MaxLength(300)] public string DeliveryAddress { get; set; } = string.Empty;
    [Required, MaxLength(80)] public string DeliveryCity { get; set; } = string.Empty;
    [Required, MinLength(1)] public List<WaterOrderLineRequest> Lines { get; set; } = new();
}

public sealed class WaterOrderLineRequest
{
    [Range(1, long.MaxValue)] public long ProductId { get; set; }
    [Range(1, int.MaxValue)] public int Cases { get; set; }
}

public sealed class WaterOrderStatusRequest
{
    [Required, MaxLength(20)] public string Status { get; set; } = string.Empty;
}

public sealed class WaterAdminReviewRequest
{
    [Required, MaxLength(20)] public string Status { get; set; } = string.Empty;
    [MaxLength(500)] public string? Notes { get; set; }
}

public sealed class WaterQuoteRequest
{
    [Range(1, long.MaxValue)] public long SupplierId { get; set; }
    [Required, MaxLength(300)] public string DeliveryAddress { get; set; } = string.Empty;
    [Required, MaxLength(80)] public string DeliveryCity { get; set; } = string.Empty;
    [MaxLength(500)] public string? Notes { get; set; }
    [Required, MinLength(1)] public List<WaterOrderLineRequest> Lines { get; set; } = new();
}

public sealed class WaterQuoteOfferRequest
{
    [MaxLength(500)] public string? Notes { get; set; }
    [Required, MinLength(1)] public List<WaterQuoteOfferLineRequest> Lines { get; set; } = new();
}

public sealed class WaterQuoteOfferLineRequest
{
    [Range(1, long.MaxValue)] public long ProductId { get; set; }
    [Range(typeof(decimal), "0.01", "99999999")] public decimal CasePrice { get; set; }
}

public sealed class WaterQuoteDto
{
    public long Id { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? BuyerNotes { get; set; }
    public string? SupplierNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<WaterQuoteLineDto> Lines { get; set; } = new();
}

public sealed class WaterQuoteLineDto
{
    public long ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Cases { get; set; }
    public decimal? OfferedCasePrice { get; set; }
}

public sealed class WaterProductDto
{
    public long Id { get; set; }
    public long SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BottleSize { get; set; } = string.Empty;
    public int BottlesPerCase { get; set; }
    public decimal CasePrice { get; set; }
    public int MinimumCases { get; set; }
    public int AvailableCases { get; set; }
}

public sealed class WaterOrderDto
{
    public long Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public long SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string? InvoiceNumber { get; set; }
    public DateTime? InvoiceDueAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<WaterOrderLineDto> Lines { get; set; } = new();
}

public sealed class WaterOrderLineDto
{
    public long ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Cases { get; set; }
    public decimal CasePrice { get; set; }
    public decimal LineTotal { get; set; }
}
