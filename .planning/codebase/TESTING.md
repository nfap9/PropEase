# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework

**Backend (API):**
- Framework: Vitest
- Config: `api/vitest.config.ts`
- Environment: `node`
- Globals: Disabled (`globals: false`)
- Command: `pnpm test` (runs `vitest run` via `api/package.json`)

**Frontend (tenant-web/admin-web):**
- Framework: Vitest
- Config: `tenant-web/vitest.config.ts`
- Environment: `jsdom`
- Globals: Enabled (`globals: true`)
- Additional setup: `@testing-library/jest-dom`
- Command: `pnpm test` (via root aggregate)

**E2E:**
- Framework: Playwright
- Config: `playwright.config.ts`
- Test files: `e2e/**/*.spec.ts`
- Commands:
  - `pnpm test:e2e` -- run all
  - `pnpm test:e2e:ui` -- UI mode
  - `pnpm test:e2e:headed` -- headed browser

## Test File Organization

**Unit/Integration Tests:**
- Co-located with source files using `.test.ts` suffix
- Example: `api/src/services/bill.service.test.ts` alongside `api/src/services/bill.service.ts`
- Example: `tenant-web/src/lib/bills/share.test.ts` alongside `tenant-web/src/lib/bills/share.ts`

**E2E Tests:**
- All in `e2e/` directory
- Organized by feature: `e2e/auth/`, `e2e/bills/`, `e2e/apartments/`, etc.
- Shared fixtures in `e2e/fixtures/`
- Helpers in `e2e/helpers/`

**Test Setup Files:**
- API: `api/src/test/setup.ts`
- Frontend: `tenant-web/src/test/setup.ts`

## Test Structure

### Backend (Vitest)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('BillService', () => {
  // Mock dependencies
  const mockBillRepo: BillRepository = {
    findByOrgId: vi.fn(),
    findByIdWithRelations: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  let service: BillService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = createBillService(() => mockBillRepo, () => mockPaymentRepo);
  });

  describe('list', () => {
    it('should return bills by org', async () => {
      vi.mocked(mockBillRepo.findByOrgId).mockResolvedValue([mockBill] as any);
      const result = await service.list(orgId);
      expect(result).toHaveLength(1);
    });

    it('should throw 404 when not found', async () => {
      vi.mocked(mockBillRepo.findByOrgId).mockResolvedValue(null);
      await expect(service.list(orgId)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
```

**Key Patterns:**
- Use `describe` blocks to group by method/feature
- Use `describe` sub-blocks for individual methods
- `beforeEach` resets mocks and recreates the service under test
- Mock Prisma directly with `vi.mock()` at the top of the file
- Use `vi.mocked()` helper for typed mock assertions
- Use `as any` for complex nested Prisma relations in mock data

### Frontend (Vitest + React Testing Library)

```typescript
/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), ... }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('canAccessRule', () => {
  it('blocks organization-scoped pages when no organization is selected', () => {
    expect(canAccessRule({ requiresOrganization: true }, context)).toBe(false);
  });
});
```

### E2E (Playwright)

```typescript
import { test, expect } from '../fixtures';
import { login, logout } from '../helpers/auth';

test.describe('登录页面', () => {
  test('登录页面应该正常加载', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();
  });

  test('成功登录后跳转到首页', async ({ page }) => {
    await login(page);
    expect(page.url()).toMatch(/\/(dashboard|apartments|rooms)/);
  });
});
```

## Mocking

**Framework:** Vitest's `vi` (API) and `vi` (frontend)

**Mocking Prisma (API):**
```typescript
// In setup.ts -- global mock
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    subscriptionPlan: { findMany: vi.fn(), findFirst: vi.fn(), ... },
    organizationSubscription: { ... },
  },
}));

// Per-test local mock
vi.mock('../lib/prisma.js', () => ({
  prisma: { lease: { findFirst: vi.fn() } },
}));
```

**Mocking External Libraries:**
```typescript
vi.mock('ulid', () => ({
  ulid: vi.fn(() => '01HQTESTAPT000001'),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), ... }),
}));
```

**Mocking Utilities:**
```typescript
vi.mock('../utils/jwt.js', () => ({
  createAccessToken: vi.fn(),
  createRefreshToken: vi.fn(),
  decodeToken: vi.fn(),
}));
```

**Mocking Services:**
```typescript
const mockBillRepo: BillRepository = {
  findByOrgId: vi.fn(),
  create: vi.fn().mockResolvedValue(mockBill as any),
};
```

**Spying on Console (Error Handler Tests):**
```typescript
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { consoleErrorSpy.mockRestore(); });
```

## Fixtures and Factories

**Test Data Pattern:**
```typescript
const mockBill = {
  id: '01HQTESTBILL00001',
  lease_id: leaseId,
  bill_year: 2024,
  bill_month: 1,
  due_date: new Date('2024-01-31'),
  rent_amount: 2000,
  water_amount: 50,
  electricity_amount: 200,
  other_amount: 0,
  total_amount: 2250,
  paid_amount: 0,
  status: 'unpaid',
  notes: '测试账单',
  created_at: new Date(),
  updated_at: new Date(),
};

const mockBillWithRelations = {
  ...mockBill,
  lease: mockLease,
  payments: [],
};
```

**Global Test IDs (E2E):**
```typescript
import { AUTH } from '../testids';
// Usage: page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)
```

**Global Test Utilities (API setup.ts):**
```typescript
declare global {
  var testOrgId: string;
  var testUserId: string;
}
global.testOrgId = '01HQTESTORG000000001';
global.testUserId = '01HQTESTUSER0000001';
```

## Coverage

**Backend (API):**
- Provider: v8
- Reporters: `['text', 'json', 'html']`
- Excluded: `src/**/*.d.ts`, `src/test/**`, `src/index.ts`, `src/lib/prisma.ts`
- Run coverage: `vitest run --coverage`

**Frontend (tenant-web):**
- Provider: v8
- Reporters: `['text', 'json', 'html']`
- Excluded: `src/**/*.d.ts`, `src/**/index.ts`, `src/test/**`, `src/types/**`
- Run coverage: `vitest run --coverage`

**E2E:**
- Playwright built-in tracing: `trace: 'on-first-retry'`
- Screenshots on failure: `screenshot: 'only-on-failure'`
- Video in CI: `video: process.env.CI ? 'on-first-retry' : 'off'`

## Test Types

**Unit Tests:**
- Target: Individual service methods, utility functions, middleware
- Location: Co-located `.test.ts` files
- Mock: Repositories, Prisma client, external utilities

**Integration Tests (Repository):**
- Test repository methods against mocked Prisma client
- Use `vi.mock` for Prisma, pass mockDb to factory functions

**E2E Tests:**
- Full browser automation via Playwright
- Use `page.goto()`, `page.click()`, `page.fill()`
- Assertions via `@playwright/test` matchers and `expect`
- Data-testid attributes for stable selectors
- Helpers: `login()`, `logout()`, `isAuthenticated()` in `e2e/helpers/`

## Common Patterns

**Async Testing:**
```typescript
it('should create bill when lease belongs to org', async () => {
  vi.mocked(mockBillRepo.create).mockResolvedValue(mockBill as any);
  const result = await service.create(orgId, input);
  expect(result).toEqual(mockBill);
});
```

**Error Testing:**
```typescript
it('should throw 404 when bill not found', async () => {
  vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(null);
  await expect(service.getById(orgId, billId)).rejects.toMatchObject({
    statusCode: 404,
  });
});
```

**Mock Reset:**
```typescript
beforeEach(() => {
  vi.resetAllMocks();
  service = createBillService(() => mockBillRepo);
});
```

**Mocking Dynamic Imports (for prisma):**
```typescript
const { prisma } = await import('../lib/prisma.js');
vi.mocked(prisma.lease.findFirst).mockResolvedValue(mockLease as any);
```

**Spy on Console:**
```typescript
vi.spyOn(console, 'error').mockImplementation(() => {});
```

**Mock localStorage (frontend):**
```typescript
Object.defineProperty(global, 'localStorage', {
  value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
});
```

---

*Testing analysis: 2026-03-19*
