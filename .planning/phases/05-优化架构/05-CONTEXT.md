# Phase 5: 优化架构 - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Architectural optimization addressing four areas of technical debt: API route structure, permission system duplication, frontend code sharing, and logging/observability. All changes are refactoring — no new user-facing features. Depends on Phase 4 (route groups, collapsible sidebar, login refresh).

</domain>

<decisions>
## Implementation Decisions

### Area 1: API Route Refactoring

#### Approach
- **Thin routes + fat controllers**: Extract handler logic into controller files. Routes become thin routing definitions (5-10 lines each): mount router, apply middleware, delegate to controller.
- **Controller location**: `api/src/routes/v1/apartments.controller.ts` (alongside `apartments.ts` route file), same pattern for all refactored resources.

#### Scope
Refactor these files:
- `api/src/routes/v1/apartments.ts` (1,136 lines) → `apartments.controller.ts`
- `api/src/routes/v1/organizations.ts` (782 lines) → `organizations.controller.ts`
- `api/src/routes/v1/bills.ts` (639 lines) → `bills.controller.ts`
- `api/src/routes/v1/subscriptions.ts` (614 lines) → `subscriptions.controller.ts`
- `api/src/routes/v1/admin/index.ts` (469 lines, 31+ try/catch) → `admin.controller.ts`

Service files (god service files):
- `api/src/services/admin.service.ts` (665 lines)
- `api/src/services/tenantReachability.service.ts` (633 lines)
- `api/src/services/utility.service.ts` (598 lines)
- `api/src/services/service-product.service.ts` (541 lines)
- `api/src/repositories/service-product.repo.ts` (611 lines)

#### Schemas
- Zod schemas stay with their respective controllers (`.controller.ts` exports schemas alongside handlers)
- No new `schemas/` directory — keep it simple

#### Pattern
Each controller file:
```typescript
// exports: handler functions + schemas
export async function list(req: Request, res: Response, next: NextFunction) { ... }
export async function create(req: Request, res: Response, next: NextFunction) { ... }

// route file becomes thin:
router.get('/', list);
router.post('/', create);
```

### Area 2: Permission System DRY

#### Approach
- **api-contract as single source**: Define permission codes in `packages/api-contract/src/permissions.ts`
- API and both frontends import permission codes from api-contract
- Single source of truth — no drift between backend and frontend

#### Scope
Shared in api-contract:
- `RESOURCES` constant (`apartment`, `room`, `tenant`, `lease`, `bill`, `utility`, `member`, `settings`, `report`)
- `ACTIONS` constant (`view`, `create`, `edit`, `delete`, `export`)
- All permission strings (e.g., `apartment:view`, `bill:create`)

NOT shared (stay per-app):
- Human-readable labels (RESOURCE_NAMES, UI labels)
- Admin permission options (admin:user:read, etc.) — different system
- Permission enforcement logic (service layer)

#### Files to update
- `api/src/constants/permissionDefaults.ts` → import from api-contract
- `tenant-web/src/lib/constants/admin-permissions.ts` → import codes from api-contract
- `tenant-web/src/lib/permission-access.ts` → import codes from api-contract
- `api/src/services/permission.service.ts` → import codes from api-contract

### Area 3: Frontend DRY — API Client

#### Approach
- **Unify via web-api-client**: `packages/web-api-client/` becomes the single API client used by both tenant-web and admin-web
- Both apps configure the same client with different base URLs and auth storage keys
- Underlying client (interceptors, error handling, token refresh) is shared

#### Scope
- `packages/web-api-client/src/index.ts` → expand to support both tenant and admin configurations
- `tenant-web/src/lib/api.ts` → use web-api-client instead of inline axios setup
- `admin-web/src/lib/api/admin-client.ts` → use web-api-client instead of separate client
- Response types from api-contract, error handling via `ApiError` class

#### What stays per-app
- Auth storage keys (different localStorage keys per app)
- Base URLs (tenant: `/api/v1/`, admin: `/admin/api/v1/`)
- Per-app request interceptors (if any app-specific logic needed)

### Area 4: Logging & Observability

#### Approach
- **Structured logger (pino)**: Replace `console.error` / `console.log` with pino in production code
- Add request ID middleware (`req.id` generated and propagated)
- Audit logs stay as-is (stdout via console.log) — not in this phase's scope

#### Scope
- Services: `api/src/services/*.service.ts` (all service files)
- Scheduler: `api/src/scheduler/index.ts`, `api/src/scheduler/notificationChecks.ts`
- Audit utility: `api/src/utils/audit.ts` (replace console.log with structured logger)

NOT in scope:
- Route files (lower priority, too much churn)
- Other utility files (lower priority)

#### Logger configuration
- Use pino as the structured logger
- JSON output format (machine-readable)
- Log levels: error, warn, info, debug
- Include request ID in log context when available

### Phase Order
Recommended implementation order:
1. Permission system DRY (api-contract) — foundational, others depend on it
2. API client unification (shared-ui / web-api-client) — frontend shared infrastructure
3. API route refactoring — backend structural change
4. Logging — observability improvement (can run parallel to above)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API Route Structure
- `api/src/routes/v1/apartments.ts` — largest route file (1,136 lines, refactor target)
- `api/src/routes/v1/organizations.ts` — 782 lines, refactor target
- `api/src/routes/v1/bills.ts` — 639 lines, refactor target
- `api/src/routes/v1/subscriptions.ts` — 614 lines, refactor target
- `api/src/routes/v1/admin/index.ts` — 469 lines, refactor target
- `api/src/routes/v1/index.ts` — route mounting (will need updating after controller extraction)

### God Service Files
- `api/src/services/admin.service.ts` — 665 lines, refactor target
- `api/src/services/tenantReachability.service.ts` — 633 lines, refactor target
- `api/src/services/utility.service.ts` — 598 lines, refactor target
- `api/src/services/service-product.service.ts` — 541 lines, refactor target
- `api/src/repositories/service-product.repo.ts` — 611 lines, refactor target

### Permission System
- `api/src/constants/permissionDefaults.ts` — backend permission constants (current, to be replaced)
- `tenant-web/src/lib/constants/admin-permissions.ts` — frontend permission options
- `tenant-web/src/lib/permission-access.ts` — frontend permission access logic
- `api/src/services/permission.service.ts` — backend permission enforcement

### API Contract Package
- `packages/api-contract/src/index.ts` — existing exports
- `packages/api-contract/src/common.ts` — existing shared types pattern (reference for how to add permissions)

### Frontend API Clients
- `packages/web-api-client/src/index.ts` — existing API client (to be expanded)
- `tenant-web/src/lib/api.ts` — tenant-web current API setup (migrate to web-api-client)
- `admin-web/src/lib/api/admin-client.ts` — admin-web current API setup (migrate to web-api-client)

### Logging
- `api/src/services/bill.service.ts` — has console.error patterns (bill generation SMS failure)
- `api/src/scheduler/index.ts` — has console.log/console.error for scheduler events
- `api/src/utils/audit.ts` — has console.log for audit events (to use structured logger)

### Codebase Architecture Reference
- `.planning/codebase/ARCHITECTURE.md` — overall architecture, layer separation
- `.planning/codebase/CONCERNS.md` — technical debt inventory (source of all phase issues)
- `.planning/codebase/CONVENTIONS.md` — coding conventions

### Prior Phases
- Phase 4 CONTEXT: Route group architecture, collapsible sidebar decisions
- Phase 3 CONTEXT: Organization selection flow, API client usage patterns
- Phase 1 CONTEXT: Settings layout patterns

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `packages/api-contract/` — already exists, used for shared types, ready to host permission codes
- `packages/web-api-client/` — already exists, underlying axios client with interceptors ready for unification
- `packages/shared-ui/` — components, hooks, lib utilities already exported

### Established Patterns
- Repository pattern in API (data access via injected Prisma clients)
- Service layer business logic (uses repositories, throws domain errors)
- TanStack Query for frontend data fetching
- React Hook Form + Zod for form validation

### Integration Points
- Controller extraction changes route mounting in `api/src/routes/v1/index.ts`
- api-contract permission exports need to be imported by 4 files
- web-api-client needs to support tenant vs admin configuration
- pino logger needs to be initialized at API startup (`api/src/index.ts`)

</codebase_context>

<specifics>
## Specific Ideas

- "Keep it simple — schemas stay with controllers, don't create a new schemas/ directory"
- "pino for JSON structured logging — production-grade, fast"
- "web-api-client already exists — just needs to be properly used by both apps instead of inline axios setups"
- "Permission codes are the critical thing to share — labels are per-app UI concerns"

</specifics>

<deferred>
## Deferred Ideas

- Audit logs to DB table — future phase (separate from logging work)
- Request/response logging middleware — future phase
- Full observability pipeline (tracing, metrics) — future phase
- Frontend UI component sharing via shared-ui beyond API client — future phase
- Admin permission codes (admin:*) in api-contract — different system, lower priority

</deferred>

---

*Phase: 05-优化架构*
*Context gathered: 2026-03-19*
