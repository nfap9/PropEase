# Codebase Concerns

**Analysis Date:** 2026-03-19

## Tech Debt

### God Route Files (Unmaintainably Large)

The API route files have grown to unmanageable sizes. Each endpoint handler is wrapped in a try/catch block, making these files extremely long and difficult to navigate.

**Files at risk:**
- `api/src/routes/v1/apartments.ts` - 1,136 lines, 22+ try/catch blocks
- `api/src/routes/v1/organizations.ts` - 782 lines
- `api/src/routes/v1/subscriptions.ts` - 614 lines
- `api/src/routes/v1/bills.ts` - 639 lines
- `api/src/routes/v1/fee-types.ts` - 469 lines
- `api/src/routes/v1/admin/index.ts` - 469 lines, 31+ try/catch blocks

**Impact:** Adding features, fixing bugs, or understanding existing behavior requires scrolling through thousands of lines of near-identical try/catch boilerplate.

**Fix approach:** Extract each resource into its own file under a `controllers/` directory. Each controller handles one resource (e.g., `apartments.controller.ts`). Keep routes in `routes/v1/` as thin routing definitions that delegate to controllers.

### God Service Files

Similar oversized file issues in services:
- `api/src/services/tenantReachability.service.ts` - 633 lines
- `api/src/services/admin.service.ts` - 665 lines
- `api/src/services/service-product.service.ts` - 541 lines
- `api/src/services/utility.service.ts` - 598 lines
- `api/src/repositories/service-product.repo.ts` - 611 lines

**Fix approach:** Split by domain boundary (e.g., separate notification templates from delivery tracking in tenantReachability).

### Mobile App: Stale Mock Data

**File:** `mobile/app/settings/notifications.tsx`

A `TODO` comment at line 115 shows the notifications screen still uses hardcoded mock data instead of real API calls:
```typescript
// TODO: 实际 API 调用
```

**Impact:** The mobile app cannot display real notifications. This is a known incomplete feature.

**Fix approach:** Wire up the `notifications` query to call the actual API endpoint once the mobile auth flow is implemented.

### Test Files with `as any` Casting

Test files in `api/src/services/` and `api/src/repositories/` use heavy `as any` casting to suppress type errors. This appears in virtually every mock setup and expected value assertion across ~50 test files.

**Files:** `api/src/services/feeType.service.test.ts`, `api/src/services/bill.service.test.ts`, `api/src/services/permission.service.test.ts`, and many more.

**Impact:** Tests can pass even when types are wrong, silently hiding type regressions.

**Fix approach:** Create typed mock factories/fixtures with correct Prisma types. Use `vi.mocked()` with proper type guards.

### No Database Migrations Folder

The `api/prisma/` directory has no `migrations/` folder, meaning the database is managed via `prisma db push` rather than proper migrations.

**Impact:** No version-controlled history of schema changes. No way to safely roll back schema changes. Production schema changes cannot be safely applied.

**Fix approach:** Switch to `prisma migrate dev` / `prisma migrate deploy`. Create an initial migration from the current schema state.

### Console.error Usage in Production Code

The API uses `console.error` / `console.log` extensively throughout production code instead of a structured logger:

- `api/src/services/billGeneration.ts:181` - `console.error('[billGeneration] failed to send tenant bill_generated sms:', error)`
- `api/src/services/bill.service.ts:144` - `console.error('[bill.service] failed to send tenant bill_generated sms:', error)`
- `api/src/scheduler/index.ts` - multiple `console.log` / `console.error` for scheduler events
- `api/src/utils/audit.ts:57` - `console.log('[AUDIT]', ...)` for audit events

**Impact:** No log levels, no structured output, no log aggregation compatibility. Hard to filter/search logs in production.

**Fix approach:** Replace with a structured logger (e.g., pino) that outputs JSON with log levels.

### SMS Sending Failures Silently Swallowed

SMS send failures in scheduler tasks only log the error and mark delivery as failed - they do not retry or alert:

- `api/src/scheduler/notificationChecks.ts:101` - Bill overdue SMS failure
- `api/src/scheduler/notificationChecks.ts:171` - Rent due reminder SMS failure
- `api/src/services/billGeneration.ts:180` - Bill generation SMS failure
- `api/src/services/lease.service.ts:183,225` - Move-in/move-out notification failures

**Impact:** Tenants may not receive critical notifications (overdue bills, rent reminders). No alerting when SMS delivery consistently fails.

**Fix approach:** Add retry logic with exponential backoff, or integrate with a message queue for reliable delivery.

---

## Security Considerations

### Hardcoded Default Secret Key

**File:** `api/src/config.ts:145`

The default `SECRET_KEY` is `'dev-secret-key-do-not-use-in-production'`. The config validates this is not used in production, but it remains a fallback in `envStr()`.

**Risk:** If the env var is accidentally unset in production, the system falls back to a known-insecure key.

**Current mitigation:** `validateProductionSecurity()` throws on startup if the default is detected.

**Recommendation:** Use a required env var (no default) so missing config fails explicitly.

### JWT Implementation Uses HMAC-SHA256 Without Standard Library

**File:** `api/src/utils/jwt.ts`

Tokens are signed/verified using raw `crypto.createHmac('sha256')` instead of a standard JWT library like `jose`. This is a custom implementation.

**Risk:** Custom crypto implementations can have subtle vulnerabilities (none detected in current code, but the risk surface is higher than using battle-tested `jose`).

**Recommendation:** Consider migrating to `@node-rs/jsonwebtoken` or `jose` for standardized JWT handling.

### Audit Logs Written to stdout via console.log

**File:** `api/src/utils/audit.ts:57`

Admin actions are logged via `console.log('[AUDIT]', JSON.stringify(logData))` instead of a dedicated audit table or secure log sink.

**Risk:** Audit logs could be lost, truncated, or mixed with application logs.

**Recommendation:** Write to an append-only audit log table in the database, or use a dedicated secure log aggregation service.

### CORS Config Defaults to localhost

**File:** `api/.env.example`

`CORS_ORIGINS` defaults to `["http://localhost:3000"]`. The config validates against wildcard `*` in production, but a misconfigured CORS in staging could allow unintended origins.

---

## Performance Bottlenecks

### Missing Database Indexes (Prisma Schema)

The schema at `api/prisma/schema.prisma` shows several foreign key relationships that rely on implicit indexes from Prisma's `@relation` directives. A quick audit should verify:

- `organization_members(organization_id, user_id)` - compound index present
- `apartment(organization_id)` - index present
- No compound indexes on frequently queried columns like `bills(tenant_id, due_date)` or `leases(room_id, status)`

**Impact:** As data grows, queries on billing and lease status will degrade.

**Fix approach:** Add explicit `@@index` directives for common query patterns.

### No Query Pagination on List Endpoints

Many list endpoints return all matching records without pagination:

- `api/src/routes/v1/bills.ts`
- `api/src/routes/v1/leases.ts`
- `api/src/routes/v1/apartments.ts`

**Impact:** Organizations with thousands of records will experience slow responses and large payload sizes.

**Fix approach:** Add cursor-based pagination (or offset pagination with a configurable limit) to all list endpoints.

### SMS Sending in Request Path

SMS notifications are sent synchronously within the request handler (in `tenantReachability.service.ts` and `scheduler/` tasks). If the SMS gateway is slow, it blocks the response.

**Impact:** High latency for notification-heavy operations.

**Fix approach:** Move SMS sending to a background job queue.

---

## Fragile Areas

### Complex JSON Parsing in service-product.repo.ts

**File:** `api/src/repositories/service-product.repo.ts:44-80`

The `parsePricingDiscounts()` function manually validates and parses `Prisma.JsonValue` with multiple null guards and type checks, returning `null` on any malformed entry:

```typescript
if (value === null) return null;
if (!Array.isArray(value)) return null;
// ... many validation checks
for (const entry of value) {
  if (!isJsonObject(entry)) return null;
  // ...
  if (typeof months !== 'number') return null;
```

**Why fragile:** Any change to the JSON structure requires updating this fragile validation logic. No schema validation (e.g., Zod) is used.

**Safe modification:** Test thoroughly with malformed data. Consider replacing with a Zod schema.

### Silent Error Recovery in WeChat Pay

**File:** `api/src/services/wechatPayNative.ts:74-121`

Multiple early returns of `null` on failure without throwing:
```typescript
if (notifyUrl) return null;
if (totalFen <= 0) return null;
// ...
console.error('WeChat Pay Native order failed:', res.status, errText);
return null;
```

**Why fragile:** Callers may not expect `null` returns and silently proceed with incorrect state.

**Safe modification:** Document null return conditions. Ensure all callers check for null explicitly.

### Duplicate Permission Check Patterns

The permission checking logic is spread across:
- `api/src/constants/permissionDefaults.ts`
- `tenant-web/src/lib/constants/admin-permissions.ts`
- `api/src/services/permission.service.ts`
- `tenant-web/src/lib/permission-access.ts`

These are not auto-generated from a single source of truth.

**Why fragile:** Adding a new permission requires updating 4 separate files. Drift between frontend and backend permission codes can cause authorization bugs.

**Safe modification:** Generate permission constants from a shared package (`packages/api-contract/`) that both frontend and backend import.

### WeChat Pay Certificate Path Security

**File:** `api/src/utils/wechatPayCallback.ts`

The WeChat Pay callback verification reads a certificate key directly from an env var or file. If the env var is logged or the file has incorrect permissions, the certificate is exposed.

**Current mitigation:** Not detected if secrets are in `.env` (not committed).

**Recommendation:** Ensure `.env` is in `.gitignore`, file permissions are restricted (`chmod 600`), and never log the key value.

---

## Dependencies at Risk

### Tamagui RC Version in Mobile

**File:** `mobile/package.json`

```json
"tamagui": "2.0.0-rc.23",
"@tamagui/config": "2.0.0-rc.23"
```

Using a release candidate version (`rc.23`) of Tamagui. RC versions may have breaking changes before stable release.

**Risk:** Upgrading to the next RC or stable release may require significant migration work.

**Migration plan:** Monitor for a stable 2.0 release. Test thoroughly before adopting any new RC.

### Old OpenTelemetry Versions

**File:** `api/package.json`

```json
"@opentelemetry/exporter-metrics-otlp-grpc": "^0.213.0",
"@opentelemetry/exporter-trace-otlp-grpc": "^0.213.0",
"@opentelemetry/sdk-metrics": "^2.6.0",
"@opentelemetry/sdk-node": "^0.213.0"
```

OpenTelemetry packages at v0.213 (v1 is available). SDK at v2.6 (v2.8+ available).

**Risk:** New features and bug fixes in newer versions are not available. May have known issues fixed in later releases.

**Migration plan:** Upgrade OpenTelemetry SDK to v2.x and exporters to v1.x in a controlled environment with tracing verified.

### Prisma 7.x in Early Adoption

**File:** `api/package.json`

```json
"@prisma/client": "^7.4.2",
"prisma": "^7.4.2"
```

Prisma 7.x is relatively new. The adapter pattern (`@prisma/adapter-pg`) is used, which is the new approach but has less community coverage than the classic driver.

**Risk:** Undiscovered edge cases, fewer Stack Overflow answers.

**Migration plan:** Test all database operations thoroughly on upgrade. Monitor Prisma release notes for 7.x stability signals.

### Express Without TypeScript-First Validation

**File:** `api/package.json`

Express route handlers manually parse Zod schemas inside each try block:
```typescript
try {
  const parsed = ApartmentCreateSchema.safeParse(req.body);
  if (!parsed.success) return next(createAppError(400, ...));
  const result = await apartmentService.create(parsed.data);
  res.json(result);
} catch (e) { next(e); }
```

**Why fragile:** No centralized input validation middleware. Each of the 200+ try blocks duplicates this pattern.

**Fix approach:** Create a middleware that wraps Zod schema validation and attaches parsed/typed body to the request, reducing each endpoint to ~10 lines.

---

## Test Coverage Gaps

### Mobile App: No Test Files

The `mobile/` directory has zero test files. No unit, integration, or E2E tests exist for the mobile app.

**Risk:** Changes to the mobile app can break silently.

**Priority:** Medium - mobile is labeled "实验性" (experimental) in docs, so current approach may be intentional.

### API: Service Layer Well Covered, Route Layer Barely Tested

Most service files have `.test.ts` companions (51 test files total across api/). However, route/handler-level integration tests are minimal. The 200+ try/catch endpoint blocks in the route files have almost no direct test coverage.

**What's not tested:** Input validation edge cases, HTTP status codes, error response formats, auth enforcement per endpoint.

**Risk:** High - changing a route handler can break the API contract without any test failure.

**Priority:** High - add integration tests for each route using supertest.

### No E2E Tests in CI

E2E tests exist in `e2e/` (Playwright) but may not be run in CI. No coverage data shows whether they run on every PR.

---

## Missing Critical Features

### No Rate Limiting

No rate limiting middleware detected on any API endpoint. Public endpoints (auth, SMS verification codes) are vulnerable to brute force.

**Impact:** An attacker could hammer the `/auth/login` or `/auth/send-code` endpoints.

### No Request/Response Logging Middleware

No request logging (Morgan/compressible/express-pino-logger). No response time tracking. No request ID propagation.

**Impact:** Cannot diagnose slow requests or trace requests across services.

### No Backup Strategy Documented

No documented database backup/restore procedure. No automated backups configured.

---

*Concerns audit: 2026-03-19*
