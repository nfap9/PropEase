# Codebase Structure

**Analysis Date:** 2026-03-18

## Directory Layout

```
apartment-ultra/
├── api/                    # Node/Express backend
├── tenant-web/            # Tenant-facing Next.js app
├── admin-web/             # Admin-facing Next.js app
├── mobile/                # React Native/Expo mobile app
├── packages/              # Shared packages
│   ├── api-contract/      # API types and Zod schemas
│   ├── shared/            # Shared utilities
│   ├── shared-ui/         # Reusable React components
│   └── web-api-client/    # Type-safe API client
├── docker/                # Docker configurations
├── docs/                  # Documentation
├── e2e/                   # E2E tests (Playwright)
└── scripts/               # Build/deploy scripts
```

## Directory Purposes

### Backend (api/)

**api/src/routes/**
- Purpose: Express route handlers
- Contains: Domain-specific route files (apartments.ts, tenants.ts, bills.ts)
- Key files: `api/src/routes/v1/index.ts` - main router aggregator

**api/src/services/**
- Purpose: Business logic layer
- Contains: Service classes/factories for each domain
- Key files: `apartment.service.ts`, `subscription.service.ts`, `bill.service.ts`

**api/src/repositories/**
- Purpose: Data access layer
- Contains: Prisma-based repository implementations
- Key files: `apartment.repo.ts`, `tenant.repo.ts`, `organization.repo.ts`

**api/src/middlewares/**
- Purpose: Express middleware
- Contains: Auth, error handling, response wrapping
- Key files: `requireAuth.ts`, `errorHandler.ts`, `responseWrapper.ts`

**api/src/lib/**
- Purpose: Library initialization
- Contains: Prisma client, utilities
- Key files: `prisma.ts` - Prisma client singleton

**api/prisma/**
- Purpose: Database schema
- Contains: `schema.prisma` - full database schema

### Frontend (tenant-web/)

**tenant-web/src/app/**
- Purpose: Next.js App Router pages
- Contains: Route-based pages with `page.tsx` and `layout.tsx`
- Structure:
  ```
  app/
  ├── apartments/       # Apartment management pages
  ├── tenants/         # Tenant pages
  ├── bills/           # Bill pages
  ├── login/           # Login page
  └── page.tsx        # Dashboard
  ```

**tenant-web/src/lib/api/**
- Purpose: API client layer
- Contains: Typed API functions wrapping the web-api-client
- Key files: `client.ts`, `apartments.ts`, `subscriptions.ts`

**tenant-web/src/components/**
- Purpose: React components
- Contains: Page-specific and shared components

**tenant-web/src/hooks/**
- Purpose: Custom React hooks
- Contains: Data fetching hooks, context providers

### Frontend (admin-web/)

**admin-web/src/app/**
- Purpose: Next.js App Router pages
- Structure: Similar to tenant-web with admin-specific routes
- Contains: `apartments/`, `bills/`, `dashboard/`, `settings/`

**admin-web/src/lib/api/**
- Purpose: API client for admin operations
- Contains: API calls specific to admin functionality

### Shared Packages (packages/)

**packages/api-contract/src/**
- Purpose: API type definitions
- Contains: Zod schemas and TypeScript interfaces for all API entities

**packages/shared-ui/src/**
- Purpose: Reusable UI components
- Contains: Button, Form, Layout components

**packages/web-api-client/src/**
- Purpose: Generated/type-safe API client
- Contains: `createBrowserApiClient`, request/response types

## Key File Locations

### Entry Points

- `api/src/index.ts`: Backend server entry
- `tenant-web/src/app/page.tsx`: Tenant web home
- `admin-web/src/app/page.tsx`: Admin web home

### Configuration

- `api/src/config.ts`: Backend configuration
- `api/prisma/schema.prisma`: Database schema
- `tenant-web/next.config.mjs`: Next.js configuration
- `admin-web/next.config.mjs`: Next.js configuration

### Database

- `api/prisma/schema.prisma`: Prisma schema definition

### Testing

- `api/src/*.test.ts`: Unit tests in same directory
- `e2e/`: Playwright E2E tests

## Naming Conventions

### Backend Files

- Services: `*.service.ts` (e.g., `apartment.service.ts`)
- Repositories: `*.repo.ts` (e.g., `apartment.repo.ts`)
- Routes: `*.ts` (e.g., `apartments.ts`)
- Middleware: `*.ts` (e.g., `requireAuth.ts`)
- Tests: `*.test.ts` (co-located)

### Frontend Files

- Pages: `page.tsx`, `layout.tsx`
- Components: `*.tsx` (PascalCase for components, camelCase for files)
- API: `*.ts` (e.g., `apartments.ts`)
- Hooks: `*.ts` (e.g., `useApartments.ts`)

### Database (snake_case)

- Tables: snake_case (e.g., `apartments`, `tenants`, `bills`)
- Columns: snake_case (e.g., `organization_id`, `created_at`)
- Prisma: snake_case in schema.prisma

## Where to Add New Code

### New Backend Feature

1. **Repository**: Create `api/src/repositories/[feature].repo.ts`
2. **Service**: Create `api/src/services/[feature].service.ts`
3. **Route**: Add to `api/src/routes/v1/[feature].ts`
4. **Test**: Add `api/src/services/[feature].service.test.ts`

### New Frontend Feature (tenant-web or admin-web)

1. **API Client**: Add to `tenant-web/src/lib/api/[feature].ts`
2. **Page**: Create `tenant-web/src/app/[feature]/page.tsx`
3. **Components**: Add to `tenant-web/src/components/[feature]/`
4. **Hook**: Add custom hooks to `tenant-web/src/hooks/`

### New Shared Component

1. **UI Component**: Add to `packages/shared-ui/src/components/`
2. **Export**: Update `packages/shared-ui/src/index.ts`

### New API Contract Type

1. **Types**: Add to `packages/api-contract/src/[feature].ts`
2. **Export**: Update `packages/api-contract/src/index.ts`

## Special Directories

**docker/**
- Purpose: Docker Compose configurations for local development
- Contains: Middleware services (PostgreSQL, Redis, etc.)

**docs/**
- Purpose: Project documentation, testing guidelines
- Contains: Testing cases, API contracts, design docs

**e2e/**
- Purpose: End-to-end tests
- Contains: Playwright test files

**scripts/**
- Purpose: Build and deployment scripts
- Contains: Utility scripts for CI/CD

---

*Structure analysis: 2026-03-18*
