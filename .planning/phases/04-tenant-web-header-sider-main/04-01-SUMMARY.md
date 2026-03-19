---
phase: 04-tenant-web-header-sider-main
plan: '01'
subsystem: ui
tags: [nextjs, route-groups, auth, layout, mobile-nav]

# Dependency graph
requires:
  - phase: 03-tenant-web
    provides: Settings page with org switch, /organizations page
provides:
  - (auth) route group with login/register pages accessible without auth
  - (dashboard) route group with AuthGuard + MainLayout wrapper for protected pages
  - Mobile Sheet navigation using Menu icon (Bell bug fixed)
affects:
  - phase: 04 (future plans in this phase)
  - auth-related phases

# Tech tracking
tech-stack:
  added: [nextjs-route-groups]
  patterns:
    - Auth route group pattern: public pages under (auth)/ with no auth barrier
    - Dashboard route group pattern: protected pages under (dashboard)/ with AuthGuard + MainLayout

key-files:
  created:
    - tenant-web/src/app/(auth)/layout.tsx
    - tenant-web/src/app/(auth)/login/page.tsx
    - tenant-web/src/app/(auth)/register/page.tsx
    - tenant-web/src/app/(dashboard)/layout.tsx
  modified:
    - tenant-web/src/components/layout/main-layout.tsx

key-decisions:
  - "Auth route group (auth) provides no-auth layout - no AuthGuard needed for login/register"
  - "Dashboard route group (dashboard) wraps all children with AuthGuard -> MainLayout"
  - "Mobile Sheet trigger uses Menu icon, Bell icon reserved for notifications button"

patterns-established:
  - "Route group pattern: (auth) for public auth pages, (dashboard) for protected pages"
  - "Layout composition: AuthGuard wraps MainLayout wraps children in dashboard group"

requirements-completed: [PH4-ROUTE-01, PH4-ROUTE-02, PH4-BUG-01]

# Metrics
duration: 85s
completed: 2026-03-19
---

# Phase 04 Plan 01: Route Group Architecture and Mobile Nav Bug Fix

**Next.js route groups (auth) and (dashboard) established with proper layouts; Bell->Menu mobile nav bug fixed**

## Performance

- **Duration:** 85s
- **Started:** 2026-03-19T06:12:39Z
- **Completed:** 2026-03-19T06:14:04Z
- **Tasks:** 3
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- Created (auth) route group with login/register pages - public pages with no auth barrier
- Created (dashboard) route group with AuthGuard + MainLayout wrapper - all protected pages
- Fixed mobile Sheet navigation bug: Bell icon replaced with Menu icon in MainLayout

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Bell->Menu bug in MainLayout** - `7496c3a` (fix)
2. **Task 2: Create (auth) route group with login/register** - `fdfdf17` (feat)
3. **Task 3: Create (dashboard) route group layout** - `de781fd` (feat)

## Files Created/Modified

- `tenant-web/src/app/(auth)/layout.tsx` - Auth layout with bg-muted/40 centering
- `tenant-web/src/app/(auth)/login/page.tsx` - Login page in auth route group
- `tenant-web/src/app/(auth)/register/page.tsx` - Register page in auth route group
- `tenant-web/src/app/(dashboard)/layout.tsx` - Dashboard layout with AuthGuard + MainLayout
- `tenant-web/src/components/layout/main-layout.tsx` - Fixed SheetTrigger to use Menu icon

## Decisions Made

- (auth) route group uses no AuthGuard since login/register must be accessible without auth
- (dashboard) route group wraps AuthGuard -> MainLayout -> children for consistent protection
- Menu icon imported alongside Bell in main-layout.tsx (Bell remains for notifications button)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Route group architecture established as foundation for Phase 04
- (auth) and (dashboard) route groups ready for page migration in future plans
- Mobile navigation bug fixed, improving mobile UX
- Next plan in Phase 04 can proceed immediately

---
*Phase: 04-tenant-web-header-sider-main*
*Completed: 2026-03-19*
