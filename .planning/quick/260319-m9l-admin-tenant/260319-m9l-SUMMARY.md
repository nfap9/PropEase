# Quick Task 260319-m9l: admin和tenant的默认端口冲突

**Status:** Complete

## Summary

Fixed the admin and tenant web port configuration ambiguity by explicitly setting both ports.

## Changes Made

### tenant-web/package.json
- Changed `"dev": "next dev"` → `"dev": "PORT=3000 next dev"`
- Now explicitly runs on port 3000

### admin-web/package.json
- Already had explicit configuration:
  - `"dev": "next dev -p 3001"`
  - `"start": "next start -p 3001"`
- No changes needed

## Verification

Both services can now run simultaneously without port conflicts:
- tenant-web: http://localhost:3000
- admin-web: http://localhost:3001

## Files Modified

- `tenant-web/package.json`

## Commit

f6b09c2
