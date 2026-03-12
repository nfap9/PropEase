/**
 * 后端测试全局 setup
 *
 * 提供：
 * - 全局 mocks
 * - 测试工具函数
 */

import { vi } from 'vitest';

// Mock console.error to fail on unintended errors in tests
const originalConsoleError = console.error;
console.error = vi.fn((...args) => {
  // Ignore Vitest internal warnings
  if (args[0]?.includes?.('[vitest]')) return;
  originalConsoleError(...args);
});

// Mock process.env for tests
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

// Mock Prisma Client
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
    organizationSubscription: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subscriptionOrder: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    planPricing: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock Date to have predictable timestamps
const now = new Date('2024-01-01T00:00:00Z');
vi.useFakeTimers();
vi.setSystemTime(now);

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var testOrgId: string;
  // eslint-disable-next-line no-var
  var testUserId: string;
}
global.testOrgId = '01HQTESTORG000000001';
global.testUserId = '01HQTESTUSER0000001';
