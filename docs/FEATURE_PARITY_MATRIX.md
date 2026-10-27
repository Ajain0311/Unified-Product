# Feature Parity Matrix: Unified Product vs SuperApp_V2

This matrix inventories every feature, subsystem, API, and workflow inherited from `SuperApp_V2` (Base commit: `37a5d6a`), tracking verification and operational status in `Unified Product`.

## Invariance & Quality Policy
1. **Zero Functionality Removal**: No existing capability is replaced by mock substitutes or stripped away.
2. **Contract Invariance**: API endpoints, status codes, query strings, and payloads remain strictly backward compatible.
3. **Layered Decoupling**: Business logic is transitioned into `SuperApp.Domain` and `SuperApp.Application` with clean abstraction while `SuperApp.API` controllers remain stable contract endpoints.

---

## 1. Authentication & Identity Subsystem

| Feature | Source Behavior | Existing Implementation | Required Action | Verification | Status |
|---|---|---|---|---|---|
| **User Registration / Sign Up** | Phone number based registration with Name, Email, Role selection | `AuthController.Register` (`POST /api/auth/register`) | Preserve endpoint contract; extract validation to `SuperApp.Application` | Automated unit tests in `SuperApp.Tests`; manual register verification | VERIFIED |
| **User Login (Dual Mode)** | Phone login with configurable OTP modes (Live SMS via BigB/2Factor or Test OTP `123456`) | `AuthController.Login`, `IOtpService`, `BigBOtpService`, `MockOtpService` | Preserve dual-mode test/live OTP flags; maintain JWT claims | Integration test `AuthFlowTests.cs` verifying test/live modes | VERIFIED |
| **Verify OTP & JWT Generation** | Verifies OTP code, generates JWT token with UserId, Phone, Role claims | `AuthController.VerifyOtp`, `TokenService` | Keep JWT expiration, HMAC SHA256 signature, and role claims identical | Token generation test in `SuperApp.Tests` | VERIFIED |
| **Token Refresh** | Refresh JWT token using valid refresh token | `AuthController.RefreshToken` | Preserve token refresh lifecycle | Unit test `VerifyRefreshToken` | VERIFIED |
| **Role Applications** | User applies to become Driver or Seller/Vendor; admin reviews | `RoleApplicationsController.cs`, `RoleApplicationService.cs` | Maintain status flow (`Pending`, `Approved`, `Rejected`) | Controller contract & DB check | VERIFIED |
| **User Profile Management** | View & update user name, email, avatar, emergency contacts | `AuthController.GetProfile`, `UpdateProfile` | Maintain schema and validation | Profile update integration test | VERIFIED |

---

## 2. Food Ordering & Restaurant Workflows

| Feature | Source Behavior | Existing Implementation | Required Action | Verification | Status |
|---|---|---|---|---|---|
| **Restaurant Browsing & Search** | List active restaurants, filter by cuisine, rating, search query, location | `RestaurantsController.cs` (`GET /api/restaurants`) | Preserve search filters, geo-distance calculation, pagination | Query tests with geo distance | VERIFIED |
| **Menu & Item Categories** | Retrieve restaurant menu categories, items, dietary tags (Veg/Non-veg), addon groups | `RestaurantsController.GetMenu` | Ensure nested category and addon structures remain invariant | Serialization & schema tests | VERIFIED |
| **Cart & Coupon Application** | Cart validation, minimum order validation, dynamic coupon application | `CouponsController.cs`, `CouponEngine.cs` | Keep percentage, flat discount, max discount, expiry logic intact | `CouponEngineTests.cs` (discount caps & min order) | VERIFIED |
| **Order Placement & State Machine** | Create order (`Placed` -> `Accepted` -> `Preparing` -> `ReadyForPickup` -> `OutForDelivery` -> `Delivered` / `Cancelled`) | `FoodOrdersController.cs`, `FoodOrderCancellation.cs` | Extract state transitions to `SuperApp.Domain.Entities.FoodOrder` | Status transition unit tests in `SuperApp.Tests` | VERIFIED |
| **Realtime Order Tracking** | Live updates sent to customer, vendor, and delivery driver | `OrderTrackingHub.cs` (SignalR) | Retain hub group subscription (`JoinOrderGroup`, `OrderStatusChanged`) | SignalR hub invocation contract tests | VERIFIED |
| **Vendor Order Management** | Vendor accepts, rejects, updates prep time, marks ready | `VendorController.cs`, `FoodOrdersController.cs` | Maintain vendor authorization checks and status update actions | Vendor role integration tests | VERIFIED |
| **Food Delivery Driver Assignment** | Captain accepts food delivery, tracks pickup, delivers with OTP | `DriverController.cs`, `FoodOrdersController.cs` | Maintain driver pickup OTP and completion workflows | Driver lifecycle test suite | VERIFIED |

---

## 3. Ride Booking & Captain Workflows

| Feature | Source Behavior | Existing Implementation | Required Action | Verification | Status |
|---|---|---|---|---|---|
| **Fare Estimation Engine** | Calculate ride fare based on distance, duration, vehicle type (Bike, Auto, Cab), surge pricing | `RideFareEngine.cs`, `RidesController.EstimateFare` | Preserve base fare, per km rate, night surge multipliers | `RideFareEngineTests.cs` covering all vehicle types | VERIFIED |
| **Ride Request & Matching** | Customer requests ride; broadcast to nearby active drivers | `RidesController.RequestRide`, `RideTrackingHub.cs` | Preserve radius search and geospatial filtering | Radius matching unit tests | VERIFIED |
| **Captain Ride Accept / Decline** | Driver receives ride prompt, accepts ride, triggers ETA update | `RidesController.AcceptRide`, `DriverController.cs` | Preserve atomic ride assignment to prevent race conditions | Concurrency & assignment tests | VERIFIED |
| **Ride Lifecycle & OTP Verification** | Driver arrives (`Arrived`), starts ride with customer OTP (`InProgress`), completes ride (`Completed`) | `RidesController.StartRide`, `CompleteRide`, `RideCompletion.cs` | Retain 4-digit start OTP validation and distance calculation | Ride lifecycle state machine tests | VERIFIED |
| **Live GPS Ride Tracking** | Realtime captain location streaming via SignalR | `RideTrackingHub.cs` (`UpdateLocation`, `LocationUpdate`) | Maintain GPS coordinate precision and client broadcast | Hub connection and message test | VERIFIED |
| **Ride Expiry & Auto-Cancellation** | Background worker expires unaccepted rides after configured timeout | `RideExpiryBackgroundService.cs`, `RideExpiryService.cs` | Keep HostedService active in DI container | Background worker lifecycle check | VERIFIED |

---

## 4. Marketplace & Seller Commerce

| Feature | Source Behavior | Existing Implementation | Required Action | Verification | Status |
|---|---|---|---|---|---|
| **Seller Storefront & Products** | Sellers list products with images, price, stock, variants, category | `MarketplaceController.cs` | Preserve product catalog, pagination, search, category filters | Catalog query test | VERIFIED |
| **Customer Marketplace Orders** | Add to marketplace cart, checkout, seller notifications | `MarketplaceController.CreateOrder` | Keep order numbering and seller item separation | Checkout test with multi-item orders | VERIFIED |
| **Buyer-Seller Realtime Chat** | Direct messaging between buyer and seller regarding items | `ChatHub.cs` (SignalR), `MarketplaceController.cs` | Preserve chat history persistence and realtime delivery | SignalR ChatHub message tests | VERIFIED |
| **Seller Order Fulfillment** | Seller updates order status (`Processing`, `Shipped`, `Delivered`, `Cancelled`) | `MarketplaceController.UpdateOrderStatus` | Retain status transitions and stock decrements | Order fulfillment tests | VERIFIED |

---

## 5. Payments & Dual-Mode Transactions

| Feature | Source Behavior | Existing Implementation | Required Action | Verification | Status |
|---|---|---|---|---|---|
| **Razorpay Payment Gateway** | Order creation, Razorpay order ID, webhook signature verification | `PaymentsController.cs`, `RazorpayPaymentService.cs` | Maintain HMAC SHA256 signature verification and order creation | Signature verification unit tests | VERIFIED |
| **Dual Mode (Test vs Live)** | In test mode, simulates immediate success without charging real money | `PaymentsController.cs`, `MockPaymentService.cs`, `IPaymentService.cs` | Retain environment flag `PaymentMode: Test` vs `Live` | Mock & Live payment service tests | VERIFIED |
| **Cash on Delivery (COD)** | Supports COD for Food, Marketplace, and Rides | `FoodOrdersController.cs`, `PaymentsController.cs` | Preserve COD ledger entries and balance tracking | COD order placement verification | VERIFIED |
| **Hotel Commission Ledger** | Records hotel/vendor commission splits and driver payouts | `HotelCommissionLedgerService.cs` | Preserve debit/credit ledger calculations | Commission split calculation test | VERIFIED |

---

## 6. Administration & Operational Control

| Feature | Source Behavior | Existing Implementation | Required Action | Verification | Status |
|---|---|---|---|---|---|
| **Admin Analytics Dashboard** | Metrics: GMV, total rides, total food orders, active drivers, revenue | `AdminController.GetDashboardMetrics` | Preserve SQL aggregation performance and response format | Dashboard metrics query tests | VERIFIED |
| **User & Role Management** | List, filter, suspend, activate users; assign admin, vendor, driver roles | `AdminController.cs` | Preserve authorization guards (`[Authorize(Roles = "Admin")]`) | Role guard unit tests | VERIFIED |
| **Driver & Vendor KYC Verification**| Admin reviews documents, vehicle papers, licenses, approves/rejects | `AdminController.VerifyDriver`, `DocumentsController.cs` | Retain document status enum and storage URLs | Document verification test | VERIFIED |
| **Banners, Promos & Announcement**| Manage homepage banners, active promotions, carousel ordering | `BannersController.cs` | Retain banner ordering, target URLs, expiration dates | Banners CRUD test | VERIFIED |
| **Global System Config** | App settings, feature flags, maintenance mode, support numbers | `ConfigController.cs`, `SupportSettings.cs` | Retain runtime configuration endpoints | Config schema tests | VERIFIED |

---

## 7. Cross-Cutting Systems & Mobile UI/UX

| Feature | Source Behavior | Existing Implementation | Required Action | Verification | Status |
|---|---|---|---|---|---|
| **Push Notifications** | Push notifications scheduled and dispatched for order and ride events | `PushNotificationSchedulerService.cs`, `PushNotificationDispatcherService.cs` | Maintain token store and background dispatch | Notification queue test | VERIFIED |
| **Media & Image Storage** | Local storage fallback or Azure Blob Storage for avatars, menus, KYC | `LocalStorageService.cs`, `AzureBlobStorageService.cs`, `ImageByteProcessor.cs` | Preserve multi-provider interface `IStorageService` | File upload and retrieval tests | VERIFIED |
| **Mobile UI Navigation & 5-State**| React Native / Expo application with Google clarity + Rapido speed | `src/features/*`, `src/components/*`, `src/navigation/*` | Verify 5-state matrix (Loading, Empty, Error, Success, Denied) | UI component audit and tsc validation | VERIFIED |
| **CI/CD & Mobile APK Automation** | GitHub Actions build solution, run tests, build Android APK | `.github/workflows/ci.yml`, `build-apk.yml`, `deploy.yml` | Update CI to run `dotnet test` and full solution build | GitHub Actions workflow execution | VERIFIED |

---

## 8. Autonomous Agent Governance

| Integration Aspect | Description | Unified Product Implementation | Status |
|---|---|---|---|
| **Autonomous Swarm Link** | Governed by Autonomous Engineering Swarm (`D:\Projects\autonomous-engineering-swarm`) | Project registered as `proj-unified-product` with 18-agent governance | CONFIGURED |
| **Global Antigravity Skill** | Executed using skill `autonomous-engineering-swarm` | Active in `.gemini/config/skills/autonomous-engineering-swarm` | ACTIVE |
