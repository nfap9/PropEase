# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

### Files

**Backend (API):**
- Services: `*.service.ts` (e.g., `auth.service.ts`, `bill.service.ts`)
- Repositories: `*.repo.ts` (e.g., `auth.repo.ts`, `bill.repo.ts`)
- Middlewares: `*.ts` (e.g., `errorHandler.ts`, `requireAuth.ts`)
- Utils: `*.ts` (e.g., `security.ts`, `jwt.ts`)
- Types: `*.types.ts`
- Tests: `*.test.ts` (co-located with source)

**Frontend (Next.js):**
- Components: `*.tsx` (PascalCase, e.g., `DataTable.tsx`, `OrgSelector.tsx`)
- Utils/Hooks: `*.ts` (e.g., `form.ts`, `useAuth.ts`)
- Tests: `*.test.ts` (co-located with source)

### Functions

- Service factory functions: `createXxxService` (e.g., `createAuthService`)
- Repository factory functions: `createXxxRepository` (e.g., `createAuthRepository`)
- Hooks: `useXxx` (e.g., `useAuth`, `useMutation`)
- Boolean getters: `isXxx`, `hasXxx`, `canXxx` (e.g., `isActive`, `hasPermission`)

### Variables

- Database/API fields: `snake_case` (e.g., `user_id`, `created_at`, `full_name`)
- Local variables/function params: `camelCase` (e.g., `userId`, `fullName`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`)

### Types

- Interfaces: `PascalCase` (e.g., `AuthService`, `RegisterInput`)
- Type aliases: `PascalCase` (e.g., `UserInfo`, `LoginResult`)
- Enum members: `PascalCase` (e.g., `BusinessCode.BAD_REQUEST`)

## Code Style

### Formatting

**Tool:** Prettier

**Settings in `.prettierrc`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 120,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Format commands:**
```bash
pnpm format          # Format all source files
pnpm format:check    # Check formatting without writing
```

### Linting

**Backend (API):** ESLint with TypeScript

**Config:** `api/.eslintrc.cjs`
```javascript
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**Frontend (Next.js):** ESLint with Next.js recommended config

**Config:** `.eslintrc.next.json`
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

**Test files:** Relaxed rules (no-unused-vars and any allowed)

### TypeScript

**Strict mode:** Enabled in `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**No `any`:** ESLint rule enforces no explicit `any` type.

## Import Organization

### Order (Backend and Frontend)

1. Node built-ins (e.g., `path`, `fs`)
2. External packages (e.g., `express`, `react`, `@tanstack/react-query`)
3. Workspace packages (e.g., `@apartment-ultra/api-contract`, `@apartment-ultra/shared-ui`)
4. Relative imports - `@/` alias (e.g., `@/services/auth.service`)
5. Relative imports - relative paths (e.g., `../utils/security`)

### Path Aliases

Both API and tenant-web use `@` alias:
- API: `@/` maps to `api/src/`
- tenant-web: `@/` maps to `tenant-web/src/`

**Example:**
```typescript
import { AuthService } from '@/services/auth.service.js';
import type { DbClient } from '../types/repository.types.js';
```

### Import Extensions

- Backend: Use `.js` extension for TypeScript imports (ESM compatibility)
- Frontend: No extension needed

## Error Handling

### Backend Pattern

Use `AppError` class from `@/errors`:
```typescript
import { AppError } from '@/errors/index.js';

throw new AppError({
  code: BusinessCode.BAD_REQUEST,
  message: '手机号已注册',
  statusCode: 400,
});
```

### Middleware Wrappers

Express routes use `asyncHandler` or `responseWrapper`:
```typescript
import { asyncHandler } from '@/middlewares/compose.js';

router.post('/register', asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.json(result);
}));
```

### Error Responses

Standard response format via `api-contract`:
```typescript
import { BusinessCode } from '@apartment-ultra/api-contract';

{
  code: BusinessCode.BAD_REQUEST,
  message: '错误信息',
  data?: { fieldErrors: [...] }
}
```

## Logging

**Backend:** Use `console.error` for errors, `console.log` for debug (simple approach)

**No structured logger currently in use.**

## Comments

### When to Comment

- JSDoc for public APIs and interfaces
- Explain business logic that is not obvious
- Document complex algorithm steps

### JSDoc Usage

```typescript
/**
 * 注册输入（无需短信验证）
 */
export interface RegisterInput {
  phone: string;
  full_name: string;
  password: string;
}

/**
 * 创建 Auth Service 实例
 */
export function createAuthService(
  getRepo: () => AuthRepository = () => defaultAuthRepo
): AuthService { ... }
```

### Deprecation Notes

```typescript
/**
 * 导出 AppError 以保持向后兼容
 * @deprecated 请使用 @/errors 中的 AppError 类
 */
export { AppError };
```

## Function Design

### Size Guidelines

- Keep functions focused and single-purpose
- Complex functions (>50 lines) should be split into smaller helpers

### Parameters

- Use typed interfaces for multiple parameters
- Use `Optional` pattern for optional fields
- Avoid more than 4-5 parameters; use options object if needed

### Return Values

- Always return typed values (not `any`)
- Use `Promise<T>` for async functions
- Return `null` or throw error for not found cases (not both)

## Module Design

### Exports

**Backend:** Named exports for interfaces and factory functions
```typescript
export interface AuthService { ... }
export function createAuthService(...): AuthService { ... }
export const defaultAuthRepo = createAuthRepository(prisma);
```

### Barrel Files

Use `index.ts` for re-exports in each directory:
```typescript
// services/index.ts
export * from './auth.service.js';
export * from './bill.service.js';
```

---

*Convention analysis: 2026-03-18*
