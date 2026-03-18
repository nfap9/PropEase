# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

### Backend (API)

**Runner:** Vitest 1.6.0

**Config:** `api/vitest.config.ts`
```typescript
export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/test/**', 'src/index.ts', 'src/lib/prisma.ts'],
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

### Frontend (tenant-web, admin-web)

**Runner:** Vitest with React testing

**Config:** `tenant-web/vitest.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globals: true,
    coverage: { provider: 'v8', ... },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

### Run Commands

```bash
# Backend tests
pnpm --filter apartment-ultra-api run test        # Run once
pnpm --filter apartment-ultra-api run test:watch  # Watch mode

# Frontend tests
pnpm --filter apartment-ultra-tenant run test:run      # Run once
pnpm --filter apartment-ultra-tenant run test:coverage # With coverage

# All tests
pnpm test
```

## Test File Organization

### Location

Tests are **co-located** with source files:
```
api/src/services/
├── auth.service.ts
├── auth.service.test.ts
├── bill.service.ts
└── bill.service.test.ts
```

### Naming

- Test files: `*.test.ts` (not `*.spec.ts`)
- Description files: `*.test.ts` alongside the file being tested

### Test Directory

Shared test utilities: `api/src/test/` and `tenant-web/src/test/`

## Test Structure

### Backend Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthService, type AuthService } from './auth.service.js';
import type { AuthRepository } from '../repositories/auth.repo.js';

// Mock dependencies BEFORE importing
vi.mock('../utils/security.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password_123'),
  verifyPassword: vi.fn(),
}));

vi.mock('../utils/jwt.js', () => ({
  createAccessToken: vi.fn(),
  createRefreshToken: vi.fn(),
  decodeToken: vi.fn(),
}));

// Import after mocking
import { hashPassword, verifyPassword } from '../utils/security.js';

describe('AuthService', () => {
  // Mock repository interface
  const mockAuthRepo: AuthRepository = {
    findUserByPhone: vi.fn(),
    findUserById: vi.fn(),
    createUser: vi.fn(),
  };

  let service: AuthService;

  const sampleUser: User = { ... };

  beforeEach(() => {
    vi.clearAllMocks();
    service = createAuthService(() => mockAuthRepo);
  });

  describe('register', () => {
    it('should throw error when phone already registered', async () => {
      vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);

      await expect(service.register(registerInput)).rejects.toMatchObject({
        statusCode: 400,
        message: '手机号已注册',
      });
    });
  });
});
```

### Frontend Pattern

```typescript
import { describe, it, expect, vi } from 'vitest';
import { filterEmptyStrings, setFormErrors } from './form';

describe('form utils', () => {
  describe('filterEmptyStrings', () => {
    it('removes empty string values from object', () => {
      const input = { name: 'test', email: '' };
      const result = filterEmptyStrings(input);
      expect(result).toEqual({ name: 'test' });
    });
  });
});
```

## Mocking

### Framework: Vitest (vi.fn())

### Backend Mocks

**Mock Prisma in setup:**
```typescript
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    subscriptionPlan: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // ... other models
  },
}));
```

**Mock with return values:**
```typescript
vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);
vi.mocked(hashPassword).mockResolvedValue('hashed_password');
```

**Spy on existing functions:**
```typescript
vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);
```

### Frontend Mocks

**Mock Next.js router:**
```typescript
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

**Mock localStorage:**
```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
```

### What to Mock

- External services (JWT, security utils)
- Database (Prisma client)
- Third-party libraries (Next.js router, axios)
- Time-dependent logic (use fake timers)

### What NOT to Mock

- Simple utility functions being tested
- Internal business logic
- Domain objects and types

## Fixtures and Factories

### Inline Test Data

Create sample objects in each test file:
```typescript
const sampleUser: User = {
  id: '01hqtestuser0000001',
  phone: '13800138000',
  full_name: '测试用户',
  password_hash: 'hashed_password',
  is_active: true,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
};
```

### Global Test IDs

Setup in `api/src/test/setup.ts`:
```typescript
global.testOrgId = '01HQTESTORG000000001';
global.testUserId = '01HQTESTUSER0000001';
```

## Coverage

### Requirements: No enforced target

Coverage is available but not mandated.

### View Coverage

```bash
# Backend
pnpm --filter apartment-ultra-api run test:coverage

# Frontend
pnpm --filter apartment-ultra-tenant run test:coverage
```

### Coverage Exclusions

**Backend:**
- `src/**/*.d.ts` - Type definitions
- `src/test/**` - Test files
- `src/index.ts` - Entry point
- `src/lib/prisma.ts` - Database client

**Frontend:**
- `src/**/*.d.ts`
- `src/**/index.ts`
- `src/test/**`
- `src/types/**`

## Test Types

### Unit Tests

**Scope:** Individual services, utilities, repositories

**Approach:** Mock dependencies, test business logic in isolation

**Examples:**
- `api/src/services/auth.service.test.ts`
- `api/src/utils/jwt.test.ts`
- `tenant-web/src/lib/utils/form.test.ts`

### Integration Tests

**Scope:** Middleware chains, route handlers

**Approach:** Test actual middleware composition

**Examples:**
- `api/src/middlewares/errorHandler.test.ts`
- `api/src/middlewares/requireAuth.test.ts`

### E2E Tests

**Framework:** Playwright

**Config:** `playwright.config.ts`

**Commands:**
```bash
pnpm test:e2e           # Run all E2E tests
pnpm test:e2e:ui        # Run with UI
pnpm test:e2e:debug     # Debug mode
pnpm test:e2e:headed   # Run with browser visible
pnpm test:e2e:report    # Show HTML report
```

## Common Patterns

### Async Testing

```typescript
it('should register user successfully', async () => {
  const result = await service.register(registerInput);
  expect(result).toMatchObject({ id: '01hqtestuser0000001' });
});
```

### Error Testing

```typescript
it('should throw error when phone already registered', async () => {
  vi.mocked(mockAuthRepo.findUserByPhone).mockResolvedValue(sampleUser);

  await expect(service.register(registerInput)).rejects.toMatchObject({
    statusCode: 400,
    message: '手机号已注册',
  });
});
```

### Mocking Time

Setup in `api/src/test/setup.ts`:
```typescript
const now = new Date('2024-01-01T00:00:00Z');
vi.useFakeTimers();
vi.setSystemTime(now);
```

### Cleanup

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

*Testing analysis: 2026-03-18*
