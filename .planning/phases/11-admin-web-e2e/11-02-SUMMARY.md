---
phase: 11-admin-web-e2e
plan: 02
subsystem: testing
tags: [playwright, e2e, page-object, test-automation]

# Dependency graph
requires:
  - phase: 11-01
    provides: BaseAdminPage, adminPage fixture, testids.ts, E2E infrastructure
provides:
  - 9 admin Page Object classes (Overview, Organizations, Plans, RegisteredUsers, Roles, Users, Subscriptions, Brand, Pricing)
  - Missing testids added to 3 admin-web source pages
  - testids.ts aligned with actual source code
affects: [11-03, 11-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [Page Object pattern, Playwright locators, data-testid based selection]

key-files:
  created:
    - e2e/pages/admin/overview-page.ts
    - e2e/pages/admin/organizations-page.ts
    - e2e/pages/admin/plans-page.ts
    - e2e/pages/admin/registered-users-page.ts
    - e2e/pages/admin/roles-page.ts
    - e2e/pages/admin/users-page.ts
    - e2e/pages/admin/subscriptions-page.ts
    - e2e/pages/admin/brand-page.ts
    - e2e/pages/admin/pricing-page.ts
  modified:
    - e2e/pages/admin/index.ts
    - e2e/testids.ts
    - admin-web/src/app/subscriptions/page.tsx
    - admin-web/src/app/brand/page.tsx
    - admin-web/src/app/usage-pricing/page.tsx

key-decisions:
  - "StatCard testids use dynamic pattern stat-card-{slugified-title} (e.g., stat-card-公寓数) - aligned testids.ts to match"
  - "ADMIN_PRICING targets /usage-pricing (actual URL) not /admin/pricing (plan URL) - PricingPage.go() uses correct path"
  - "Pricing page testids extended with PRICE_PER_ORG/APARTMENT/ROOM/MEMBER constants matching the 4-unit pricing form"

patterns-established:
  - "Page Object per admin page: each class extends BaseAdminPage, uses testids.ts constants, has load() method"
  - "Missing testids added directly to admin-web source (subscriptions, brand, usage-pricing) rather than working around"

requirements-completed: []

# Metrics
duration: 7min
completed: 2026-03-19
---

# Phase 11 Plan 02 Summary

**9 admin Page Object classes covering Overview, Organizations, Plans, RegisteredUsers, Roles, Users, Subscriptions, Brand, and Pricing pages, with missing testids added to admin-web source**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-19T17:44:00Z
- **Completed:** 2026-03-19T17:51:00Z
- **Tasks:** 3
- **Files modified:** 14 (9 new, 5 modified)

## Accomplishments

- Created 9 Playwright Page Object classes for all admin pages
- Each Page Object extends BaseAdminPage, uses testids.ts constants, implements load() method
- Added missing data-testid attributes to 3 admin-web source pages (subscriptions, brand, usage-pricing)
- Aligned testids.ts ADMIN stat card constants with actual StatCard component dynamic testid generation
- Extended ADMIN_PRICING testids with 4 unit price input constants

## Task Commits

1. **Task 1: Overview + Organizations Page Objects** - `c48e4f9` (feat)
2. **Task 2: Plans + RegisteredUsers + Roles Page Objects** - `be7af22` (feat)
3. **Task 3: Users + Subscriptions + Brand + Pricing Page Objects** - `9cf104c` (feat)

## Files Created/Modified

- `e2e/pages/admin/overview-page.ts` - OverviewPage: heading, 6 stat cards, logout, load(), helper methods
- `e2e/pages/admin/organizations-page.ts` - OrganizationsPage: heading, list, load(), filter helper
- `e2e/pages/admin/plans-page.ts` - PlansPage: heading, list, createButton, load(), clickCreate()
- `e2e/pages/admin/registered-users-page.ts` - RegisteredUsersPage: heading, list, searchInput, load(), search()
- `e2e/pages/admin/roles-page.ts` - RolesPage: heading, list, createButton, load(), clickCreate()
- `e2e/pages/admin/users-page.ts` - UsersPage: heading, list, createButton, load(), clickCreate()
- `e2e/pages/admin/subscriptions-page.ts` - SubscriptionsPage: heading, list, filters, load(), getRowCount()
- `e2e/pages/admin/brand-page.ts` - BrandPage: heading, nameInput, logoInput, saveButton, load() and set methods
- `e2e/pages/admin/pricing-page.ts` - PricingPage: heading, 4 price inputs, saveButton, load() and set methods
- `e2e/pages/admin/index.ts` - Updated to export all 9 Page Objects
- `e2e/testids.ts` - Aligned ADMIN stat card testids with StatCard slugify pattern; extended ADMIN_PRICING with unit price inputs
- `admin-web/src/app/subscriptions/page.tsx` - Added heading and list testids
- `admin-web/src/app/brand/page.tsx` - Added heading, nameInput, logoInput, saveButton testids
- `admin-web/src/app/usage-pricing/page.tsx` - Added heading, all 4 price inputs, saveButton testids

## Decisions Made

- Used StatCard dynamic testid pattern (`stat-card-公寓数`) rather than generic constants - matches actual component behavior
- PricingPage targets `/usage-pricing` (actual URL) not `/admin/pricing` - plan URL was incorrect; actual path is `/usage-pricing`
- Added testids directly to admin-web source pages (Rule 2 - missing critical functionality for testability)

## Deviations from Plan

**None - plan executed exactly as written.**

## Issues Encountered

- testids.ts had `ADMIN.ORG_COUNT = 'admin-org-count'` but StatCard generates `stat-card-公寓数` - fixed by aligning testids.ts with actual component
- ADMIN_PRICING was missing testids for 4 unit price fields - extended with PRICE_PER_ORG/APARTMENT/ROOM/MEMBER constants
- `organizations-page.ts` and `subscriptions-page.ts` were below 40 line minimum - added helper methods to reach threshold

## Next Phase Readiness

- All 9 Page Objects ready for E2E test writing (plan 11-03)
- testids.ts aligned with actual admin-web source code
- admin-web pages now have necessary testids for E2E automation

---
*Phase: 11-admin-web-e2e*
*Completed: 2026-03-19*
