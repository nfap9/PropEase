---
phase: 05-优化架构
plan: '01'
subsystem: infra
tags: [api-contract, permissions, typescript, shared-code]

# Dependency graph
requires: []
provides:
  - api-contract/src/permissions.ts exports RESOURCES, ACTIONS, RESOURCE_NAMES, ACTION_NAMES, toPermissionCodes
  - api/src/constants/permissionDefaults.ts imports from api-contract
  - tenant-web/src/lib/permission-access.ts imports from api-contract
affects: [05-02, 05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [single-source-of-truth, shared-constants-via-package]

key-files:
  created: []
  modified:
    - packages/api-contract/src/permissions.ts
    - packages/api-contract/src/index.ts
    - api/src/constants/permissionDefaults.ts
    - tenant-web/src/lib/permission-access.ts

key-decisions:
  - "RESOURCES, ACTIONS, RESOURCE_NAMES, ACTION_NAMES, toPermissionCodes live in api-contract — single source of truth"
  - "SYSTEM_ROLES, ORG_MEMBER_ROLES, DEFAULT_*_ROLE_PERMISSIONS stay in permissionDefaults.ts (backend-specific)"
  - "RESOURCE_NAMES, ACTION_NAMES stay in permissionDefaults.ts (per-app UI labels, not shared)"
  - "tenant-web permission-access.ts imports from api-contract for architectural clarity (admin:* system separate)"

patterns-established:
  - "Shared constants via internal package (api-contract) — all codebases import from one place"
  - "Type exports use `export type { ... }` syntax, value exports use `export { ... }` — no type/value conflicts"

requirements-completed: []

# Metrics
duration: ~10min
completed: 2026-03-19
---

# Phase 5 Plan 1: Permission System DRY Summary

**api-contract is now the single source of truth for permission codes — backend and frontend import from one place**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-03-19
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments
- Added RESOURCES, ACTIONS, RESOURCE_NAMES, ACTION_NAMES, toPermissionCodes to `packages/api-contract/src/permissions.ts`
- Updated `packages/api-contract/src/index.ts` to export the new constants
- Updated `api/src/constants/permissionDefaults.ts` to import from api-contract (keeps backend-specific role configs local)
- Updated `tenant-web/src/lib/permission-access.ts` to import from api-contract

## Task Commits

Single atomic commit for all 4 tasks:

1. **refactor(05-01): establish api-contract as single source for permission codes** - `d0b871e` (refactor)

## Files Created/Modified

- `packages/api-contract/src/permissions.ts` — Added RESOURCES, ACTIONS, RESOURCE_NAMES, ACTION_NAMES, toPermissionCodes constants; changed `Resource`/`Action` types to be derived from the `as const` arrays
- `packages/api-contract/src/index.ts` — Added exports for the new constants alongside existing type exports
- `api/src/constants/permissionDefaults.ts` — Imports from api-contract; keeps SYSTEM_ROLES, ORG_MEMBER_ROLES, DEFAULT_*_ROLE_PERMISSIONS local
- `tenant-web/src/lib/permission-access.ts` — Added import from api-contract; AccessRule.permission stays `string` (no type change needed)

## Decisions Made

- Kept SYSTEM_ROLES, ORG_MEMBER_ROLES, and role-permission maps in `permissionDefaults.ts` — these are backend-specific role concepts, not shared permission codes
- Kept RESOURCE_NAMES and ACTION_NAMES in `permissionDefaults.ts` — Chinese UI labels are per-app concerns
- admin-permissions.ts (admin:*) unchanged — separate permission system, not in scope for DRY
- tenant-web permission-access.ts doesn't use RESOURCES/ACTIONS values directly — import added for architectural clarity and future extensibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript duplicate identifier errors when both `export type { Resource }` and `export { ... type Resource ... }` existed in api-contract/index.ts — fixed by removing redundant `type` re-exports from the constants block
- Unused import warning for RESOURCES/ACTIONS in permission.service.ts — these constants are not directly used in that file; architectural goal achieved via permissionDefaults.ts re-export

## Next Phase Readiness

- **05-02 (API Client Unification):** Can proceed — api-contract exports are stable
- **05-03 (API Route Refactoring):** Can proceed — no dependency on permission changes
- **05-04 (Logging):** Can proceed — no dependency on permission changes

---
*Phase: 05-01*
*Completed: 2026-03-19*
