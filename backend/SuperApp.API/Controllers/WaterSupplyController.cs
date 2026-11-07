using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SuperApp.API.Data;
using SuperApp.API.DTOs;
using SuperApp.API.Models;
using SuperApp.API.Services;

namespace SuperApp.API.Controllers;

[ApiController]
[Route("api/water")]
public sealed class WaterSupplyController(AppDbContext db) : ControllerBase
{
    private long? CurrentUserId => long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    [HttpGet("products")]
    [EnableRateLimiting("search-policy")]
    public async Task<ActionResult<ApiResponse<PagedResult<WaterProductDto>>>> Products([FromQuery] string? search, [FromQuery] string? city, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page); pageSize = Math.Clamp(pageSize, 1, 50);
        var query = db.WaterProducts.AsNoTracking().Where(p => p.IsActive && p.AvailableCases >= p.MinimumCases && p.Supplier.Status == WaterSupplierStatuses.Approved);
        if (!string.IsNullOrWhiteSpace(city))
        {
            var requestedCity = city.Trim();
            query = query.Where(p => p.Supplier.DeliveryCities.Contains(requestedCity));
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p => p.Name.Contains(term) || p.Brand.Contains(term) || p.Supplier.BusinessName.Contains(term));
        }
        var count = await query.CountAsync();
        var rows = await query.OrderBy(p => p.Supplier.BusinessName).ThenBy(p => p.Name).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new WaterProductDto
            {
                Id = p.Id, SupplierId = p.SupplierId, SupplierName = p.Supplier.BusinessName, City = p.Supplier.City,
                Brand = p.Brand, Name = p.Name, BottleSize = p.BottleSize, BottlesPerCase = p.BottlesPerCase,
                CasePrice = p.CasePrice, MinimumCases = p.MinimumCases, AvailableCases = p.AvailableCases
            }).ToListAsync();
        return Ok(ApiResponse<PagedResult<WaterProductDto>>.Ok(new PagedResult<WaterProductDto> { Items = rows, TotalCount = count, Page = page, PageSize = pageSize }));
    }

    [Authorize]
    [HttpPost("supplier/application")]
    [EnableRateLimiting("checkout-policy")]
    public async Task<ActionResult<ApiResponse<object>>> Apply([FromBody] WaterSupplierApplicationRequest request)
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<object>.Fail("Authentication required"));
        if (await db.WaterSuppliers.AnyAsync(s => s.UserId == userId)) return Conflict(ApiResponse<object>.Fail("A supplier application already exists for this account"));
        if (!await db.Documents.AnyAsync(d => d.DocumentNo == request.BusinessDocumentNo.Trim() && d.OwnerUserId == userId))
            return BadRequest(ApiResponse<object>.Fail("Business registration document was not uploaded by this account"));
        if (request.MinimumDeliveryValue < 0 || string.IsNullOrWhiteSpace(request.DeliveryCities)) return BadRequest(ApiResponse<object>.Fail("Enter a valid minimum delivery value and at least one delivery city"));
        var supplier = new WaterSupplier
        {
            UserId = userId, BusinessName = request.BusinessName.Trim(), ContactPhone = request.ContactPhone.Trim(),
            Address = request.Address.Trim(), City = request.City.Trim(), DeliveryCities = NormalizeCities(request.DeliveryCities),
            BusinessDocumentNo = request.BusinessDocumentNo.Trim(), MinimumDeliveryValue = request.MinimumDeliveryValue,
            Status = WaterSupplierStatuses.Pending, CreatedAt = DateTime.UtcNow
        };
        db.WaterSuppliers.Add(supplier);
        await db.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { supplier.Id, supplier.Status }, "Supplier application submitted for review"));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("admin/suppliers")]
    public async Task<ActionResult<ApiResponse<List<object>>>> AdminSuppliers([FromQuery] string? status)
    {
        var query = db.WaterSuppliers.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(s => s.Status == status.Trim().ToUpperInvariant());
        var list = await query.OrderByDescending(s => s.CreatedAt).Select(s => new
        { s.Id, s.UserId, s.BusinessName, s.ContactPhone, s.Address, s.City, s.DeliveryCities, s.BusinessDocumentNo,
            BusinessDocumentImageUrl = "/api/documents/" + s.BusinessDocumentNo + "/image", s.Status, s.AdminNotes,
            s.ReviewedByAdminId, s.ReviewedAt, s.CreatedAt }).ToListAsync();
        return Ok(ApiResponse<List<object>>.Ok(list.Cast<object>().ToList()));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPut("admin/suppliers/{id:long}/review")]
    public async Task<ActionResult<ApiResponse>> ReviewSupplier(long id, [FromBody] WaterAdminReviewRequest request)
    {
        var supplier = await db.WaterSuppliers.FirstOrDefaultAsync(s => s.Id == id);
        if (supplier == null) return NotFound(ApiResponse.Fail("Supplier application not found"));
        var status = request.Status.Trim().ToUpperInvariant();
        if (supplier.Status != WaterSupplierStatuses.Pending || status is not (WaterSupplierStatuses.Approved or WaterSupplierStatuses.Rejected))
            return Conflict(ApiResponse.Fail("Only pending applications can be approved or rejected"));
        supplier.Status = status;
        supplier.AdminNotes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        supplier.ReviewedByAdminId = CurrentUserId;
        supplier.ReviewedAt = DateTime.UtcNow;
        supplier.UpdatedAt = DateTime.UtcNow;
        if (status == WaterSupplierStatuses.Approved)
        {
            var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.WaterSupplier);
            if (role == null) return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse.Fail("Water supplier role is not configured"));
            var hasRole = await db.UserRoles.AnyAsync(ur => ur.UserId == supplier.UserId && ur.RoleId == role.Id);
            if (!hasRole) db.UserRoles.Add(new UserRole { UserId = supplier.UserId, RoleId = role.Id, CreatedAt = DateTime.UtcNow });
        }
        await db.SaveChangesAsync();
        return Ok(ApiResponse.Ok($"Supplier {status.ToLowerInvariant()}"));
    }

    [Authorize]
    [HttpGet("supplier/mine")]
    public async Task<ActionResult<ApiResponse<object>>> MySupplier()
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<object>.Fail("Authentication required"));
        var supplier = await db.WaterSuppliers.AsNoTracking().Where(s => s.UserId == userId)
            .Select(s => new { s.Id, s.BusinessName, s.Status, s.City, s.DeliveryCities, s.MinimumDeliveryValue, s.AdminNotes }).FirstOrDefaultAsync();
        return supplier == null ? NotFound(ApiResponse<object>.Fail("No supplier application exists")) : Ok(ApiResponse<object>.Ok(supplier));
    }

    [Authorize]
    [HttpGet("supplier/products")]
    public async Task<ActionResult<ApiResponse<List<WaterProductDto>>>> SupplierProducts()
    {
        var supplier = await GetOwnedSupplierAsync();
        if (supplier == null) return Forbid();
        var rows = await db.WaterProducts.AsNoTracking().Where(p => p.SupplierId == supplier.Id).OrderBy(p => p.Name)
            .Select(p => new WaterProductDto { Id = p.Id, SupplierId = p.SupplierId, SupplierName = supplier.BusinessName,
                City = supplier.City, Brand = p.Brand, Name = p.Name, BottleSize = p.BottleSize, BottlesPerCase = p.BottlesPerCase,
                CasePrice = p.CasePrice, MinimumCases = p.MinimumCases, AvailableCases = p.AvailableCases }).ToListAsync();
        return Ok(ApiResponse<List<WaterProductDto>>.Ok(rows));
    }

    [Authorize]
    [HttpPost("supplier/products")]
    public async Task<ActionResult<ApiResponse<WaterProductDto>>> CreateProduct([FromBody] WaterProductRequest request)
    {
        var supplier = await GetOwnedSupplierAsync();
        if (supplier?.Status != WaterSupplierStatuses.Approved) return Forbid();
        var product = new WaterProduct { SupplierId = supplier.Id, Brand = request.Brand.Trim(), Name = request.Name.Trim(),
            BottleSize = request.BottleSize.Trim(), BottlesPerCase = request.BottlesPerCase, CasePrice = request.CasePrice,
            MinimumCases = request.MinimumCases, AvailableCases = request.AvailableCases, IsActive = request.IsActive, CreatedAt = DateTime.UtcNow };
        db.WaterProducts.Add(product);
        await db.SaveChangesAsync();
        return Ok(ApiResponse<WaterProductDto>.Ok(ToProduct(product, supplier), "Product created"));
    }

    [Authorize]
    [HttpPut("supplier/products/{id:long}")]
    public async Task<ActionResult<ApiResponse<WaterProductDto>>> UpdateProduct(long id, [FromBody] WaterProductRequest request)
    {
        var supplier = await GetOwnedSupplierAsync();
        if (supplier?.Status != WaterSupplierStatuses.Approved) return Forbid();
        var product = await db.WaterProducts.FirstOrDefaultAsync(p => p.Id == id && p.SupplierId == supplier.Id);
        if (product == null) return NotFound(ApiResponse<WaterProductDto>.Fail("Product not found"));
        product.Brand = request.Brand.Trim(); product.Name = request.Name.Trim(); product.BottleSize = request.BottleSize.Trim();
        product.BottlesPerCase = request.BottlesPerCase; product.CasePrice = request.CasePrice; product.MinimumCases = request.MinimumCases;
        product.AvailableCases = request.AvailableCases; product.IsActive = request.IsActive; product.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse<WaterProductDto>.Ok(ToProduct(product, supplier)));
    }

    [Authorize]
    [HttpPost("orders")]
    [EnableRateLimiting("checkout-policy")]
    [ServiceFilter(typeof(IdempotencyActionFilter))]
    public async Task<ActionResult<ApiResponse<WaterOrderDto>>> CreateOrder([FromBody] WaterOrderRequest request)
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<WaterOrderDto>.Fail("Authentication required"));
        if (request.Lines.Count == 0 || request.Lines.Select(l => l.ProductId).Distinct().Count() != request.Lines.Count)
            return BadRequest(ApiResponse<WaterOrderDto>.Fail("Order must contain unique products"));
        var supplier = await db.WaterSuppliers.FirstOrDefaultAsync(s => s.Id == request.SupplierId && s.Status == WaterSupplierStatuses.Approved);
        if (supplier == null) return NotFound(ApiResponse<WaterOrderDto>.Fail("Verified supplier not found"));
        var deliveryCities = supplier.DeliveryCities.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (!deliveryCities.Contains(request.DeliveryCity.Trim(), StringComparer.OrdinalIgnoreCase))
            return BadRequest(ApiResponse<WaterOrderDto>.Fail("Supplier does not serve the selected delivery city"));
        var productIds = request.Lines.Select(l => l.ProductId).ToList();
        var products = await db.WaterProducts.Where(p => productIds.Contains(p.Id) && p.SupplierId == supplier.Id && p.IsActive).ToListAsync();
        if (products.Count != productIds.Count) return BadRequest(ApiResponse<WaterOrderDto>.Fail("One or more products are unavailable"));
        var lines = new List<WaterOrderLine>();
        decimal total = 0;
        foreach (var requested in request.Lines)
        {
            var product = products.Single(p => p.Id == requested.ProductId);
            if (!WaterOrderRules.CanOrderCases(product.MinimumCases, product.AvailableCases, requested.Cases))
                return BadRequest(ApiResponse<WaterOrderDto>.Fail($"Requested cases do not meet the minimum or stock availability for {product.Name}"));
            total += product.CasePrice * requested.Cases;
            lines.Add(new WaterOrderLine { ProductId = product.Id, ProductName = $"{product.Brand} {product.Name} ({product.BottleSize})", Cases = requested.Cases,
                CasePrice = product.CasePrice, LineTotal = product.CasePrice * requested.Cases });
        }
        if (total < supplier.MinimumDeliveryValue) return BadRequest(ApiResponse<WaterOrderDto>.Fail("Order is below the supplier minimum delivery value"));
        foreach (var requested in request.Lines)
        {
            var updated = await db.WaterProducts.Where(p => p.Id == requested.ProductId && p.SupplierId == supplier.Id && p.IsActive && p.AvailableCases >= requested.Cases)
                .ExecuteUpdateAsync(update => update.SetProperty(p => p.AvailableCases, p => p.AvailableCases - requested.Cases));
            if (updated != 1) return Conflict(ApiResponse<WaterOrderDto>.Fail("Inventory changed while placing the order. Refresh and try again."));
        }
        var order = new WaterOrder { OrderNumber = NewOrderNumber(),
            CustomerId = userId, SupplierId = supplier.Id, DeliveryAddress = $"{request.DeliveryAddress.Trim()}, {request.DeliveryCity.Trim()}",
            Status = WaterOrderStatuses.Pending, PaymentStatus = "UNPAID", TotalAmount = total, CreatedAt = DateTime.UtcNow, Lines = lines };
        db.WaterOrders.Add(order);
        await db.SaveChangesAsync();
        await db.Entry(order).Reference(o => o.Supplier).LoadAsync();
        return Ok(ApiResponse<WaterOrderDto>.Ok(ToOrder(order), "Bulk order submitted to supplier"));
    }

    [Authorize]
    [HttpPost("quotes")]
    [EnableRateLimiting("checkout-policy")]
    [ServiceFilter(typeof(IdempotencyActionFilter))]
    public async Task<ActionResult<ApiResponse<WaterQuoteDto>>> RequestQuote([FromBody] WaterQuoteRequest request)
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<WaterQuoteDto>.Fail("Authentication required"));
        if (request.Lines.Count == 0 || request.Lines.Select(l => l.ProductId).Distinct().Count() != request.Lines.Count)
            return BadRequest(ApiResponse<WaterQuoteDto>.Fail("Quote request must contain unique products"));
        var supplier = await db.WaterSuppliers.FirstOrDefaultAsync(s => s.Id == request.SupplierId && s.Status == WaterSupplierStatuses.Approved);
        if (supplier == null) return NotFound(ApiResponse<WaterQuoteDto>.Fail("Verified supplier not found"));
        if (!supplier.DeliveryCities.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Contains(request.DeliveryCity.Trim(), StringComparer.OrdinalIgnoreCase))
            return BadRequest(ApiResponse<WaterQuoteDto>.Fail("Supplier does not serve the selected delivery city"));
        var ids = request.Lines.Select(l => l.ProductId).ToList();
        var products = await db.WaterProducts.Where(p => ids.Contains(p.Id) && p.SupplierId == supplier.Id && p.IsActive).ToListAsync();
        if (products.Count != ids.Count) return BadRequest(ApiResponse<WaterQuoteDto>.Fail("One or more products are unavailable"));
        var quote = new WaterQuote
        {
            CustomerId = userId, SupplierId = supplier.Id, DeliveryAddress = request.DeliveryAddress.Trim(), DeliveryCity = request.DeliveryCity.Trim(),
            Status = WaterQuoteStatuses.Requested, BuyerNotes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(), CreatedAt = DateTime.UtcNow,
            Lines = request.Lines.Select(line =>
            {
                var product = products.Single(p => p.Id == line.ProductId);
                return new WaterQuoteLine { ProductId = product.Id, ProductName = $"{product.Brand} {product.Name} ({product.BottleSize})", Cases = line.Cases };
            }).ToList()
        };
        db.WaterQuotes.Add(quote);
        await db.SaveChangesAsync();
        quote.Supplier = supplier;
        return Ok(ApiResponse<WaterQuoteDto>.Ok(ToQuote(quote), "Quote request sent to supplier"));
    }

    [Authorize]
    [HttpGet("quotes/mine")]
    public async Task<ActionResult<ApiResponse<List<WaterQuoteDto>>>> MyQuotes()
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<List<WaterQuoteDto>>.Fail("Authentication required"));
        var quotes = await db.WaterQuotes.AsNoTracking().Include(q => q.Supplier).Include(q => q.Lines).Where(q => q.CustomerId == userId).OrderByDescending(q => q.CreatedAt).Take(100).ToListAsync();
        return Ok(ApiResponse<List<WaterQuoteDto>>.Ok(quotes.Select(ToQuote).ToList()));
    }

    [Authorize]
    [HttpGet("supplier/quotes")]
    public async Task<ActionResult<ApiResponse<List<WaterQuoteDto>>>> SupplierQuotes()
    {
        var supplier = await GetOwnedSupplierAsync();
        if (supplier?.Status != WaterSupplierStatuses.Approved) return Forbid();
        var quotes = await db.WaterQuotes.AsNoTracking().Include(q => q.Supplier).Include(q => q.Lines).Where(q => q.SupplierId == supplier.Id).OrderByDescending(q => q.CreatedAt).Take(100).ToListAsync();
        return Ok(ApiResponse<List<WaterQuoteDto>>.Ok(quotes.Select(ToQuote).ToList()));
    }

    [Authorize]
    [HttpPut("supplier/quotes/{id:long}/offer")]
    [ServiceFilter(typeof(IdempotencyActionFilter))]
    public async Task<ActionResult<ApiResponse<WaterQuoteDto>>> OfferQuote(long id, [FromBody] WaterQuoteOfferRequest request)
    {
        var supplier = await GetOwnedSupplierAsync();
        if (supplier?.Status != WaterSupplierStatuses.Approved) return Forbid();
        var quote = await db.WaterQuotes.Include(q => q.Supplier).Include(q => q.Lines).FirstOrDefaultAsync(q => q.Id == id && q.SupplierId == supplier.Id);
        if (quote == null) return NotFound(ApiResponse<WaterQuoteDto>.Fail("Quote request not found"));
        if (quote.Status != WaterQuoteStatuses.Requested) return Conflict(ApiResponse<WaterQuoteDto>.Fail("Quote request is already closed"));
        var offeredIds = request.Lines.Select(l => l.ProductId).ToHashSet();
        if (offeredIds.Count != quote.Lines.Count || quote.Lines.Any(line => !offeredIds.Contains(line.ProductId)))
            return BadRequest(ApiResponse<WaterQuoteDto>.Fail("Provide a price for every requested product"));
        foreach (var line in quote.Lines)
            line.OfferedCasePrice = request.Lines.Single(offer => offer.ProductId == line.ProductId).CasePrice;
        quote.SupplierNotes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        quote.Status = WaterQuoteStatuses.Quoted; quote.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ApiResponse<WaterQuoteDto>.Ok(ToQuote(quote)));
    }

    [Authorize]
    [HttpPost("quotes/{id:long}/accept")]
    [EnableRateLimiting("checkout-policy")]
    [ServiceFilter(typeof(IdempotencyActionFilter))]
    public async Task<ActionResult<ApiResponse<WaterOrderDto>>> AcceptQuote(long id)
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<WaterOrderDto>.Fail("Authentication required"));
        var quote = await db.WaterQuotes.Include(q => q.Supplier).Include(q => q.Lines).FirstOrDefaultAsync(q => q.Id == id && q.CustomerId == userId);
        if (quote == null) return NotFound(ApiResponse<WaterOrderDto>.Fail("Quote not found"));
        if (quote.Status != WaterQuoteStatuses.Quoted || quote.Lines.Any(line => line.OfferedCasePrice is null))
            return Conflict(ApiResponse<WaterOrderDto>.Fail("This quote has no active supplier offer"));
        if (quote.Supplier.Status != WaterSupplierStatuses.Approved) return Conflict(ApiResponse<WaterOrderDto>.Fail("Supplier is no longer available"));
        var products = await db.WaterProducts.Where(p => quote.Lines.Select(line => line.ProductId).Contains(p.Id) && p.SupplierId == quote.SupplierId && p.IsActive).ToListAsync();
        if (products.Count != quote.Lines.Count) return Conflict(ApiResponse<WaterOrderDto>.Fail("A quoted product is no longer available"));
        foreach (var line in quote.Lines)
        {
            var product = products.Single(p => p.Id == line.ProductId);
            if (!WaterOrderRules.CanOrderCases(product.MinimumCases, product.AvailableCases, line.Cases))
                return Conflict(ApiResponse<WaterOrderDto>.Fail($"Minimum quantity or stock changed for {product.Name}"));
        }
        var quoteTotal = quote.Lines.Sum(line => line.OfferedCasePrice!.Value * line.Cases);
        if (quoteTotal < quote.Supplier.MinimumDeliveryValue)
            return Conflict(ApiResponse<WaterOrderDto>.Fail("The quoted order is below the supplier's minimum delivery value"));
        var orderLines = quote.Lines.Select(line => new WaterOrderLine
        {
            ProductId = line.ProductId, ProductName = line.ProductName, Cases = line.Cases,
            CasePrice = line.OfferedCasePrice!.Value, LineTotal = line.OfferedCasePrice.Value * line.Cases
        }).ToList();
        var order = new WaterOrder
        {
            OrderNumber = NewOrderNumber(), CustomerId = userId, SupplierId = quote.SupplierId,
            DeliveryAddress = $"{quote.DeliveryAddress}, {quote.DeliveryCity}", Status = WaterOrderStatuses.Pending,
            PaymentStatus = "UNPAID", TotalAmount = quoteTotal, CreatedAt = DateTime.UtcNow, Lines = orderLines
        };
        foreach (var line in quote.Lines)
        {
            var changed = await db.WaterProducts.Where(p => p.Id == line.ProductId && p.SupplierId == quote.SupplierId && p.IsActive && p.AvailableCases >= line.Cases)
                .ExecuteUpdateAsync(update => update.SetProperty(p => p.AvailableCases, p => p.AvailableCases - line.Cases));
            if (changed != 1) return Conflict(ApiResponse<WaterOrderDto>.Fail("Inventory changed while accepting the quote. Refresh and try again."));
        }
        db.WaterOrders.Add(order);
        await db.SaveChangesAsync();
        var changedQuote = await db.WaterQuotes.Where(q => q.Id == quote.Id && q.CustomerId == userId && q.Status == WaterQuoteStatuses.Quoted)
            .ExecuteUpdateAsync(update => update.SetProperty(q => q.Status, WaterQuoteStatuses.Accepted).SetProperty(q => q.ResultOrderId, order.Id).SetProperty(q => q.UpdatedAt, DateTime.UtcNow));
        if (changedQuote != 1) return Conflict(ApiResponse<WaterOrderDto>.Fail("Quote was accepted by another request"));
        order.Supplier = quote.Supplier;
        return Ok(ApiResponse<WaterOrderDto>.Ok(ToOrder(order), "Quoted bulk order submitted"));
    }

    [Authorize]
    [HttpGet("orders/mine")]
    public async Task<ActionResult<ApiResponse<List<WaterOrderDto>>>> MyOrders()
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse<List<WaterOrderDto>>.Fail("Authentication required"));
        var orders = await db.WaterOrders.AsNoTracking().Include(o => o.Supplier).Include(o => o.Lines).Where(o => o.CustomerId == userId).OrderByDescending(o => o.CreatedAt).Take(100).ToListAsync();
        return Ok(ApiResponse<List<WaterOrderDto>>.Ok(orders.Select(ToOrder).ToList()));
    }

    [Authorize]
    [HttpGet("supplier/orders")]
    public async Task<ActionResult<ApiResponse<List<WaterOrderDto>>>> SupplierOrders()
    {
        var supplier = await GetOwnedSupplierAsync();
        if (supplier?.Status != WaterSupplierStatuses.Approved) return Forbid();
        var orders = await db.WaterOrders.AsNoTracking().Include(o => o.Supplier).Include(o => o.Lines).Where(o => o.SupplierId == supplier.Id).OrderByDescending(o => o.CreatedAt).Take(100).ToListAsync();
        return Ok(ApiResponse<List<WaterOrderDto>>.Ok(orders.Select(ToOrder).ToList()));
    }

    [Authorize]
    [HttpPut("supplier/orders/{id:long}/status")]
    [ServiceFilter(typeof(IdempotencyActionFilter))]
    public async Task<ActionResult<ApiResponse<WaterOrderDto>>> UpdateOrderStatus(long id, [FromBody] WaterOrderStatusRequest request)
    {
        var supplier = await GetOwnedSupplierAsync();
        if (supplier?.Status != WaterSupplierStatuses.Approved) return Forbid();
        var order = await db.WaterOrders.Include(o => o.Supplier).Include(o => o.Lines).FirstOrDefaultAsync(o => o.Id == id && o.SupplierId == supplier.Id);
        if (order == null) return NotFound(ApiResponse<WaterOrderDto>.Fail("Order not found"));
        var status = request.Status.Trim().ToUpperInvariant();
        var allowed = (order.Status, status) is
            (WaterOrderStatuses.Pending, WaterOrderStatuses.Accepted) or (WaterOrderStatuses.Pending, WaterOrderStatuses.Rejected) or
            (WaterOrderStatuses.Accepted, WaterOrderStatuses.Preparing) or (WaterOrderStatuses.Preparing, WaterOrderStatuses.Dispatched) or
            (WaterOrderStatuses.Dispatched, WaterOrderStatuses.Delivered);
        if (!allowed) return Conflict(ApiResponse<WaterOrderDto>.Fail("Invalid order status transition"));
        var updated = await db.WaterOrders.Where(o => o.Id == id && o.SupplierId == supplier.Id && o.Status == order.Status)
            .ExecuteUpdateAsync(update => update.SetProperty(o => o.Status, status).SetProperty(o => o.UpdatedAt, DateTime.UtcNow));
        if (updated != 1) return Conflict(ApiResponse<WaterOrderDto>.Fail("Order changed concurrently; refresh before updating"));
        order.Status = status; order.UpdatedAt = DateTime.UtcNow;
        if (status == WaterOrderStatuses.Rejected)
        {
            foreach (var line in order.Lines)
                await db.WaterProducts.Where(p => p.Id == line.ProductId).ExecuteUpdateAsync(update => update.SetProperty(p => p.AvailableCases, p => p.AvailableCases + line.Cases));
        }
        if (status == WaterOrderStatuses.Accepted)
        {
            order.InvoiceNumber = $"{order.OrderNumber}-INV";
            db.WaterInvoices.Add(new WaterInvoice { OrderId = order.Id, InvoiceNumber = order.InvoiceNumber, Amount = order.TotalAmount, Status = "UNPAID", IssuedAt = DateTime.UtcNow });
        }
        await db.SaveChangesAsync();
        return Ok(ApiResponse<WaterOrderDto>.Ok(ToOrder(order)));
    }

    [Authorize]
    [HttpPost("orders/{id:long}/cancel")]
    [EnableRateLimiting("checkout-policy")]
    [ServiceFilter(typeof(IdempotencyActionFilter))]
    public async Task<ActionResult<ApiResponse>> CancelOrder(long id)
    {
        if (CurrentUserId is not long userId) return Unauthorized(ApiResponse.Fail("Authentication required"));
        var order = await db.WaterOrders.Include(o => o.Lines).FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == userId);
        if (order == null) return NotFound(ApiResponse.Fail("Order not found"));
        if (order.Status != WaterOrderStatuses.Pending) return Conflict(ApiResponse.Fail("Only pending orders can be cancelled"));
        var cancelled = await db.WaterOrders.Where(o => o.Id == id && o.CustomerId == userId && o.Status == WaterOrderStatuses.Pending)
            .ExecuteUpdateAsync(update => update.SetProperty(o => o.Status, WaterOrderStatuses.Cancelled).SetProperty(o => o.UpdatedAt, DateTime.UtcNow));
        if (cancelled != 1) return Conflict(ApiResponse.Fail("Order changed concurrently; refresh before cancelling"));
        foreach (var line in order.Lines)
            await db.WaterProducts.Where(p => p.Id == line.ProductId).ExecuteUpdateAsync(update => update.SetProperty(p => p.AvailableCases, p => p.AvailableCases + line.Cases));
        return Ok(ApiResponse.Ok("Order cancelled and stock restored"));
    }

    private async Task<WaterSupplier?> GetOwnedSupplierAsync() => CurrentUserId is long id ? await db.WaterSuppliers.FirstOrDefaultAsync(s => s.UserId == id) : null;

    private static string NormalizeCities(string value) => string.Join(',', value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Distinct(StringComparer.OrdinalIgnoreCase));

    private static string NewOrderNumber() => $"WS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..30].ToUpperInvariant();

    private static WaterProductDto ToProduct(WaterProduct p, WaterSupplier s) => new() { Id = p.Id, SupplierId = s.Id, SupplierName = s.BusinessName, City = s.City, Brand = p.Brand, Name = p.Name, BottleSize = p.BottleSize, BottlesPerCase = p.BottlesPerCase, CasePrice = p.CasePrice, MinimumCases = p.MinimumCases, AvailableCases = p.AvailableCases };

    private static WaterOrderDto ToOrder(WaterOrder o) => new() { Id = o.Id, OrderNumber = o.OrderNumber, SupplierId = o.SupplierId, SupplierName = o.Supplier?.BusinessName ?? "", DeliveryAddress = o.DeliveryAddress, Status = o.Status, PaymentStatus = o.PaymentStatus, TotalAmount = o.TotalAmount, InvoiceNumber = o.InvoiceNumber, InvoiceDueAt = o.InvoiceDueAt, CreatedAt = o.CreatedAt, Lines = o.Lines.Select(l => new WaterOrderLineDto { ProductId = l.ProductId, ProductName = l.ProductName, Cases = l.Cases, CasePrice = l.CasePrice, LineTotal = l.LineTotal }).ToList() };

    private static WaterQuoteDto ToQuote(WaterQuote q) => new() { Id = q.Id, SupplierName = q.Supplier?.BusinessName ?? "", DeliveryAddress = q.DeliveryAddress, DeliveryCity = q.DeliveryCity, Status = q.Status, BuyerNotes = q.BuyerNotes, SupplierNotes = q.SupplierNotes, CreatedAt = q.CreatedAt, Lines = q.Lines.Select(line => new WaterQuoteLineDto { ProductId = line.ProductId, ProductName = line.ProductName, Cases = line.Cases, OfferedCasePrice = line.OfferedCasePrice }).ToList() };
}
