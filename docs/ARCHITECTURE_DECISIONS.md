# Architecture Decision Records (ADRs)

## ADR-001: Clean Layered Architecture Decoupling

### Status
Accepted

### Context
`SuperApp_V2` inherited a monolithic backend architecture where `SuperApp.API` housed all data access, controllers, database models, and business logic. Several controllers grew beyond 1,000 lines (e.g., `AdminController`, `MarketplaceController`, `FoodOrdersController`), creating high maintenance friction, tight coupling, and difficulty in writing isolated unit tests.

### Decision
Extract domain logic and application workflows into four clean .NET 10 project layers:
- `SuperApp.Domain`
- `SuperApp.Application`
- `SuperApp.Infrastructure`
- `SuperApp.Tests`

`SuperApp.API` is retained as the presentation layer and DI composition root. API endpoint paths, query parameters, HTTP status codes, and serialization models remain 100% backward compatible with existing mobile and admin clients.

### Consequences
- **Positive**: Clean separation of concerns, testability of business logic without spinning up database contexts, elimination of code duplication.
- **Negative**: Requires maintaining explicit interfaces and DTO mappings across boundaries.

---

## ADR-002: Dual-Mode Payment & Authentication Strategy

### Status
Accepted

### Context
Development, staging testing, and CI verification require executing full order, ride, and checkout lifecycles without requiring active production credentials or incurring live transaction charges.

### Decision
1. **Payments**: Support dual mode via `PaymentMode: Test` vs `PaymentMode: Live`. In `Test` mode, `MockPaymentService` generates deterministic mock payment signatures and successful payment states. In `Live` mode, `RazorpayPaymentService` performs authentic cryptographic HMAC-SHA256 signature verification.
2. **OTP / SMS**: Support dual mode via `OtpMode: Test` vs `OtpMode: Live`. In `Test` mode, OTP `123456` is universally accepted for any registered phone number, unblocking automated integration tests and QA walkthroughs.

### Consequences
- **Positive**: Seamless local and CI testing without external SMS/payment credentials. Production environments enforce live validation automatically when configured with live keys.

---

## ADR-003: Autonomous Agent Swarm Integration

### Status
Accepted

### Context
Development, quality assurance, code modernization, and continuous delivery require robust multi-agent orchestration to prevent regressions and enforce architectural standards.

### Decision
Integrate `Unified Product` with the `autonomous-engineering-swarm` orchestrator (`D:\Projects\autonomous-engineering-swarm`) using the 18-agent role matrix. All feature additions and refactoring tasks undergo requirement discussion (Business Analyst), R&D review (Thought Engineer), UI/UX planning (UI/UX Design Engineer), implementation (Frontend/Backend Engineers), and verification (Automated Testing & Release Engineers).

### Consequences
- **Positive**: Systematic verification, no undetected broken contracts, structured documentation and zero developer blockers.
