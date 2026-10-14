# iLoveSurprises — Frontend Integration Audit (Phase 1)

**Date:** 2026-10-14
**Frontend:** `Ilovesurprises-frontend` @ `b224267` (branch `main`)
**Backend:** `ilovesurprises-backend` (local checkout, same commit family as deployed `https://api.ilovesurprises.com`)
**Baseline build state:** `tsc -b` clean (exit 0) · `oxlint` 22 warnings / 0 errors

---

## 1. Method

- Read every file under `src/services/`, `src/hooks/`, `src/lib/`, `src/pages/`, and the admin/affiliate/auth/checkout component trees.
- Enumerated the **actual** backend contract from `ilovesurprises-backend/src/routes/*.ts`, `src/controllers/*.ts`, `src/services/*.ts`, `src/validation/*.ts`, `src/types/*.ts`, and `prisma/schema.prisma`.
- `docs/FRONTEND_API_CONTRACT.md` **does not exist** in the backend repo (only `README.md`). The contract below is derived from route + controller + validation code, and spot-verified against the live production API.
- Verified live: `GET /health` → `200` (`database: connected`), `GET /api/storefront` → `200`, `GET /api/products?limit=1` → `200`. Response envelope confirmed as `{status, data}`.

---

## 2. Backend contract (ground truth)

### 2.1 Response envelope

```jsonc
// success
{ "status": "success", "message": "...", "data": { /* payload */ } }
// error
{ "status": "error", "error": "ErrorName", "message": "...", "errors": [{ "field": "...", "message": "..." }] }
```

Validation failures → `400` with `errors[]`. Auth failures → `401`. Role failures → `403` `"Forbidden: Insufficient permissions"`.

### 2.2 Session contract

**Bearer JWT in the `Authorization` header.** There is no refresh token, no cookie session, no `/api/auth/refresh`.

- `src/middlewares/auth.middleware.ts` reads `Authorization: Bearer <token>` only; it ignores cookies.
- Token payload: `{ id, email, role }`, signed with `JWT_SECRET`, `expiresIn` default **7d** (`config.jwtExpiresIn`).
- On every authenticated request the middleware re-reads the user from the DB and rejects if `!isActive`.
- `POST /api/auth/logout` is **stateless** — it returns success and does not revoke the token. Client-side discard is the only logout.

Because the backend mandates a Bearer header, the token must be readable by JS. Storing it in `localStorage` is therefore the **backend's approved contract**, not a secure design: it remains XSS-exfiltratable, and no claim of security is made for it anywhere in this integration.

### 2.3 Complete endpoint inventory (51 routes)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health`, `/api/health` | — | `{status, services.database}` |
| POST | `/api/auth/register` | — | `{email,password,firstName?,lastName?}` → `201 {user,token}`; role forced `CUSTOMER` |
| POST | `/api/auth/login` | — | `{email,password}` → `{user,token}`; `401` on bad creds |
| POST | `/api/auth/google` | — | `{idToken\|credential\|accessToken\|email,...}` → `{user,token}` |
| GET | `/api/auth/me` | Bearer | `{data:{user}}` |
| POST | `/api/auth/logout` | Bearer | stateless |
| POST | `/api/auth/forgot-password` | — | always generic message; `resetToken` echoed only when `NODE_ENV!=='production'` |
| POST | `/api/auth/reset-password` | — | `{token,newPassword}` |
| GET | `/api/users/me` | Bearer | profile |
| PATCH | `/api/users/me` | Bearer | `{firstName?,lastName?}` |
| PATCH | `/api/users/me/password` | Bearer | `{currentPassword,newPassword}` |
| GET | `/api/products` | — | `page,limit,search,category,status,minPrice,maxPrice,sortBy,featured` → `{products,pagination}` |
| GET/POST | `/api/products/batch` | — | batch fetch |
| GET | `/api/products/:slugOrId` | — | single product |
| POST | `/api/products/:id/reviews` | — | `{rating:1-5,title?,comment}` |
| GET | `/api/storefront` | — | `{showcaseCards[],banners}` |
| GET | `/api/storefront/showcase` | — | showcase cards |
| GET | `/api/storefront/showcase/:cardKey` | — | one card |
| GET | `/api/storefront/banners` | — | banners |
| GET | `/api/cart` | optional | `x-cart-id` header for guests |
| POST | `/api/cart/items` | optional | `{productId,variantId?,quantity?,selectedRingSize?,selectedScent?,customNote?}` |
| PATCH | `/api/cart/items/:itemId` | optional | |
| DELETE | `/api/cart/items/:itemId` | optional | |
| DELETE | `/api/cart` | optional | clear |
| GET | `/api/affiliates/resolve/:username` | — | referral resolution |
| POST | `/api/affiliates/register` | Bearer | `{username,sponsorCodeOrId?,payoutMethod?,payoutDetails?}` |
| GET | `/api/affiliates/me` | Bearer | `AffiliateDashboardStatsDTO` |
| GET | `/api/affiliates/me/ledger` | Bearer | `page,limit,status(pending\|available\|paid\|hold\|void\|reversed)` |
| GET | `/api/affiliates/me/genealogy` | Bearer | `GenealogyTreeNode` tree |
| GET | `/api/admin/users` | Bearer + **ADMIN** | list/filter users |
| GET | `/api/admin/users/:id` | ADMIN | |
| PATCH | `/api/admin/users/:id` | ADMIN | |
| PATCH | `/api/admin/users/:id/role` | ADMIN | |
| GET | `/api/admin/storefront` | ADMIN | full config incl. inactive |
| PATCH | `/api/admin/storefront/showcase/:cardKey` | ADMIN | |
| PATCH | `/api/admin/storefront/banners` | ADMIN | |
| POST | `/api/admin/products` | ADMIN | |
| PATCH | `/api/admin/products/:id` | ADMIN | |
| DELETE | `/api/admin/products/:id` | ADMIN | |
| GET | `/api/admin/reports/analytics` | ADMIN | `timeframe` ∈ **`7D\|30D\|90D\|YTD`** |
| GET | `/api/admin/analytics` | ADMIN | alias of the above |
| GET | `/api/admin/reports/export` | ADMIN | `type` ∈ `sales\|ledger\|affiliates` |
| GET | `/api/admin/commission/central` | ADMIN | `CommissionCentralSummaryDTO` |
| GET | `/api/admin/commission/ledger` | ADMIN | `search,status,tier,page,limit` |
| POST | `/api/commission/process-order/:orderId` | ADMIN | |
| POST | `/api/commission/refund-order/:orderId` | ADMIN | |
| GET | `/api/commission/orders/:orderId` | ADMIN | |
| GET | `/api/commission/central` | ADMIN | |
| GET | `/api/commission/ledger` | ADMIN | |

### 2.4 Endpoints that DO NOT EXIST (hard blockers)

The Prisma schema defines `orders`, `order_items`, `order_notes`, `order_fulfillments`, `payment_transactions`, `refund_records`, `payout_requests`, `inventory_logs`, `customer_addresses`, `wishlist_items`, `discount_coupons`, `coupon_usages`, `membership_plans`, `user_memberships`, `appraisal_records`, `collections`, `categories`, `product_variants`, `product_options`, `user_notifications` — **but no routes expose any of them.**

There is **no**:
- order creation, order listing, or order detail endpoint (customer or admin)
- checkout endpoint, payment intent / session creation, or payment-status verification endpoint
- payment webhook route
- categories or collections CRUD
- inventory / stock adjustment endpoint
- customer address book endpoint
- wishlist endpoint
- coupon validation endpoint
- membership / subscription endpoint
- payout request endpoint
- appraisal endpoint
- review **listing** endpoint (only `POST` a review)

Consequence: **Phase 9 (payment & checkout) cannot be completed** — there is nothing server-side to create a pending order against or verify a payment with. Per the mission's own rule ("If the backend gateway integration is unavailable, disable live payment submission and show an appropriate configuration/error state"), checkout will be put into a hard-disabled configuration state rather than simulated.

### 2.5 Backend constraints that affect the frontend

1. **Image fields must be absolute URLs.** `createProductSchema` / `updateProductSchema` enforce `z.string().url()` on `imageUrl` and `images[]`; `updateShowcaseCardSchema` enforces `.url()` on `showcaseImageUri`. Relative paths such as `/assets/ilovesurprises/...` are rejected with `400`. The admin image-upload UI must therefore submit absolute URLs.
2. **Analytics timeframe is uppercase** (`7D|30D|90D|YTD`). The frontend currently uses lowercase `'7d'|'30d'|'90d'|'ytd'` internally — a mapping layer is required.
3. **Admin gate is `requireRole(ADMIN)` only.** `STAFF` has no admin access; the frontend's multi-role admin permission matrix has no backend counterpart.
4. **`POST /api/auth/google` accepts a bare `email`** with no token (`GoogleLoginDTO.email`), minting a real session for any claimed address. The frontend must never use that path; it is also a backend-side vulnerability recorded in §5.

---

## 3. Feature-by-feature classification

Legend: **[A]** Fully API connected · **[P]** Partially API connected · **[M]** Using local/mock data · **[X]** Missing backend endpoint · **[B]** Broken integration

### 3.1 Infrastructure

| Feature | Status | Evidence |
|---|---|---|
| `apiClient` base URL resolution | **[B]** | `src/services/apiClient.ts:11-17` — falls back to `https://api.ilovesurprises.com` whenever not on localhost and no env var is set. |
| **localhost → production auto-failover** | **[B] CRITICAL** | `apiClient.ts:196-212` (GET) and `:224-241` (non-GET). On any network error against localhost, `activeBaseUrl` is **permanently reassigned** to production and the request is replayed. This applies to `POST`/`PATCH`/`DELETE`. Verified live: local `:3000` is **down** (`000`), production `/health` is **up** (`200`) — so every dev mutation right now silently writes to the production database. |
| Typed errors | **[P]** | `ApiError` exists with `statusCode`/`data`, but `statusCode: 0` is overloaded for timeout, DNS failure, abort, and CORS alike; there is no distinct timeout/abort class. |
| Timeout / abort | **[P]** | 15s `AbortController` at `apiClient.ts:144-146`, but `options.signal || controller.signal` means a caller-supplied signal **disables the timeout entirely**. |
| Retries | **[M]** | No retry in `apiClient`. TanStack Query `retry: 1` applies to queries only, and `queryClient.ts` sets it globally — mutations are unretried (correct) but GETs get no idempotency-aware backoff in the client itself. |
| 401 handling | **[P]** | `apiClient.ts:160-163` clears the token on 401 but **never dispatches** `ilovesurprises_unauthorized`. `useAuth` (`src/hooks/useAuth.ts:46-50`) and `App.tsx:580-596` both listen for that event, so the session-expiry UI is dead code. |
| 403 handling | **[M]** | No distinct handling; a permission error surfaces as a generic message. |
| GET deduplication | **[A]** | `inFlightGetRequests` map, `apiClient.ts:113`. |
| Secret exposure | **[A]** | Only `VITE_STRIPE_PUBLISHABLE_KEY` and `import.meta.env.DEV` are read. No secrets in client env. |
| Vite dev proxy | **[B]** | `vite.config.ts` proxies `/api` and `/health` to `localhost:3000` correctly, but `.env.example` sets `VITE_API_BASE_URL=http://localhost:3000`, which **bypasses the proxy** and makes the browser issue cross-origin requests instead. |
| TanStack Query adoption | **[P]** | Installed and configured (`src/lib/queryClient.ts`) and used by `useProducts`; **not used** by admin, affiliate, account, checkout, or CMS surfaces. |
| Query cache persistence | **[P]** | Persists the whole query cache to `localStorage` for 24h with `staleTime` 15min and `refetchOnMount: false` — admin product edits stay invisible on the storefront until the buster changes. |

### 3.2 Authentication

| Feature | Status | Evidence |
|---|---|---|
| Email/password login | **[A]** | `customerAuthService.loginWithEmailPassword` → `POST /api/auth/login`, stores token. |
| Register | **[P]** | `POST /api/auth/register` works, but the `representative` role and `repUsername`/`sponsorUsername` are persisted **only** into localStorage via `sponsorService`; the backend never learns of them (`/api/affiliates/register` is never called). |
| Logout | **[A]** | `POST /api/auth/logout` + token/profile clear. |
| `GET /api/auth/me` | **[P]** | Called, but on non-401 failure it returns the cached localStorage profile, and when **no token exists at all** it still returns the stored profile — so a forged profile object survives as a "session". |
| Session restoration | **[B]** | Same root cause: `customerAuthService.getCurrentUser()` trusts `localStorage` over token presence. |
| **Google login** | **[B] CRITICAL** | `customerAuthService.signInWithGoogle()` is a 300ms `setTimeout` that fabricates a hardcoded user — `{id:'demo-google-user', name:'Sarah Jenkins', email:'demo.google@ilovesurprises.com'}` — and writes it as the active session. `POST /api/auth/google` is **never called**. No Google Identity Services script is loaded anywhere (`index.html` has no GSI tag). |
| **Admin login** | **[B] CRITICAL** | `authService.adminLogin()` / `localAdminSignIn()` (`src/services/auth.ts:263-330`) accept **any** email + **any** non-empty password, fabricate `{id:'admin_primary_1', role:'admin'}`, write it to `localStorage`, and return `token:'demo-admin-token'`. No network call. Anyone can become admin. |
| **Admin route guard** | **[B] CRITICAL** | `authService.verifyAdminSession()` (`auth.ts:236-250`) reads the role from `localStorage` only. `App.tsx:594-620` gates `/admin` on that result. Editing one `localStorage` key grants the admin UI. |
| Protected routes | **[P]** | `/account` and `/affiliate` rely on the same `localStorage`-derived user. |
| Role-based navigation | **[P]** | `roleUtils.ts` normalization is sound and never escalates unknown strings to `admin` — but it is fed a client-fabricated role. |
| Forgot / reset password | **[A]** | Both wired to real endpoints. |
| `resendVerification` | **[X]** | Returns a fabricated success message; no endpoint exists. |

### 3.3 Admin panel

| Page / feature | Status | Evidence |
|---|---|---|
| Dashboard overview KPIs | **[M]** | `adminService.getKPIs()` computes revenue/orders by reading `localStorage['ilovesurprises_orders_v1']` (`adminService.ts:298-353`), seeded from `MOCK_ORDERS`. `fetchKPIs()` just re-reads the same localStorage. |
| Recent activity feed | **[M]** | Derived from the same local order blob. |
| Products — list | **[P]** | `fetchCommerceProducts()` hits the API but merges a `localStorage` override blob (`ils_admin_products_override_v1`) on top — **two conflicting sources of truth**. |
| Products — create/update/delete | **[P]** | `POST/PATCH/DELETE /api/admin/products` are called, then the result is **also** mirrored into the localStorage override. |
| Product variants | **[X]** | `product_variants`/`product_options` tables exist; no endpoint. |
| Categories & collections | **[M] / [X]** | `getCollections()` reads `ils_admin_collections_override_v1` + static `src/data/` files. `createCollection`/`updateCollection`/`deleteCollection` are **localStorage-only**; no backend route exists. |
| Inventory | **[X]** | `inventory_logs` table exists; no endpoint. Stock is edited only through the product `stock` field. |
| Customers | **[P]** | `fetchCustomers()` calls `GET /api/admin/users?role=CUSTOMER`, but order counts / lifetime value are computed from local orders. |
| User roles | **[M]** | `getStaffAdmins`/`updateStaffRole` write `ils_admin_staff_override_v1`. `PATCH /api/admin/users/:id/role` is **never called**. |
| Role permission matrix | **[M]** | `ADMIN_ROLES_CONFIG` is a hardcoded client-side matrix persisted to `ils_admin_roles_permissions_v1`; the backend knows only `requireRole(ADMIN)`. |
| Affiliate accounts (admin) | **[M]** | `getRepresentatives()` / approve / reject / suspend all write `ils_admin_representatives_v1`. |
| Orders | **[M] + [X]** | `getCommerceOrders()` reads `localStorage['ilovesurprises_orders_v1']`, falling back to `MOCK_ORDERS`. No admin order endpoint exists. |
| Payment statuses | **[M] + [X]** | Local only. |
| Commission ledger | **[M]** | `getCommissionLedger()` / `updateCommissionStatus` / `batchApproveCommissions` are localStorage-only. `GET /api/admin/commission/ledger` **exists but is never called**. |
| Store settings | **[M] + [X]** | `ils_admin_settings_v1`; no endpoint. |
| Homepage configuration | **[B]** | `cmsService.updateBanners` / `updateShowcaseCard` call the correct PATCH endpoints but **catch the error, write to localStorage, and `return true` regardless** — a failed or 403'd save reports success to the admin. |
| Refunds | **[M] + [X]** | `ils_admin_refunds_v1`. |
| Discounts | **[M] + [X]** | `ils_admin_discounts_v1`. |
| Memberships | **[M] + [X]** | `ils_admin_memberships_v1`. |
| Appraisals | **[M] + [X]** | `ils_jewelry_appraisals_v2`. |
| Loading / empty / error states | **[B]** | `AdminDashboard.tsx:64-82` seeds **all 14 state slices synchronously from localStorage**, then fires 6 un-awaited promises (`:85-107`) with no loading flag, no error capture, and no refetch after mutation. `isLoading` exists but is never driven by data fetching. |

### 3.4 Analytics

| Feature | Status | Evidence |
|---|---|---|
| Entire analytics dashboard | **[M]** | `adminService.getReportsData()` (`adminService.ts:1027-1075`) computes revenue, AOV, and chart series from `localStorage` orders. `GET /api/admin/reports/analytics` — which returns a complete, server-calculated `AnalyticsReportDTO` with KPIs, revenue trajectory, sessions/conversion, commission tier distribution, subscription MRR, and tab counts — is **never called**. |
| Revenue cards / sales charts / AOV | **[M]** | As above. |
| Product & affiliate performance | **[M]** | As above. |
| Date filters | **[B]** | UI uses `'7d'|'30d'|'90d'|'ytd'`; backend requires `7D|30D|90D|YTD`. |
| Growth comparisons | **[M]** | `changePercent` is available server-side but unused. |
| Loading / empty / error / retry | **[M]** | None — data is synchronous from localStorage. |

### 3.5 MLM / affiliate

| Feature | Status | Evidence |
|---|---|---|
| Affiliate profile | **[M]** | `affiliateService` has **0** `apiClient` references; 11 localStorage + 9 mock-data references. `GET /api/affiliates/me` never called. |
| Referral link | **[P]** | Link is generated client-side; `GET /api/affiliates/resolve/:username` never called to validate it. |
| Referral attribution | **[M]** | `attributionService` keeps a "lifetime attribution" registry in `localStorage['ilovesurprises_lifetime_attributions_v1']`. |
| Personal sales / direct referrals | **[M]** | From local order blob. |
| Downline & 5-level genealogy | **[M]** | `sponsorService` + `ilovesurprises_genealogy_tree_v1`. `GET /api/affiliates/me/genealogy` never called. |
| Commission earnings (lifetime/pending/available/paid) | **[M]** | `commissionService.processOrderCommissions()` **calculates 5-level commissions in the browser** and writes them to `localStorage['ilovesurprises_commissions_v1']`. Invoked from `orderService.createOrder()`. |
| Commission transaction history | **[M]** | Local. `GET /api/affiliates/me/ledger` never called. |
| Payout history | **[M] + [X]** | `ilovesurprises_payouts_v1`; `payout_requests` table exists but no endpoint. |
| Qualification rules | **[M]** | `qualificationService` + `ilovesurprises_monthly_qualifications_v1`. |
| Affiliate registration | **[X]→[M]** | `POST /api/affiliates/register` exists but is never called; `sponsorService.registerSponsorRelationship` writes locally instead. |

### 3.6 Products & storefront

| Feature | Status | Evidence |
|---|---|---|
| Product listing | **[A]** | `useProducts` + `GET /api/products` via TanStack Query. |
| Product details by slug/ID | **[A]** | `GET /api/products/:slugOrId` with cache seeding. |
| Gallery / description / price / stock | **[A]** | From the product DTO. |
| Variant selection | **[P]** | Ring size / scent / jewelry type come from flat DTO arrays (`ringSizes`, `scentOptions`, `jewelryTypes`); **no per-variant price or stock** because no variant endpoint exists. Selecting a variant cannot change price or availability. |
| Add to cart | **[A]** | `POST /api/cart/items`. |
| Related products | **[P]** | Derived client-side from the product list. |
| Reviews | **[P]** | `POST /api/products/:id/reviews` exists; display mixes `reviewsSummary` from the DTO with `localStorage['ils_reviews_v1']` and static `src/data/reviews.ts`. No review-listing endpoint. |
| Stale product cache after admin edit | **[B]** | 15-min `staleTime` + `refetchOnMount:false` + 24h `localStorage` persistence means admin edits are not visible to shoppers for up to 15 minutes (or until a hard refresh with a new buster). |
| SEO metadata | **[A]** | `SEOHead` renders from live product data. |
| Homepage showcase / banners | **[P]** | `cmsService.getStorefront()` calls `GET /api/storefront` but falls back to `MOCK_STOREFRONT_CONFIG` and caches into `ils_cms_storefront_v1`, producing two sources of truth. |
| Homepage hero / categories / collections | **[M]** | `src/data/approvedCollectionsData.ts` (4,396 lines), `products.ts` (2,225), `navigationCategories.ts`, `categories.ts` are static. |

### 3.7 Cart, checkout & payments

| Feature | Status | Evidence |
|---|---|---|
| Cart CRUD | **[A]** | `cartService` → all five `/api/cart*` routes, with `x-cart-id` guest header. |
| Guest → user cart merge | **[P]** | `syncLocalCartToServer()` on login/register; no server-side merge endpoint. |
| Cart validation at checkout | **[X]** | No endpoint. |
| Server-calculated totals | **[P]** | `GET /api/cart` returns `subtotal/shipping/discount/total`; `Checkout.tsx` recomputes totals client-side. |
| Coupon / promo validation | **[X]** | `couponService` is static mock data. |
| **Pending order creation** | **[X]** | No order endpoint exists. |
| **Payment initialization** | **[B] CRITICAL** | `paymentService.initiatePayment()` (`src/services/paymentService.ts:170-215`) `await`s a 300ms timer, sets `isPaid = params.paymentMethod !== 'cod'`, invents `transactionId = \`TXN-${random}\``, hardcodes `last4:'4242'` / `cardBrand:'Visa'`, sets `gatewayStatus:'succeeded'` and `paidAt: now`, then persists the order to `localStorage`. **A fully fabricated paid order with zero network activity.** |
| **Payment verification** | **[B] CRITICAL** | `paymentService.verifyPayment()` (`:220-243`) returns `{success:true, verified:true, status:'paid'}` **unconditionally** for any non-empty reference. |
| Client-side commission generation | **[B] CRITICAL** | `orderService.createOrder()` (`:88-199`) writes the order to `localStorage` and then calls `commissionService.processOrderCommissions()` to mint 5-level MLM commission records in the browser. |
| Order history | **[M]** | `orderService.getOrders()` seeds `localStorage` with `MOCK_ORDERS` on first read. |
| Order success UI | **[B]** | `OrderConfirmation.tsx` renders success from the local order blob; reaching the route is treated as proof of payment. |
| Retry / cancellation | **[X]** | No endpoint. |
| Duplicate-submission guard | **[P]** | Local `isSubmitting` only. |
| Raw card details in app state | **[P]** | `CardPaymentDetails` holds cardholder name + `last4`/brand/exp only — **no PAN or CVV** is captured into state. Acceptable, but the card form must be replaced by a provider-hosted element. |
| Payment secrets in client | **[A]** | Only `VITE_STRIPE_PUBLISHABLE_KEY` (publishable, safe). No secret keys present. |

### 3.8 Customer account

| Feature | Status | Evidence |
|---|---|---|
| Profile read/update | **[A]** | `GET`/`PATCH /api/users/me`. |
| Change password | **[A]** | `PATCH /api/users/me/password`. |
| Profile update failure handling | **[B]** | `accountService.updateProfile` catches the API error and **falls through to a local write**, so a rejected update still appears to succeed. |
| Address book | **[M] + [X]** | `ilovesurprises_addresses_v1`, capped at 3. `customer_addresses` table exists; no endpoint. |
| Wishlist | **[M] + [X]** | `ilovesurprises_wishlist_v1`. `wishlist_items` table exists; no endpoint. |
| Order history | **[M]** | Local blob seeded from `MOCK_ORDERS`. |
| Settings / notifications | **[M] + [X]** | `ilovesurprises_settings_v1`, `ils_user_notifications_v1`. |
| Rewards / spin | **[M] + [X]** | `ils_user_rewards_pts`, `ils_claimed_rewards`, `ils_last_spin_date`. |
| Memberships | **[M] + [X]** | `ils_user_membership_v1`. |
| Appraisal submissions | **[M] + [X]** | `ils_customer_appraisal_submissions_v1`. |

---

## 4. localStorage keys holding authoritative business data

These violate the "no authoritative business data in localStorage" rule and are the targets for removal/replacement:

| Key | Holds | Disposition |
|---|---|---|
| `ilovesurprises_orders_v1` | orders, payment status, totals | **Remove** — no backend endpoint; must not fake orders |
| `ilovesurprises_commissions_v1` | browser-computed MLM commissions | **Remove** — server-authoritative via `/api/affiliates/me/ledger` |
| `ilovesurprises_payouts_v1` | payout records | **Remove** — no endpoint |
| `ilovesurprises_genealogy_tree_v1`, `ilovesurprises_sponsor_tree_v1` | downline | **Replace** with `/api/affiliates/me/genealogy` |
| `ilovesurprises_affiliate_stats_v1` | earnings | **Replace** with `/api/affiliates/me` |
| `ilovesurprises_lifetime_attributions_v1` | referral attribution | **Reduce** to a transient referral touch; attribution is server-side |
| `ilovesurprises_monthly_qualifications_v1` | qualification state | **Remove** — no endpoint |
| `ils_admin_products_override_v1` | product overrides | **Remove** — conflicts with API |
| `ils_admin_collections_override_v1` | collections | **Keep, clearly labelled local** — no endpoint |
| `ils_admin_commissions_v1` | admin ledger | **Replace** with `/api/admin/commission/ledger` |
| `ils_admin_representatives_v1` | affiliate accounts | **Replace** with `/api/admin/users` |
| `ils_admin_staff_override_v1`, `ils_admin_roles_permissions_v1`, `ils_admin_current_role_v1` | roles/permissions | **Replace** role with `/api/auth/me`; permissions stay client-side presentation only |
| `ils_cms_storefront_v1` | homepage content | **Remove as a source** — `/api/storefront` is authoritative |
| `ils_admin_settings_v1`, `ils_admin_discounts_v1`, `ils_admin_refunds_v1`, `ils_admin_memberships_v1` | store config | **Keep, labelled local** — no endpoints |
| `ilovesurprises_user_v1` | session profile incl. **role** | **Demote** to a non-authoritative cache gated on token presence |
| `ilovesurprises_jwt_token` | Bearer JWT | **Keep** — mandated by backend contract; documented as not secure |
| `ILOVESURPRISES_QUERY_CACHE_V2` | persisted query cache | **Scope down** — exclude admin/auth/affiliate queries |

---

## 5. Severity-ranked findings

### Critical (security / data integrity)

1. **Admin authentication bypass.** `authService.adminLogin` mints an `admin` session from any email+password with no backend call; `verifyAdminSession` trusts `localStorage`. Full admin UI access for anyone. — `src/services/auth.ts:263-330`, `:236-250`
2. **Production write-through from local dev.** `apiClient` silently re-targets `https://api.ilovesurprises.com` on localhost network failure, for mutations included. Local backend is currently down and production is up, so this is actively firing. — `src/services/apiClient.ts:196-241`
3. **Fabricated payments.** `initiatePayment` invents a successful transaction; `verifyPayment` always returns `paid`. — `src/services/paymentService.ts:170-243`
4. **Fake Google login.** A hardcoded "Sarah Jenkins" demo user becomes a real session. — `src/services/customerAuthService.ts:393-430`
5. **Client-side MLM commission minting.** Browser computes and stores commission ledger entries. — `src/services/orderService.ts:176-196`, `src/services/commissionService.ts`
6. **(Backend)** `POST /api/auth/google` issues a valid JWT for a bare unverified `email`. Requires a backend fix; the frontend will only ever send a real GIS credential. — `backend/src/services/auth.service.ts` `googleLogin`

### High

7. Admin mutations report success on API failure (`cmsService.updateBanners`/`updateShowcaseCard`, `accountService.updateProfile`).
8. `apiClient` 401 never dispatches `ilovesurprises_unauthorized`; all session-expiry UI is dead code.
9. Dual sources of truth: localStorage overrides layered on API results for products, collections, and storefront content.
10. Analytics, affiliate, and commission dashboards ignore existing, working backend endpoints.
11. Caller-supplied `AbortSignal` cancels the 15s timeout.

### Medium

12. Analytics timeframe casing mismatch (`30d` vs `30D`).
13. Query cache (15min stale, 24h persisted, `refetchOnMount:false`) hides admin edits from the storefront.
14. `.env.example` points `VITE_API_BASE_URL` at `localhost:3000`, bypassing the dev proxy.
15. Representative registration data never reaches `/api/affiliates/register`.
16. Admin dashboard has no loading, empty, error, or post-mutation refetch behaviour.
17. Backend rejects relative image paths (`.url()`), which the admin upload UI can produce.

---

## 6. Phase disposition

| Phase | Scope | Expected outcome |
|---|---|---|
| 2 — API client | Remove failover, fix timeout/401/403, typed errors, proxy-first base URL | **Achievable** |
| 3 — Auth | Real admin login, real GIS Google flow, token-gated session restore | **Achievable** |
| 4 — Admin | Products, users/roles, storefront, commission ledger → API; label endpoint-less areas | **Partial** — orders, collections, inventory, settings, refunds, discounts, memberships have no endpoints |
| 5 — Analytics | `GET /api/admin/reports/analytics` → all cards/charts | **Achievable** |
| 6 — MLM | `/api/affiliates/me`, `/me/ledger`, `/me/genealogy`, `/resolve/:username` | **Achievable** (payouts blocked) |
| 7 — Product details | Already strong; fix variant/price integrity, cache staleness, duplicate add-to-cart | **Achievable** (true variants blocked) |
| 8 — Homepage | `/api/storefront` as single source; real PATCH confirmation | **Achievable** |
| 9 — Payments | — | **BLOCKED** — no order/payment endpoints. Live submission will be disabled with a configuration state; simulation removed. |
| 10 — E2E | Verify product, homepage, Google, analytics, MLM flows | **Partial** — order-payment-commission chain unverifiable |
| 11 — Performance | Cache scoping, invalidation, dedup, skeletons | **Achievable** |
| 12 — Validation | tsc, lint, build, API/failure tests, status doc | **Achievable** (no test runner installed — will add targeted integration tests) |

---

## 7. Required backend work (to unblock)

1. `POST /api/orders` (create pending order, server-calculated totals) + `GET /api/orders/me` + `GET /api/orders/:id`.
2. Payment provider init (`POST /api/payments/intent` or hosted-session) + `GET /api/payments/:id/status` + provider webhook.
3. Commission trigger on verified-paid orders (service exists; needs to be driven by a real payment confirmation rather than an admin call).
4. `GET /api/admin/orders` with payment/fulfillment status.
5. Categories & collections CRUD; inventory adjustment endpoint.
6. Customer addresses and wishlist endpoints.
7. Coupon validation endpoint.
8. Payout request endpoints.
9. Product review **listing** endpoint.
10. **Security:** reject `email`-only Google login; require a verified `idToken`/`credential`/`accessToken`.
11. Accept relative image paths (or provide an upload endpoint returning absolute URLs).
