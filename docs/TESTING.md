# Testing Strategy & Test Matrix: Unified Product

## 1. Testing Philosophy & Standards

To ensure regression-free feature development and complete parity with `SuperApp_V2`, `Unified Product` establishes a rigorous multi-tier testing pyramid:

1. **Unit Testing (Domain & Business Logic)**:
   - Tests pure domain logic, status transitions, coupon calculation rules, and fare engines in isolation without external dependencies.
2. **Application Service Testing**:
   - Tests orchestrator services with mocked data repositories and external service adapters.
3. **API Contract & Integration Testing**:
   - Tests controller endpoints, parameter validation, HTTP response statuses, and serialization schemas.
4. **End-to-End User Journey Walkthroughs**:
   - Validates user flows (Registration -> Food Order -> Checkout -> Ride Booking -> Seller Fulfillment).

---

## 2. Test Suites in `SuperApp.Tests`

| Test Category | Target Component | Scenarios Tested |
|---|---|---|
| **Fare Estimation Tests** | `RideFareEngine` | Bike, Auto, Cab calculations; minimum base fare; night surge multipliers |
| **Coupon Calculation Tests** | `CouponEngine` | Percentage discount, flat discount, minimum cart value thresholds, maximum discount caps |
| **Auth & Dual-Mode Tests** | `TokenService`, `IOtpService` | JWT token generation, claim validation, test OTP `123456` verification, token refresh |
| **Food Order Lifecycle Tests** | `FoodOrder` state machine | Valid transitions (`Placed` -> `Accepted` -> `Ready` -> `Delivered`); illegal transitions (`Delivered` -> `Cancelled`) |
| **Payment Verification Tests** | `IPaymentService` | Dual-mode signature verification (Test mode vs Razorpay HMAC SHA256 live) |
| **Role Applications Tests** | `RoleApplicationService` | Driver & Vendor application submissions, approval and rejection flows |

---

## 3. Running Automated Tests

### Backend Tests (.NET 10)
```powershell
cd backend
dotnet test SuperApp.sln
```

### Typecheck & Frontend Validation
```powershell
# From project root
npx tsc --noEmit
```

### Continuous Integration (CI)
Automated on every push and pull request via `.github/workflows/ci.yml`.
