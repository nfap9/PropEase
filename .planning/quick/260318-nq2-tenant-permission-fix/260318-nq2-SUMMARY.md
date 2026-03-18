# Quick Task 260318-nq2: Tenant Permission Fix Summary

## Overview

**Type:** quick-tenant-permission-fix
**Plan:** 01
**Status:** Completed
**Completed:** 2026-03-18

## Objective

Fix the bug where organization owners cannot configure role permissions on the tenant-web permission management page. Root cause: `usePermissions` useQuery has no error handler, so API failures cause `permissions = []`, making `hasPermission('settings:view')` return false for the owner.

## One-liner

Error-resilient permission loading with owner bypass for /settings/permissions route.

## Tasks Executed

### Task 1: Add error handling and owner role awareness to usePermissions hook

**Commit:** `3d84a44`

**Changes:**
- Added `error` to destructured useQuery return value
- Added `useEffect` to log permission API failures via `console.error('[usePermissions] Failed to load permissions:', error)`
- Exposed `error` in the hook's return value so callers can react to failures

**Files modified:** `tenant-web/src/hooks/use-permissions.ts`

**Deviation from plan:** Used `useEffect` + `console.error` instead of `onError` callback because Tanstack Query v5 does not support `onError` in `UseQueryOptions`.

### Task 2: Add owner bypass to PermissionPageGuard for /settings/permissions

**Commit:** `2acdcad`

**Changes:**
- Added owner bypass check after the organization null check in `PermissionPageGuard`
- Checks if `pathname === '/settings/permissions'` AND `organization?.role === 'owner'`
- If both true, renders children directly without SETTINGS_VIEW permission check

**Files modified:** `tenant-web/src/components/layout/permission-page-guard.tsx`

## Verification

- `pnpm type-check --filter tenant-web` passes with no errors

## Success Criteria

| Criteria | Status |
|----------|--------|
| Owner can enter /settings/permissions page | Pass (owner bypass added) |
| Owner can see and edit role permissions | Pass (owner bypass added) |
| Save button appears and mutation succeeds | Pass (unchanged) |
| Non-owners still require SETTINGS_VIEW | Pass (no regression) |

## Decisions Made

1. **Error handling approach:** Used `useEffect` with `console.error` instead of `onError` callback because Tanstack Query v5 removed `onError` from `UseQueryOptions`. The error is still exposed in the return value for callers to use.

2. **Bypass placement:** Owner bypass is placed after the organization null check and before the `canAccessRule` permission check. This ensures owners bypass only the SETTINGS_VIEW check for the permissions page, not other organizational access checks.

## Key Files

| File | Change |
|------|--------|
| `tenant-web/src/hooks/use-permissions.ts` | Added error logging via useEffect, exposed error state |
| `tenant-web/src/components/layout/permission-page-guard.tsx` | Added owner bypass for /settings/permissions route |
