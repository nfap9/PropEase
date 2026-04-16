import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock prisma before importing
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    organizationSubscription: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    serviceProduct: {
      findFirst: vi.fn(),
    },
    organizationMember: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import {
  getEffectiveServiceForOrg,
  orgHasActiveSubscription,
} from './orgPlanLimits.js';
import { prisma } from '../lib/prisma.js';

describe('orgPlanLimits', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getEffectiveServiceForOrg', () => {
    it('should return subscribed service when active subscription exists', async () => {
      const mockService = {
        id: 'svc-1',
        code: 'pro',
        name: 'Pro Plan',
        max_organizations: 10,
        max_apartments: 50,
        max_rooms: 500,
        max_members: 100,
      };
      const mockSub = {
        id: 'sub-1',
        organization_id: 'org-1',
        service_id: 'svc-1',
        status: 'active',
        started_at: new Date('2024-01-01'),
        expires_at: new Date('2025-12-31'),
        service: mockService,
      };

      vi.mocked(prisma.organizationSubscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(prisma.serviceProduct.findFirst).mockResolvedValue(null);

      const result = await getEffectiveServiceForOrg('org-1');

      expect(result?.code).toBe('pro');
    });

    it('should return free service when no active subscription', async () => {
      const mockFreeService = {
        id: 'svc-free',
        code: 'free',
        name: 'Free Plan',
        max_organizations: 1,
        max_apartments: 1,
        max_rooms: 100,
        max_members: 1,
      };

      vi.mocked(prisma.organizationSubscription.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.serviceProduct.findFirst).mockResolvedValue(mockFreeService as any);

      const result = await getEffectiveServiceForOrg('org-1');

      expect(result?.code).toBe('free');
    });

    it('should return null when no subscription and no free service', async () => {
      vi.mocked(prisma.organizationSubscription.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.serviceProduct.findFirst).mockResolvedValue(null);

      const result = await getEffectiveServiceForOrg('org-1');

      expect(result).toBeNull();
    });
  });

  describe('orgHasActiveSubscription', () => {
    it('should return false when no subscription', async () => {
      vi.mocked(prisma.organizationSubscription.findUnique).mockResolvedValue(null);

      const result = await orgHasActiveSubscription('org-1');

      expect(result).toBe(false);
    });

    it('should return true when active subscription exists', async () => {
      const mockSub = {
        id: 'sub-1',
        organization_id: 'org-1',
        status: 'active',
        started_at: new Date('2024-01-01'),
        expires_at: new Date('2025-12-31'),
        service: { code: 'pro' },
      };

      vi.mocked(prisma.organizationSubscription.findUnique).mockResolvedValue(mockSub as any);

      const result = await orgHasActiveSubscription('org-1');

      expect(result).toBe(true);
    });

    it('should return false when subscription is expired', async () => {
      // Use a status that is not active
      vi.mocked(prisma.organizationSubscription.findUnique).mockResolvedValue({
        id: 'sub-1',
        organization_id: 'org-1',
        status: 'expired',
        started_at: new Date('2020-01-01'),
        expires_at: new Date('2020-12-31'),
        service: { code: 'pro' },
      } as any);

      const result = await orgHasActiveSubscription('org-1');

      expect(result).toBe(false);
    });
  });
});
