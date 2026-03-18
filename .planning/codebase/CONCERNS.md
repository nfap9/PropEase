# Codebase Concerns

**Analysis Date:** 2026-03-18

## Tech Debt

### Large Route Files - Maintainability Risk

**Issue:** Several route files have grown too large, making them difficult to maintain and understand.

- **`api/src/routes/v1/apartments.ts`** - 1062 lines, handles apartments, rooms, and fee configs
- **`api/src/routes/v1/organizations.ts`** - 778 lines
- **`api/src/routes/v1/bills.ts`** - 639 lines
- **`api/src/services/admin.service.ts`** - 665 lines
- **`api/src/services/tenantReachability.service.ts`** - 633 lines

**Impact:** High complexity makes onboarding difficult, increases bug risk, and slows down code reviews.

**Fix approach:** Split by feature domains (e.g., apartments/routes.ts, apartments/rooms.ts, apartments/fee-configs.ts) or use route handlers in separate files with composable middleware.

### Missing Database Index

**Issue:** `Tenant.phone` field lacks an index but may be queried for lookups.

- Files: `api/prisma/schema.prisma` (line 128)

**Impact:** Queries filtering tenants by phone number will perform full table scans as the tenant table grows.

**Fix approach:** Add `@unique` or `@@index([phone])` to the Tenant model if phone-based lookups are common.

### Sequential Awaits in Loop

**Issue:** `customRole.service.ts` uses sequential awaits when initializing default roles.

- Files: `api/src/services/customRole.service.ts` (lines 65-72)

```typescript
for (const d of DEFAULT_ROLES) {
  await getRepo().create({ ... });
}
```

**Impact:** N+1 database operations during role initialization.

**Fix approach:** Use `Promise.all()` or batch insert with `prisma.createMany()`.

---

## Security Considerations

### No API Rate Limiting

**Issue:** The Express API has no rate limiting middleware.

- Files: `api/src/` (all routes)

**Impact:** Vulnerable to brute-force attacks on login endpoints, denial of service, and API abuse.

**Current mitigation:** None detected.

**Recommendations:**
- Add `express-rate-limit` for general API protection
- Implement stricter limits on authentication endpoints
- Consider using a Redis-backed rate limiter for distributed deployments

### Dev Secret Key Warning

**Issue:** The application detects and warns but does not prevent startup with the default dev secret key.

- Files: `api/src/config.ts` (lines 157-159)

**Current mitigation:** Warning logged on startup if `SECRET_KEY` is the default value.

**Recommendations:** Consider making it a fatal error in production mode rather than just a warning.

---

## Performance Bottlenecks

### Large Result Pagination Missing

**Issue:** Several list endpoints may return unbounded results without pagination controls.

- Files: Multiple route files in `api/src/routes/v1/`

**Impact:** Memory exhaustion and slow response times with large datasets.

**Current mitigation:** Some endpoints may have implicit limits.

**Recommendations:** Audit all `findMany` calls and ensure consistent pagination with `take`/`skip`.

### Prisma Include for Deep Relations

**Issue:** Some queries use deep `include` chains that could load unnecessary data.

- Files: Multiple services like `tenantReachability.service.ts`, `bill.service.ts`

**Current mitigation:** Prisma lazy loading helps mitigate this.

**Recommendations:** Review and add `select` where only specific fields are needed.

---

## Fragile Areas

### Empty Catch Blocks with Fallback Intent

**Issue:** Several files have empty catch blocks that silently swallow errors, but are intentional fallbacks:

- `api/src/services/tenantReachability.service.ts:201` - SMS response parsing
- `api/src/config.ts:110` - CORS config parsing
- `api/src/utils/wechatPayCallback.ts:27` - WeChat callback
- `api/src/utils/jwt.ts:45` - JWT verification

**Why fragile:** While the fallbacks are intentional, it's easy to mistake these for bugs during maintenance.

**Safe modification:** Add comments explaining the fallback behavior, e.g., `// Intentionally swallow parsing errors, fallback to null`

### Mobile App Stub Implementation

**Issue:** Notifications settings page uses mock data instead of actual API calls.

- Files: `mobile/app/settings/notifications.tsx:115`

```typescript
// TODO: 实际 API 调用
if (filter === 'all') return mockNotifications
```

**Why fragile:** This is a known incomplete feature that may mislead developers about functionality.

**Safe modification:** Implement actual API integration or add runtime warnings.

---

## Test Coverage Gaps

### Type Safety - `any` Usage in Tests

**Issue:** Test files use `any` type in 13 locations across 6 files.

- Files: `api/src/services/billGeneration.test.ts`, `api/src/services/tenantReachability.service.test.ts`, etc.

**Risk:** Tests may pass incorrectly due to loose type checking.

**Priority:** Low (test files only)

### Missing Integration Tests

**Issue:** No detected end-to-end tests for critical user flows.

- Current coverage: Unit tests in `api/src/`, E2E tests in `e2e/`

**Risk:** Regression in multi-service workflows may go unnoticed.

**Priority:** Medium

---

## Dependencies at Risk

### Older Package Versions

**Issue:** Some dependencies are on older major versions:

- `express`: ^4.21.0 (latest is 5.x)
- `bcryptjs`: ^2.4.3 (consider `bcrypt` for native performance)
- `pg`: ^8.19.0 (recent issues with connection handling in edge cases)

**Risk:** Security patches may be delayed, performance improvements missed.

**Migration plan:** Monitor release notes, plan incremental upgrades in staging first.

---

## Missing Critical Features

### No Request ID Propagation

**Issue:** No centralized request ID for tracing across services.

**Impact:** Difficult to correlate logs across distributed operations.

**Recommendation:** Add `request-id` header propagation.

### No API Versioning Strategy

**Issue:** API uses `/v1/` prefix but no formal versioning mechanism.

**Impact:** Breaking changes affect all clients simultaneously.

**Recommendation:** Implement content negotiation or header-based versioning.

---

## Mobile App Concerns

### Incomplete Feature Set

**Issue:** Mobile app has stub implementations:

- Notifications settings: Uses mock data
- Limited screens implemented

**Impact:** Not production-ready for end users.

**Priority:** High (if mobile is a target platform)

### Separate Quality Gate

**Issue:** Mobile app has separate `type-check:mobile` and is not included in root lint/test commands.

- Per `CLAUDE.md`: "mobile/ 当前只接入独立 type-check"

**Impact:** Easy to introduce regressions that aren't caught by CI.

**Recommendation:** Integrate mobile checks into CI pipeline.

---

## Known Issues Summary

| Issue | Severity | Priority | Files |
|-------|----------|---------|-------|
| No rate limiting | High | High | `api/src/` |
| Large route files | Medium | Medium | `api/src/routes/v1/*.ts` |
| Missing Tenant.phone index | Medium | Medium | `api/prisma/schema.prisma` |
| Sequential awaits in loop | Low | Low | `api/src/services/customRole.service.ts` |
| Mobile stubs | Medium | Medium | `mobile/app/settings/notifications.tsx` |
| Test `any` usage | Low | Low | Test files |
| Dev secret warning | Low | Low | `api/src/config.ts` |

---

*Concerns audit: 2026-03-18*
