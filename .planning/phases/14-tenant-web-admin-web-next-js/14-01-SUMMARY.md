---
phase: 14-tenant-web-admin-web-next-js
plan: '01'
subsystem: auth
tags: [next-js, authentication, multi-tenant, admin]

# Dependency graph
requires: []
provides:
  - Unified AuthProvider with isAdmin flag computed from admin_access_token presence
  - logout() clears both access_token and admin_access_token tokens
  - getPostAuthRedirectPath accepts isAdmin parameter for role-based redirect
  - isAdminPath() helper for route detection
  - getLogoutRedirectPath() for role-based logout redirect
affects:
  - Phase 14 subsequent plans (admin layout integration, root page redirect)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Computed isAdmin boolean from localStorage token presence
    - Role-based redirect logic in logout
    - Admin path detection via path prefix check

key-files:
  created: []
  modified:
    - tenant-web/src/lib/auth/context.tsx
    - tenant-web/src/lib/auth/redirect.ts

key-decisions:
  - "isAdmin computed from localStorage.getItem('admin_access_token') - not stored as state"
  - "Admin logout redirects to /admin/login, tenant logout redirects to /login"
  - "checkAuth() checks admin_access_token first and returns early if present"

patterns-established: []

requirements-completed: []

# Metrics
duration: 69s
completed: 2026-03-21
---

# Phase 14 Plan 01: Unified AuthProvider with isAdmin Detection

**Unified AuthProvider handles both tenant (access_token) and admin (admin_access_token) authentication with role-based redirect**

## Performance

- **Duration:** 69s
- **Started:** 2026-03-21T05:16:30Z
- **Completed:** 2026-03-21T05:17:39Z
- **Tasks:** 3 (2 committed, Task 3 merged into Task 1)
- **Files modified:** 2

## Accomplishments

- AuthProvider now detects admin role via `admin_access_token` presence
- AuthProvider exposes `isAdmin` boolean computed from localStorage
- Logout clears both tokens and redirects based on role (admin -> /admin/login, tenant -> /login)
- Redirect logic updated with ADMIN_PATH, TENANT_PATHS, isAdminPath(), and getLogoutRedirectPath()

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand AuthProvider to detect admin role** - `eaaf125` (feat)
2. **Task 2: Update redirect logic for admin vs tenant paths** - `30e6745` (feat)

**Plan metadata:** `040e356` (docs: create phase plan)

## Files Created/Modified

- `tenant-web/src/lib/auth/context.tsx` - Added isAdmin boolean, checkAuth admin detection, logout clears both tokens
- `tenant-web/src/lib/auth/redirect.ts` - Added ADMIN_PATH, TENANT_PATHS, isAdminPath(), getLogoutRedirectPath()

## Decisions Made

- isAdmin computed from localStorage.getItem('admin_access_token') - not stored as state (recomputes on each render)
- Admin logout redirects to /admin/login, tenant logout redirects to /login
- checkAuth() checks admin_access_token first and returns early if present (skips tenant auth flow)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Auth foundation complete with isAdmin flag available for admin layout integration
- Ready for Task 14-02: Admin layout integration with AdminAuthLayout pattern
- Root page redirect logic can use isAdmin flag to route users appropriately

---
*Phase: 14-tenant-web-admin-web-next-js Plan 01*
*Completed: 2026-03-21*
