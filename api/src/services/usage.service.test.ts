import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUsageService } from './usage.service.js';
import type { UsageRepository } from '../repositories/usage.repo.js';
import type { PlatformConfigRepository } from '../repositories/platformConfig.repo.js';
import type { UsageQuota, UsageQuotaOrder } from '@prisma/client';

describe('UsageService', () => {
  const mockQuota: UsageQuota = {
    id: 'quota-1',
    user_id: 'user-1',
    orgs: 5,
    apartments: 10,
    rooms: 50,
    members: 25,
    valid_from: new Date('2024-01-01'),
    valid_to: new Date('2025-12-31'),
    created_at: new Date(),
  };

  const mockOrder: UsageQuotaOrder = {
    id: 'order-1',
    order_no: 'USG1234567890',
    user_id: 'user-1',
    orgs: 1,
    apartments: 2,
    rooms: 10,
    members: 5,
    amount: 1000,
    status: 'pending',
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
    paid_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPlatformConfig = {
    id: 'config-1',
    is_default: true,
    usage_pricing: {
      price_per_org: 100,
      price_per_apartment: 50,
      price_per_room: 10,
      price_per_member: 5,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };

  const repo: UsageRepository = {
    findValidQuotas: vi.fn(),
    findOrderById: vi.fn(),
    findOrderByIdOnly: vi.fn(),
    findOrderByOrderNo: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
  };

  const platformConfigRepo: PlatformConfigRepository = {
    findDefault: vi.fn(),
    findById: vi.fn(),
  };

  const service = createUsageService(() => repo, () => platformConfigRepo);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getPricing', () => {
    it('should return pricing from platform config', async () => {
      vi.mocked(platformConfigRepo.findDefault).mockResolvedValue(mockPlatformConfig as any);

      const result = await service.getPricing();

      expect(result.price_per_org).toBe(100);
      expect(result.price_per_apartment).toBe(50);
      expect(result.price_per_room).toBe(10);
      expect(result.price_per_member).toBe(5);
    });

    it('should return zeros when pricing not configured', async () => {
      vi.mocked(platformConfigRepo.findDefault).mockResolvedValue(null);

      const result = await service.getPricing();

      expect(result.price_per_org).toBe(0);
      expect(result.price_per_apartment).toBe(0);
      expect(result.price_per_room).toBe(0);
      expect(result.price_per_member).toBe(0);
    });

    it('should handle partial pricing config', async () => {
      vi.mocked(platformConfigRepo.findDefault).mockResolvedValue({
        ...mockPlatformConfig,
        usage_pricing: { price_per_org: 100 },
      } as any);

      const result = await service.getPricing();

      expect(result.price_per_org).toBe(100);
      expect(result.price_per_apartment).toBe(0);
    });
  });

  describe('getQuota', () => {
    it('should sum all valid quotas for user', async () => {
      const today = new Date();
      vi.mocked(repo.findValidQuotas).mockResolvedValue([
        { ...mockQuota, orgs: 3, apartments: 5, rooms: 20, members: 10 },
        { ...mockQuota, id: 'quota-2', orgs: 2, apartments: 5, rooms: 30, members: 15 },
      ]);

      const result = await service.getQuota('user-1');

      expect(result.orgs).toBe(5);
      expect(result.apartments).toBe(10);
      expect(result.rooms).toBe(50);
      expect(result.members).toBe(25);
    });

    it('should return zeros when no quotas exist', async () => {
      vi.mocked(repo.findValidQuotas).mockResolvedValue([]);

      const result = await service.getQuota('user-1');

      expect(result).toEqual({ orgs: 0, apartments: 0, rooms: 0, members: 0 });
    });
  });

  describe('createOrder', () => {
    it('should throw error when all quantities are zero', async () => {
      await expect(service.createOrder('user-1', { orgs: 0, apartments: 0, rooms: 0, members: 0 })).rejects.toThrow('至少选择一种对象数量');
    });

    it('should throw error when pricing not configured', async () => {
      vi.mocked(platformConfigRepo.findDefault).mockResolvedValue(null);

      await expect(service.createOrder('user-1', { orgs: 1, apartments: 0, rooms: 0, members: 0 })).rejects.toThrow('按量定价未配置');
    });

    it('should throw error when amount is zero', async () => {
      vi.mocked(platformConfigRepo.findDefault).mockResolvedValue({
        ...mockPlatformConfig,
        usage_pricing: { price_per_org: 0, price_per_apartment: 0, price_per_room: 0, price_per_member: 0 },
      } as any);

      await expect(service.createOrder('user-1', { orgs: 1, apartments: 0, rooms: 0, members: 0 })).rejects.toThrow('订单金额必须大于 0');
    });

    it('should create order with correct amount', async () => {
      vi.mocked(platformConfigRepo.findDefault).mockResolvedValue(mockPlatformConfig as any);
      vi.mocked(repo.createOrder).mockResolvedValue(mockOrder);

      const result = await service.createOrder('user-1', {
        orgs: 1,
        apartments: 2,
        rooms: 10,
        members: 5,
      });

      expect(result.status).toBe('pending');
      expect(repo.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { connect: { id: 'user-1' } },
          orgs: 1,
          apartments: 2,
          rooms: 10,
          members: 5,
        })
      );
    });

    it('should calculate correct amount', async () => {
      vi.mocked(platformConfigRepo.findDefault).mockResolvedValue(mockPlatformConfig as any);
      vi.mocked(repo.createOrder).mockImplementation(async (data: any) => ({
        ...mockOrder,
        amount: data.amount,
      }));

      const result = await service.createOrder('user-1', {
        orgs: 1,
        apartments: 2,
        rooms: 10,
        members: 5,
      });

      // 1*100 + 2*50 + 10*10 + 5*5 = 100 + 100 + 100 + 25 = 325
      expect(result.amount).toBe(325);
    });
  });

  describe('getOrder', () => {
    it('should return order when found', async () => {
      vi.mocked(repo.findOrderById).mockResolvedValue(mockOrder);

      const result = await service.getOrder('user-1', 'order-1');

      expect(result.id).toBe('order-1');
    });

    it('should throw 404 when order not found', async () => {
      vi.mocked(repo.findOrderById).mockResolvedValue(null);

      await expect(service.getOrder('user-1', 'nonexistent')).rejects.toThrow('订单不存在');
    });
  });
});
