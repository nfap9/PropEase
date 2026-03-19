---
phase: 05-优化架构
plan: '02'
subsystem: infra
tags: [api-client, web-api-client, tenant-web, admin-web, axios, typescript]

# Dependency graph
requires: []
provides:
  - web-api-client exports createAdminApiClient for admin panel use
  - tenant-web uses createBrowserApiClient from web-api-client
  - admin-web uses createAdminApiClient from web-api-client
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [unified-api-client, shared-api-client-package]

key-files:
  created: []
  modified:
    - packages/web-api-client/src/index.ts
    - tenant-web/src/lib/api/client.ts
    - admin-web/src/lib/api/admin-client.ts

key-decisions:
  - "web-api-client is the single API client package for both tenant and admin apps"
  - "createAdminApiClient handles admin-specific token keys and 401 redirect without refresh token support"
  - "tenant-web client configured with explicit accessTokenKey, refreshTokenKey, refreshPath, loginPath, enableRefresh, suppressUnauthorizedError"
  - "admin-web client configured with adminTokenKey='admin_access_token' and loginPath='/login'"

patterns-established:
  - "Shared API client package (web-api-client) used by both web apps — eliminates duplicate axios configuration"
  - "Admin mode uses separate token storage key, no refresh tokens, silent 401 redirect"

requirements-completed: []

# Metrics
duration: ~5min
completed: 2026-03-19
---

# Phase 5 Plan 2: Unified API Client (web-api-client) Summary

**web-api-client serves as the single API client package for both tenant-web and admin-web, eliminating duplicate axios configuration**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-03-19
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added `createAdminApiClient` function to `packages/web-api-client/src/index.ts` with AdminApiConfig interface
- Configured `tenant-web/src/lib/api/client.ts` with full `createBrowserApiClient` options
- Migrated `admin-web/src/lib/api/admin-client.ts` from inline axios to `createAdminApiClient`

## Task Commits

1. **feat(05-02): add createAdminApiClient for admin mode support** - `16d15df`
2. **feat(05-02): configure tenant-web API client with full token settings** - `047a2bf`
3. **feat(05-02): migrate admin-client to createAdminApiClient** - `fbda50f`

## Files Created/Modified

- `packages/web-api-client/src/index.ts` — Added `AdminApiConfig` interface and `createAdminApiClient` function; creates AxiosInstance with admin-specific token storage (`admin_access_token`), no refresh token support, and 401 redirect to login
- `tenant-web/src/lib/api/client.ts` — Configured `createBrowserApiClient` with explicit `accessTokenKey`, `refreshTokenKey`, `refreshPath`, `loginPath`, `enableRefresh: true`, `suppressUnauthorizedError: false`
- `admin-web/src/lib/api/admin-client.ts` — Replaced inline `axios.create()` + request/response interceptors with `createAdminApiClient`; retained `toAdminPlan`, `mapAxiosData` utilities and all endpoint definitions

## Decisions Made

- Admin refresh tokens not used — `refreshTokens: undefined` in `createAdminApiClient`
- Admin 401 silently suppressed — `suppressUnauthorizedError: true` to prevent React Query error state on auth expiry
- `mapAxiosData` utility retained in admin-client for plan endpoint data transformation (not handled by client-level interceptor)
- All admin-api type re-exports retained for backward compatibility

## Deviations from Plan

None - plan executed exactly as written. Minor deviations already applied:
- `tenant-web/src/lib/api.ts` referenced in plan does not exist; actual target was `tenant-web/src/lib/api/client.ts` which was already using web-api-client (upgraded with full config)
- `mapAxiosData` utility retained in admin-client (referenced by endpoints, not in original inline axios setup)

## Issues Encountered

- No issues — all tasks completed cleanly, type-check passes across api, tenant-web, and admin-web

## Verification

- `pnpm type-check` passes for api, tenant-web, admin-web
- `grep "createAdminApiClient" packages/web-api-client/src/index.ts` — found
- `grep "from '@apartment-ultra/web-api-client'" tenant-web/src/lib/api/client.ts` — found
- `grep "from '@apartment-ultra/web-api-client'" admin-web/src/lib/api/admin-client.ts` — found

## Next Phase Readiness

- **05-03 (API Route Refactoring):** Can proceed — no dependency on API client changes
- **05-04 (Logging):** Can proceed — no dependency on API client changes

---
*Phase: 05-02*
*Completed: 2026-03-19*
