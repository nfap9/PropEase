# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```
apartment-ultra/
├── api/                      # Node/Express/TypeScript backend (port 8000)
├── tenant-web/               # Tenant-facing Next.js app (port 3000)
├── admin-web/                # Admin-facing Next.js app (port 3001)
├── mobile/                   # Experimental Expo/React Native client
├── packages/                 # Shared packages
│   ├── api-contract/         # Shared TypeScript API types
│   ├── shared-ui/            # Cross-app UI components
│   └── web-api-client/       # Shared Axios API client
├── docs/                     # Project documentation
├── docker/                   # Docker Compose configurations
├── e2e/                      # Playwright E2E tests
└── .planning/                # GSD planning artifacts
```

## Directory Purposes

**api/ (apartment-ultra-api):**
- Purpose: Backend REST API
- Contains: Express server, Prisma ORM, business services, repositories
- Key subdirs:
  - `api/src/routes/v1/`: Versioned API route handlers
  - `api/src/services/`: Business logic layer
  - `api/src/repositories/`: Data access layer (Prisma wrappers)
  - `api/src/middlewares/`: Express middleware (auth, error handling, response wrapper)
  - `api/src/errors/`: Domain error classes
  - `api/src/utils/`: JWT, security, audit, bill exports
  - `api/src/observability/`: Logging/tracing initialization
  - `api/src/scheduler/`: Background job definitions
  - `api/src/startup/`: DB connection checks
  - `api/prisma/schema.prisma`: Database schema definition

**tenant-web/ (apartment-ultra-tenant):**
- Purpose: Tenant-facing web application
- Contains: Next.js App Router pages, React components, API clients
- Key subdirs:
  - `tenant-web/src/app/`: Next.js App Router pages (route groups `(auth)`, `(dashboard)`)
  - `tenant-web/src/components/`: React components (ui, layout, common, forms, charts, settings, theme)
  - `tenant-web/src/lib/api/`: Domain-specific API client modules
  - `tenant-web/src/lib/auth/`: Auth context and utilities
  - `tenant-web/src/hooks/`: Custom React hooks
  - `tenant-web/src/types/`: TypeScript type definitions
  - `tenant-web/public/`: Static assets

**admin-web/ (apartment-ultra-admin):**
- Purpose: Platform admin web application
- Contains: Next.js App Router pages, admin-specific components
- Key subdirs:
  - `admin-web/src/app/`: Pages (brand, login, organizations, permissions, plans, roles, storefront, subscriptions, system-users, usage-pricing, etc.)
  - `admin-web/src/components/`: UI components (admin, common, layout, theme, ui)
  - `admin-web/src/lib/api/`: API clients including `admin-client.ts` for admin endpoints
  - `admin-web/src/lib/auth/`: Admin authentication
  - `admin-web/src/hooks/`: Custom hooks
  - `admin-web/src/types/`: TypeScript types
  - `admin-web/src/styles/`: Global styles

**mobile/ (experimental):**
- Purpose: Expo/React Native mobile prototype
- Contains: Tab-based navigation, room/customer screens, settings
- Key subdirs:
  - `mobile/app/`: File-based Expo Router pages
  - `mobile/components/`: UI components (ui, layout, business)
  - `mobile/services/api/`: API client
  - `mobile/stores/`: State management
  - `mobile/hooks/`: Custom hooks

**packages/:**
- `packages/api-contract/`: TypeScript types for all API request/response shapes, shared across api and frontend
- `packages/shared-ui/`: Reusable UI components exported from `src/components/`
- `packages/web-api-client/`: Shared Axios API client with token management, error handling, and form error utilities

**docs/:**
- Purpose: Long-term documentation, test cases, design specs
- Contains: `docs/api-contract/`, `docs/测试用例/`, `docs/superpowers/`, `docs/ui-design/`, naming conventions, monorepo governance

**e2e/:**
- Purpose: Playwright end-to-end tests
- Contains: Test files organized by domain (auth, apartments, tenants, leases, bills, utilities, reports, permissions, etc.)
- Helpers: `e2e/helpers/`, page objects: `e2e/pages/`

## Key File Locations

**Entry Points:**
- `api/src/index.ts`: API server entry (Express app creation and startup)
- `tenant-web/src/app/layout.tsx`: Tenant web root layout
- `admin-web/src/app/layout.tsx`: Admin web root layout
- `tenant-web/src/components/layout/providers.tsx`: Tenant web provider composition
- `admin-web/src/components/layout/providers.tsx`: Admin web provider composition

**Configuration:**
- `api/src/config.ts`: API environment configuration
- `api/src/constants.ts`: Business codes and skip-wrap paths
- `api/src/messages.ts`: Error message definitions
- `package.json` (root): pnpm workspaces configuration, shared overrides, scripts
- `packages/api-contract/package.json`: Contract package metadata

**Core Logic:**
- `api/src/routes/v1/index.ts`: V1 route aggregation
- `api/src/services/apartment.service.ts`: Apartment domain service
- `api/src/repositories/apartment.repo.ts`: Apartment data access
- `packages/web-api-client/src/index.ts`: Shared API client factory
- `tenant-web/src/lib/api/apartments.ts`: Tenant web apartment API module

**Testing:**
- `api/src/services/*.test.ts`: Vitest unit tests co-located with services
- `api/src/repositories/*.test.ts`: Vitest repository tests co-located with repos
- `tenant-web/src/test/`: Tenant web test utilities
- `e2e/*.ts`: Playwright E2E tests

## Naming Conventions

**Files:**
- API source files: `kebab-case.ts` (e.g., `apartment.repo.ts`, `bill.service.ts`)
- Frontend source files: `kebab-case.tsx` (e.g., `data-table.tsx`, `auth-guard.tsx`)
- Next.js page files: `page.tsx` (route pages), `layout.tsx` (layouts)
- Next.js dynamic segments: `[id]/page.tsx`
- Route groups: `(auth)/`, `(dashboard)/`

**Functions/Variables:**
- API internal: `camelCase`
- Frontend local variables and function params: `camelCase`
- Constants: `UPPER_CASE`
- Domain-specific: API一致的字段使用 `snake_case` (e.g., `organization_id`, `created_at`)

**Types/Interfaces:**
- TypeScript types and interfaces: `PascalCase`
- Types are defined in `packages/api-contract/src/` and imported into api and frontend
- Frontend API response types also in `tenant-web/src/types/`

**Package Names:**
- `@apartment-ultra/api-contract`: API type definitions
- `@apartment-ultra/shared-ui`: Shared UI components
- `@apartment-ultra/web-api-client`: Shared API client
- `apartment-ultra-api`: Backend package name
- `apartment-ultra-tenant`: Tenant web package name
- `apartment-ultra-admin`: Admin web package name

## Where to Add New Code

**New Backend Feature:**
1. Add Prisma model in `api/prisma/schema.prisma` if new entity needed
2. Create repository in `api/src/repositories/` (e.g., `newEntity.repo.ts`)
3. Create service in `api/src/services/` (e.g., `newEntity.service.ts`)
4. Create route handler in `api/src/routes/v1/` (e.g., `new-entity.ts`)
5. Register route in `api/src/routes/v1/index.ts`
6. Add types in `packages/api-contract/src/` if new request/response shapes
7. Write tests co-located with service and repository files

**New Frontend Page (tenant-web):**
1. Create route directory under `tenant-web/src/app/`
2. Add `page.tsx` with `AuthGuard` wrapper
3. Add API client module in `tenant-web/src/lib/api/` if new endpoints needed
4. Add domain-specific components in `tenant-web/src/components/common/` or co-located with page

**New Frontend Page (admin-web):**
1. Create route directory under `admin-web/src/app/`
2. Add `page.tsx`
3. Use admin API client from `admin-web/src/lib/api/admin-client.ts`
4. Add components in `admin-web/src/components/`

**New Shared UI Component:**
1. Add component source in `packages/shared-ui/src/components/`
2. Export from `packages/shared-ui/src/components/index.ts`
3. Import in consuming app via `@apartment-ultra/shared-ui`

**New API Type:**
1. Add type definitions in appropriate file under `packages/api-contract/src/` (e.g., `apartments.ts` for apartment-related types)
2. Re-export from `packages/api-contract/src/index.ts`
3. Import in api and frontend from `@apartment-ultra/api-contract`

## Special Directories

**api/prisma/:**
- Purpose: Database schema and migrations
- Contains: `schema.prisma` (single source of truth for schema), migrations folder (if any)
- Generated: Prisma Client auto-generated from schema
- Committed: Yes, schema is committed; generated client is in `node_modules`

**api/_deprecated/:**
- Purpose: Legacy code pending migration or removal
- Committed: Yes (preserved for reference)
- Do not add new code here

**packages/api-contract/src/:**
- Purpose: Canonical TypeScript type definitions shared between api and frontends
- Contains: One file per domain (auth, organizations, apartments, tenants, etc.)
- Compiled: Yes, generates `dist/` for consumption
- Committed: Yes

**e2e/results/:**
- Purpose: Playwright test reports and screenshots
- Generated: Yes
- Committed: No (should be gitignored)

**docs/superpowers/:**
- Purpose: Long-term product capability planning and specs
- Committed: Yes

---

*Structure analysis: 2026-03-19*
