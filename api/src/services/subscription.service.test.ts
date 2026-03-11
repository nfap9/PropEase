import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSubscriptionService,
  type SubscriptionService,
} from './subscription.service.js';
import type { SubscriptionRepository, SubscriptionWithPlan } from '../repositories/subscription.repo.js';
import type { SubscriptionPlan, OrganizationSubscription, SubscriptionOrder } from '@prisma/client';

// Mock ulid - use vi.fn with inline implementation to avoid reset issues
vi.mock('ulid', () => ({
  ulid: vi.fn(() => '01HQTESTSUB000001'),
}));

const samplePlan: SubscriptionPlan = {
  id: '01hqtestplan00000001',
  code: 'pro',
  name: '专业版',
  description: '专业版套餐',
  price_monthly: 99,
  price_yearly: 999,
  max_rooms: 100,
  max_members: 5,
  features: {},
  is_active: true,
  sort_order: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

const freePlan: SubscriptionPlan = {
  ...samplePlan,
  id: '01hqtestplan00000000',
  code: 'free',
  name: '免费版',
  price_monthly: 0,
  price_yearly: 0,
  sort_order: 0,
};

const higherPlan: SubscriptionPlan = {
  ...samplePlan,
  id: '01hqtestplan00000002',
  code: 'enterprise',
  name: '企业版',
  price_monthly: 299,
  price_yearly: 2999,
  sort_order: 2,
};

const sampleSubscription: SubscriptionWithPlan = {
  organization_id: '01hqtestorg000000001',
  plan_id: samplePlan.id,
  plan: samplePlan,
  status: 'active',
  start_date: new Date(),
  end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  auto_renew: true,
  next_plan_id: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const sampleOrder: SubscriptionOrder = {
  id: '01hqtestorder0000001',
  order_no: 'SUB1234567890',
  organization_id: '01hqtestorg000000001',
  plan_id: samplePlan.id,
  billing_cycle: 'monthly',
  amount: 99,
  status: 'pending',
  expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
  paid_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('SubscriptionService', () => {
  const mockRepo: SubscriptionRepository = {
    findActivePlans: vi.fn(),
    findPlanById: vi.fn(),
    findSubscriptionByOrgId: vi.fn(),
    createSubscription: vi.fn(),
    updateSubscription: vi.fn(),
    findOrderById: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
  };

  let service: SubscriptionService;

  const orgId = '01hqtestorg000000001';

  beforeEach(() => {
    vi.clearAllMocks();
    service = createSubscriptionService(() => mockRepo);
  });

  describe('listPlans', () => {
    it('should return active plans', async () => {
      vi.mocked(mockRepo.findActivePlans).mockResolvedValue([samplePlan]);

      const result = await service.listPlans();

      expect(mockRepo.findActivePlans).toHaveBeenCalled();
      expect(result).toEqual([samplePlan]);
    });
  });

  describe('getPlanById', () => {
    it('should return plan when found', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(samplePlan);

      const result = await service.getPlanById(samplePlan.id);

      expect(result).toEqual(samplePlan);
    });

    it('should throw 404 when plan not found', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(null);

      await expect(service.getPlanById('non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('getSubscription', () => {
    it('should return subscription with plan', async () => {
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);

      const result = await service.getSubscription(orgId);

      expect(result).toEqual(sampleSubscription);
    });

    it('should return null when no subscription', async () => {
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(null);

      const result = await service.getSubscription(orgId);

      expect(result).toBeNull();
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return default status when no subscription', async () => {
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(null);

      const result = await service.getSubscriptionStatus(orgId);

      expect(result).toEqual({
        has_subscription: false,
        plan: null,
        status: 'none',
        is_active: false,
        end_date: null,
        auto_renew: false,
        days_remaining: null,
      });
    });

    it('should calculate days_remaining correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const sub = { ...sampleSubscription, end_date: futureDate };
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sub);

      const result = await service.getSubscriptionStatus(orgId);

      expect(result.has_subscription).toBe(true);
      expect(result.is_active).toBe(true);
      expect(result.days_remaining).toBe(30);
    });

    it('should return 0 days_remaining when end_date is past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const sub = { ...sampleSubscription, end_date: pastDate };
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sub);

      const result = await service.getSubscriptionStatus(orgId);

      expect(result.is_active).toBe(false);
      expect(result.days_remaining).toBe(0);
    });

    it('should handle null end_date', async () => {
      const sub = { ...sampleSubscription, end_date: null };
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sub);

      const result = await service.getSubscriptionStatus(orgId);

      expect(result.is_active).toBe(true);
      expect(result.days_remaining).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should throw 404 when plan not found', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(null);

      await expect(service.subscribe(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw error for free plan', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(freePlan);

      await expect(service.subscribe(orgId, freePlan.id)).rejects.toMatchObject({
        statusCode: 400,
        message: '免费套餐仅在注册时自动开通，请通过付费套餐订阅',
      });
    });

    it('should throw error for downgrade', async () => {
      // Use a non-free lower tier plan to test downgrade
      const lowerPlan = {
        ...samplePlan,
        id: '01hqtestplan00000003',
        code: 'basic',
        name: '基础版',
        sort_order: 0, // lower than samplePlan's sort_order: 1
      } as SubscriptionPlan;
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(lowerPlan);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);

      await expect(service.subscribe(orgId, lowerPlan.id)).rejects.toMatchObject({
        statusCode: 400,
        message: '不支持降级到低等级套餐',
      });
    });

    it('should create new subscription when none exists', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(samplePlan);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(null);
      vi.mocked(mockRepo.createSubscription).mockResolvedValue(sampleSubscription);

      const result = await service.subscribe(orgId, samplePlan.id);

      expect(mockRepo.createSubscription).toHaveBeenCalled();
      expect(result).toEqual(sampleSubscription);
    });

    it('should update existing subscription', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(higherPlan);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);
      vi.mocked(mockRepo.updateSubscription).mockResolvedValue({
        ...sampleSubscription,
        plan_id: higherPlan.id,
      });

      const result = await service.subscribe(orgId, higherPlan.id);

      expect(mockRepo.updateSubscription).toHaveBeenCalled();
    });
  });

  describe('updateSubscription', () => {
    it('should throw 404 when plan not found', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(null);

      await expect(
        service.updateSubscription(orgId, 'non-existent', 'immediate')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw error for free plan', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(freePlan);

      await expect(
        service.updateSubscription(orgId, freePlan.id, 'immediate')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: '免费套餐不可通过此接口修改',
      });
    });

    it('should throw 404 when subscription not found', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(samplePlan);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(null);

      await expect(
        service.updateSubscription(orgId, samplePlan.id, 'immediate')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should set next_plan for next_cycle effective', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(higherPlan);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);
      vi.mocked(mockRepo.updateSubscription).mockResolvedValue(sampleSubscription);

      await service.updateSubscription(orgId, higherPlan.id, 'next_cycle');

      expect(mockRepo.updateSubscription).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({
          next_plan: { connect: { id: higherPlan.id } },
        })
      );
    });

    it('should throw error for downgrade', async () => {
      // Use a non-free lower tier plan to test downgrade
      const lowerPlan = {
        ...samplePlan,
        id: '01hqtestplan00000003',
        code: 'basic',
        name: '基础版',
        sort_order: 0, // lower than samplePlan's sort_order: 1
      } as SubscriptionPlan;
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(lowerPlan);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);

      await expect(
        service.updateSubscription(orgId, lowerPlan.id, 'immediate')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: '不支持降级，当前套餐等级更高',
      });
    });

    it('should throw error for upgrade (requires payment)', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(higherPlan);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);

      await expect(
        service.updateSubscription(orgId, higherPlan.id, 'immediate')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: '升级请通过订阅页创建订单并支付差价',
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should throw 404 when subscription not found', async () => {
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(null);

      await expect(service.cancelSubscription(orgId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should cancel subscription', async () => {
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);
      vi.mocked(mockRepo.updateSubscription).mockResolvedValue({
        ...sampleSubscription,
        status: 'cancelled',
      });

      await service.cancelSubscription(orgId);

      expect(mockRepo.updateSubscription).toHaveBeenCalledWith(orgId, { status: 'cancelled' });
    });
  });

  describe('createOrder', () => {
    it('should throw 404 when plan not found', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(null);

      await expect(service.createOrder(orgId, 'non-existent', 'monthly')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw error for free plan', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(freePlan);

      await expect(service.createOrder(orgId, freePlan.id, 'monthly')).rejects.toMatchObject({
        statusCode: 400,
        message: '免费套餐无需购买，注册时已自动开通',
      });
    });

    it('should create order with monthly billing', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(samplePlan);
      vi.mocked(mockRepo.createOrder).mockResolvedValue(sampleOrder);

      const result = await service.createOrder(orgId, samplePlan.id, 'monthly');

      expect(mockRepo.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          billing_cycle: 'monthly',
        })
      );
      expect(result.billing_cycle).toBe('monthly');
    });

    it('should create order with yearly billing', async () => {
      vi.mocked(mockRepo.findPlanById).mockResolvedValue(samplePlan);
      const yearlyOrder = { ...sampleOrder, billing_cycle: 'yearly', amount: 999 };
      vi.mocked(mockRepo.createOrder).mockResolvedValue(yearlyOrder);

      const result = await service.createOrder(orgId, samplePlan.id, 'yearly');

      expect(mockRepo.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          billing_cycle: 'yearly',
        })
      );
    });
  });

  describe('getOrder', () => {
    it('should throw 404 when order not found', async () => {
      vi.mocked(mockRepo.findOrderById).mockResolvedValue(null);

      await expect(service.getOrder(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should return order with plan', async () => {
      const orderWithPlan = { ...sampleOrder, plan: samplePlan };
      vi.mocked(mockRepo.findOrderById).mockResolvedValue(orderWithPlan);

      const result = await service.getOrder(orgId, sampleOrder.id);

      expect(result).toEqual(orderWithPlan);
    });
  });
});
