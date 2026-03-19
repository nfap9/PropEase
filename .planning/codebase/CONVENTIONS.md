# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- TypeScript source files: `kebab-case.ts` (e.g., `auth.service.ts`, `bill.repo.ts`)
- Test files: Co-located with `.test.ts` suffix (e.g., `auth.service.test.ts`)
- E2E test files: `*.spec.ts` in `e2e/` directory
- Configuration files: `camelCase` or standard convention (e.g., `vitest.config.ts`, `eslintrc.next.json`)
- React components: PascalCase (e.g., `SidebarMenu.tsx`, `DataTable.tsx`)

**Directories:**
- Generally `kebab-case` (e.g., `repositories/`, `middlewares/`, `tenant-web/`)

**Functions and Variables:**
- `camelCase` for local variables and function parameters
- Example: `createBillService`, `getUserById`, `orgId`, `mockBill`

**Types and Interfaces:**
- PascalCase for types/interfaces
- Example: `AuthService`, `RegisterInput`, `CreateBillInput`, `AppError`
- Database entities from Prisma use `PascalCase` (e.g., `User`, `Apartment`)

**Database/API Fields:**
- `snake_case` for all database columns and API request/response fields
- Example: `organization_id`, `full_name`, `bill_year`, `paid_amount`
- Enforced by TypeScript `strict` mode and `noImplicitReturns`

## Code Style

**Formatting:**
- Tool: Prettier
- Config: `.prettierrc` at project root
- Settings:
  - `semi: true`
  - `singleQuote: true`
  - `tabWidth: 2`
  - `trailingComma: "es5"`
  - `printWidth: 120`
  - `plugins: ["prettier-plugin-tailwindcss"]`

**Linting:**
- Tool: ESLint with Next.js config
- Config: `.eslintrc.next.json` (extends `next/core-web-vitals` + `next/typescript`)
- API package runs `pnpm lint` targeting `src/**/*.ts`
- Frontend packages use Next.js ESLint integration

**TypeScript:**
- Strict mode enabled globally (see `tsconfig.base.json`)
- `noUnusedLocals: true`, `noUnusedParameters: true` in API
- `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true` in API
- `skipLibCheck: true` to avoid Prisma/d.ts conflicts
- Avoid `any` -- prefer explicit types
- API uses `NodeNext` module resolution with `.js` extensions in imports
- Frontend uses Next.js path aliases (`@/*` maps to `./src/*`)

## Import Organization

**Order in source files:**
1. Node.js built-ins (rare, since it's browser/Next.js)
2. External packages (e.g., `express`, `vitest`, `bcryptjs`)
3. Workspace/internal packages (e.g., `@apartment-ultra/api-contract`)
4. Relative imports (e.g., `../utils/appError.js`, `./bill.repo.js`)

**Path Extensions:**
- API: Always include `.js` extension for ESM imports (`from './auth.service.js'`)
- Frontend: Omit extensions (Next.js handles resolution)

**Path Aliases:**
- `@/` maps to `./src/` in both API and frontend
- Frontend also has `@apartment-ultra/api-contract` pointing to `packages/api-contract/src/index.ts`

**Barrel Files:**
- `index.ts` files used for re-exporting public APIs per module
- Example: `api/src/errors/index.ts` exports from `base.ts` and `domain.ts`

## Error Handling

**Backend (API):**
- New errors: Use `AppError` class from `api/src/errors/base.ts`
- Legacy code: Uses `createAppError()` from `api/src/utils/appError.ts`
- AppError provides: `code` (string), `statusCode`, `message`, `details`, `fieldErrors`
- Business codes from `@apartment-ultra/api-contract` (`BusinessCode` enum)
- Error response format: `{ code: number, message: string, data?: any }`
- Error handler middleware at `api/src/middlewares/errorHandler.ts`

**Frontend:**
- Uses `sonner` for toast notifications (lightweight)
- API errors parsed from response body

## Logging

**Backend:**
- `console.error` for unexpected errors (logged in errorHandler)
- No structured logging library currently in use

**Frontend:**
- `console.log/error` sparingly; prefer React DevTools

## Comments

**When to Comment:**
- Per CLAUDE.md: "优先写自解释代码；仅在'意图不明显'时加简短注释"
- Use JSDoc for exported functions and complex types

**JSDoc Usage:**
- Common on exported service functions and interfaces
- Example: `/** Creates bill input */`, `/** 登录输入（仅支持密码登录） */`

## Function Design

**Size:** No strict limit; prefer small, focused functions

**Parameters:**
- Use dependency injection via factory functions (e.g., `createAuthService(getRepo)`)
- Repositories injected as factory functions `() => AuthRepository`
- Input types defined as interfaces (e.g., `CreateBillInput`)

**Return Values:**
- Always `async` for service/repo methods
- Never `null` -- use `undefined` or explicit `null` with type `T | null`

## Module Design

**API Layer Structure:**
```
src/
  services/     # Business logic
  repositories/ # Data access
  middlewares/  # Express middleware
  utils/        # Pure utilities
  errors/       # Error classes
  lib/          # Prisma client, config
  constants/    # Constants and enums
  messages/     # User-facing messages
```

**Exports:**
- Use named exports; avoid default exports for utilities
- Factory function pattern for services: `createXxxService()` returns interface `XxxService`

**Frontend (Next.js):**
- App Router with React Server Components where possible
- Client components explicitly marked with `'use client'`
- Shared UI in `packages/shared-ui/`
- Web API client in `packages/web-api-client/`

---

*Convention analysis: 2026-03-19*
