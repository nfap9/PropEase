# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Multi-tenant SaaS Architecture with Layered Service Pattern

**Key Characteristics:**
- **Monorepo with pnpm workspaces**: Single repository containing API, frontend, and shared packages
- **Multi-tenant architecture**: Organization-based data isolation with tenant reachability system
- **Layered backend**: Repository pattern with service layer abstraction
- **REST API**: Express-based API with OpenAPI/Swagger documentation
- **Frontend**: Next.js App Router with server-side rendering

## Layers

### Backend (api/)

**Entry Layer:**
- Location: `api/src/index.ts`
- Responsibilities: Express app initialization, middleware registration, route mounting

**Route Layer:**
- Location: `api/src/routes/`
- Contains: Route handlers for each domain (apartments, tenants, bills, etc.)
- Depends on: Services layer
- Pattern: Express routers with middleware composition

**Service Layer:**
- Location: `api/src/services/`
- Contains: Business logic, transaction coordination, orchestration
- Depends on: Repository layer
- Example: `apartment.service.ts`, `subscription.service.ts`, `bill.service.ts`

**Repository Layer:**
- Location: `api/src/repositories/`
- Contains: Database queries, Prisma operations, data access abstraction
- Depends on: Prisma client (`api/src/lib/prisma.ts`)
- Example: `apartment.repo.ts`, `tenant.repo.ts`

**Database:**
- Prisma ORM with PostgreSQL
- Schema: `api/prisma/schema.prisma`

### Frontend (tenant-web/, admin-web/)

**Route Layer:**
- Location: `tenant-web/src/app/`, `admin-web/src/app/`
- Contains: Next.js App Router pages
- Pattern: File-based routing with `page.tsx`, `layout.tsx`

**Component Layer:**
- Location: `tenant-web/src/components/`, `admin-web/src/components/`
- Contains: React components, UI elements
- Uses: Shared UI components from `packages/shared-ui/`

**API Client Layer:**
- Location: `tenant-web/src/lib/api/`, `admin-web/src/lib/api/`
- Contains: API client wrappers, typed API functions
- Uses: `@apartment-ultra/web-api-client` package

**State/Data Layer:**
- Location: `tenant-web/src/hooks/`, `admin-web/src/hooks/`
- Contains: React Query hooks, custom hooks
- Pattern: TanStack Query for server state management

### Shared Packages (packages/)

**api-contract:**
- Location: `packages/api-contract/src/`
- Contains: TypeScript interfaces, Zod schemas for API requests/responses
- Used by: Both API and frontend for type consistency

**web-api-client:**
- Location: `packages/web-api-client/src/`
- Contains: Browser API client with type-safe methods
- Used by: `tenant-web`, `admin-web`

**shared-ui:**
- Location: `packages/shared-ui/src/`
- Contains: Reusable React components (buttons, forms, layouts)
- Used by: `tenant-web`, `admin-web`

**shared:**
- Location: `packages/shared/`
- Contains: Utilities, constants shared across packages

## Data Flow

**API Request Flow:**

1. Client sends HTTP request to `/api/v1/*`
2. Express middleware processes request (CORS, JSON parsing, auth)
3. Route handler validates request and calls service
4. Service executes business logic, coordinates repositories
5. Repository queries database via Prisma
6. Response flows back through middleware (error handler, response wrapper)

**Frontend Data Flow:**

1. User interaction triggers React component
2. Component calls API via typed client (`tenant-web/src/lib/api/`)
3. API client sends HTTP request to backend
4. React Query caches and manages server state
5. Component re-renders with new data

## Key Abstractions

**Service Factory Pattern:**
- Location: `api/src/services/*.service.ts`
- Pattern: `createXxxService(getRepo)` factory function
- Example:
  ```typescript
  export function createApartmentService(
    getRepo: () => ApartmentRepository = () => createApartmentRepository(prisma)
  ): ApartmentService { ... }
  ```

**Repository Pattern:**
- Location: `api/src/repositories/*.repo.ts`
- Pattern: Factory function accepting Prisma client, returns repository interface
- Example:
  ```typescript
  export function createApartmentRepository(db: DbClient): ApartmentRepository { ... }
  ```

**Middleware Composition:**
- Location: `api/src/middlewares/`
- Pattern: Higher-order functions for request processing
- Examples: `requireAuth.ts`, `requireAdmin.ts`, `responseWrapper.ts`

## Entry Points

**Backend:**
- `api/src/index.ts`: Express app entry, starts HTTP server on port 8000

**Frontend (tenant-web):**
- `tenant-web/src/app/page.tsx`: Home/dashboard page
- `tenant-web/src/app/login/page.tsx`: Login page

**Frontend (admin-web):**
- `admin-web/src/app/page.tsx`: Admin dashboard

## Error Handling

**Strategy:** Centralized error handling with custom error types

**Patterns:**
- Custom error class: `api/src/utils/appError.ts` creates typed errors
- Middleware: `api/src/middlewares/errorHandler.ts` catches and formats errors
- Response wrapper: `api/src/middlewares/responseWrapper.ts` standardizes success responses

## Cross-Cutting Concerns

**Authentication:** JWT-based with `requireAuth` middleware
**Authorization:** Permission-based with role checks in services
**Validation:** Zod schemas in `packages/api-contract/`
**Logging:** Observability module in `api/src/observability/`
**Configuration:** `api/src/config.ts` with environment variable loading

---

*Architecture analysis: 2026-03-18*
