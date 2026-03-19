# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Layered Monolithic Architecture with pnpm Workspaces

The project is a pnpm workspaces monorepo containing a Node.js/Express API, two Next.js frontend apps (tenant-web, admin-web), an experimental Expo mobile client, and shared packages. It follows a clean three-layer separation within the API (routes, services, repositories) and a conventional Next.js App Router structure for frontends.

**Key Characteristics:**
- Monorepo with independent deployable packages sharing a common type contract
- REST API with versioned routes (`/api/v1/`)
- Prisma ORM with PostgreSQL, providing typed database access
- JWT authentication with refresh token flow
- Frontends use TanStack Query for data fetching and React Hook Form + Zod for validation
- Shared TypeScript types distributed via `@apartment-ultra/api-contract` package

## Layers

### API Layer (Express/TypeScript)

**Routes Layer (`api/src/routes/`):**
- Purpose: HTTP endpoint definitions and request routing
- Location: `api/src/routes/`
- Contains: Express Router files per domain (auth, apartments, tenants, etc.)
- Depends on: Services
- Used by: `api/src/index.ts` via `v1Router`

**Services Layer (`api/src/services/`):**
- Purpose: Business rules, permission checks, state validation, and flow orchestration
- Location: `api/src/services/`
- Contains: Domain services (apartment, tenant, lease, bill, etc.)
- Depends on: Repositories
- Used by: Routes
- Convention: Services should NOT write Prisma queries directly. They use repositories injected via `createXxxRepository(prisma)` or default repo instances. Transactions are opened at the service layer with `prisma.$transaction(...)`.

**Repositories Layer (`api/src/repositories/`):**
- Purpose: Data access abstraction over Prisma
- Location: `api/src/repositories/`
- Contains: One repo file per domain (apartment, tenant, bill, etc.)
- Pattern: Each repo accepts a Prisma client (transactional or default) as constructor parameter
- Convention: Repository unit tests mock at the repository layer, not Prisma itself

**Middleware Layer (`api/src/middlewares/`):**
- Purpose: Cross-cutting concerns (auth, response wrapping, error handling)
- Location: `api/src/middlewares/`
- Key files:
  - `responseWrapper.ts`: Wraps successful responses as `{ code: 0, data, message }`; skips `/health`, `/docs`, `/api-docs`, `/openapi.json`, `/api/v1/webhooks`
  - `errorHandler.ts`: Converts `AppError` instances to `{ code, message, data }` responses with appropriate HTTP status
  - Auth middleware: JWT verification and org context injection

**Errors Layer (`api/src/errors/`):**
- Purpose: Domain-specific error hierarchy
- Location: `api/src/errors/`
- Contains: `AppError` base class and typed subclasses (`AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ValidationError`, `ConflictError`, `BusinessError`, `BadRequestError`)
- Pattern: Each error has `statusCode`, `code` (business code), `message`, optional `data`, and `toResponse()` method

### Frontend Layers (Next.js App Router)

**Pages/Route Handlers (`src/app/`):**
- Purpose: Page rendering and server-side data fetching
- Location: `tenant-web/src/app/`, `admin-web/src/app/`
- Pattern: Server components for metadata and initial data; client components for interactivity
- Auth protection: `AuthGuard` component wraps protected pages

**API Client Layer (`src/lib/api/`, `packages/web-api-client/`):**
- Purpose: HTTP communication with the backend
- Location: `tenant-web/src/lib/api/`, `packages/web-api-client/src/`
- Implementation: Axios-based client with Bearer token injection, automatic token refresh, and `ApiError` class
- Uses: `@apartment-ultra/api-contract` for shared TypeScript types

**State Management:**
- Server state: TanStack Query (`useQuery`, `useMutation`)
- Client state: React `useState`/`useReducer`
- Auth state: Context-based (`AuthProvider`)
- Pattern: Query invalidation on mutations instead of manual cache updates

**Form Handling:**
- Library: React Hook Form + Zod
- Pattern: Zod schema defines validation, `zodResolver` connects to form
- API errors mapped to form fields via `setFormErrors` utility

## Data Flow

**Tenant Web Request Flow:**

1. User interacts with a React component
2. Component calls a TanStack Query hook (e.g., `useApartments`)
3. Hook calls the module API client (e.g., `apartmentsApi.list()`)
4. API client sends HTTP request with JWT Bearer token
5. API middleware verifies JWT and injects user/org context
6. Route handler calls service method
7. Service executes business logic, calls repository methods
8. Repository runs Prisma queries against PostgreSQL
9. Response unwraps: `{ code: 0, data }` becomes `data` in the Axios response
10. TanStack Query caches result and component re-renders

**Admin Web Request Flow:**
Same pattern, but uses `lib/api/admin-client.ts` which routes to `/admin/*` endpoints.

## Key Abstractions

**Repository Pattern:**
- Purpose: Encapsulate all Prisma database operations per domain entity
- Examples: `api/src/repositories/apartment.repo.ts`, `api/src/repositories/tenant.repo.ts`
- Pattern: Constructor accepts `PrismaClient` or transaction client; exposes typed async methods

**Service Pattern:**
- Purpose: Business logic orchestration and validation
- Examples: `api/src/services/apartment.service.ts`, `api/src/services/bill.service.ts`
- Pattern: Uses repository instances; handles permissions and state transitions; throws domain errors

**API Client Pattern (web):**
- Purpose: Typed HTTP client shared between tenant-web and admin-web
- Location: `packages/web-api-client/src/index.ts`
- Features: `createBrowserApiClient()` returns Axios instance with token storage (localStorage), auto-refresh, and `ApiError` class with field-level error support

**Auth Context Pattern:**
- Purpose: Provide user/organization state to React components
- Location: `tenant-web/src/lib/auth/context.tsx`
- Pattern: `useAuth()` hook returns `{ user, organization, isLoading }`

## Entry Points

**API Entry Point:**
- Location: `api/src/index.ts`
- Responsibilities: Initializes observability, sets up Express with CORS/JSON middleware, mounts response wrapper and error handler, registers routes (`/health`, `/api-docs`, `/openapi.json`, `/api/v1/*`), waits for database connection, verifies schema in dev mode, starts scheduler, listens on configured port

**Tenant Web Entry Point:**
- Root layout: `tenant-web/src/app/layout.tsx`
- Providers: `tenant-web/src/components/layout/providers.tsx` (QueryClientProvider, ThemeProvider, BrandConfigProvider, AuthProvider, Toaster)
- Auth guard: `tenant-web/src/components/layout/auth-guard.tsx`

**Admin Web Entry Point:**
- Root layout: `admin-web/src/app/layout.tsx`
- Providers: Similar to tenant-web but uses `AdminAuthLayout` instead of tenant `AuthGuard`
- Admin client: `admin-web/src/lib/api/admin-client.ts`

**Mobile Entry Point:**
- Expo project in `mobile/`
- Entry: `mobile/app/` directory with file-based routing
- Services: `mobile/services/api/` for API communication

## Error Handling

**Strategy:** Domain-specific error classes with business code mapping

**Patterns:**
- Backend: `AppError` subclasses thrown from services; middleware converts to `{ code, message, data }` JSON response
- Frontend: `ApiError` class from `web-api-client` with `code`, `message`, `fieldErrors[]`, helper methods `isValidationError()` and `getFieldError(field)`
- Form integration: `setFormErrors(setError, error)` maps server field errors to React Hook Form fields
- Unauthenticated: Client redirects to login page automatically via Axios interceptor

## Cross-Cutting Concerns

**Logging:** Observability layer in `api/src/observability/` initialized at app startup (must be imported first in `index.ts`)

**Validation:** Zod schemas validate request bodies and query parameters at the route/service boundary

**Authentication:** JWT (HS256) via `src/utils/jwt.ts`; tokens stored in localStorage on the client; refresh token flow via `/auth/refresh` endpoint

**Authorization:** Permission system via `api/src/services/permission.service.ts`; org-scoped data access via `orgContext` middleware

**Scheduling:** Background jobs in `api/src/scheduler/` (notification checks, monthly bill generation)

---

*Architecture analysis: 2026-03-19*
