import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSubscriptionService,
  type SubscriptionService,
} from './subscription.service.js';
import type {
  OrderWithService,
  ServiceProductWithPricing,
  SubscriptionRepository,
  SubscriptionWithService,
} from '../repositories/subscription.repo.js';
import type { ServiceProduct, OrganizationSubscription, SubscriptionOrder, ServicePricing } from '@prisma/client';

// Mock ulid - use vi.fn with inline implementation to avoid reset issues
vi.mock('ulid', () => ({
  ulid: vi.fn(() => '01HQTESTSUB000001'),
}));

const sampleService: ServiceProduct = {
  id: '01hqtestplan00000001',
  code: 'pro',
  name: '专业版',
  description: '专业版服务',
  max_organizations: null,
  max_apartments: 1,
  max_rooms: 100,
  max_members: 5,
  is_active: true,
  sort_order: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

const freeService: ServiceProduct = {
  ...sampleService,
  id: '01hqtestplan00000000',
  code: 'free',
  name: '免费版',
  sort_order: 0,
};

const higherService: ServiceProduct = {
  ...sampleService,
  id: '01hqtestplan00000002',
  code: 'enterprise',
  name: '企业版',
  sort_order: 2,
};

const monthlyPricing: ServicePricing = {
  id: 'pricing-monthly',
  service_id: sampleService.id,
  months: 1,
  price: 99,
  is_active: true,
  sort_order: 0,
  created_at: new Date(),
  updated_at: new Date(),
};

const quarterlyPricing: ServicePricing = {
  ...monthlyPricing,
  id: 'pricing-quarterly',
  months: 3,
  price: 279,
  sort_order: 1,
};

const sampleServiceWithPricing: ServiceProductWithPricing = {
  ...sampleService,
  pricing: [monthlyPricing, quarterlyPricing],
};

const sampleSubscription: SubscriptionWithService = {
  id: '01hqtestsub000000001',
  organization_id: '01hqtestorg000000001',
  service_id: sampleService.id,
  pricing_id: null,
  service: sampleService,
  status: 'active',
  billing_months: 1,
  start_date: new Date(),
  end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  auto_renew: true,
  trial_ends_at: null,
  next_service_id: null,
  limits_snapshot: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const sampleOrder: SubscriptionOrder = {
  id: '01hqtestorder0000001',
  order_no: 'SUB1234567890',
  organization_id: '01hqtestorg000000001',
  service_id: sampleService.id,
  pricing_id: null,
  billing_months: 1,
  amount: 99,
  original_amount: 99,
  currency: 'CNY',
  status: 'pending',
  payment_method: 'wechat_native',
  code_url: null,
  wechat_transaction_id: null,
  paid_at: null,
  expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
  organization_subscription_id: null,
  applied_discounts: null,
  total_discount: null,
  total_gift_months: 0,
  balance_deduction: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const sampleOrderWithService: OrderWithService = {
  ...sampleOrder,
  service: sampleService,
};

describe('SubscriptionService', () => {
  const mockRepo: SubscriptionRepository = {
    findActiveServices: vi.fn(),
    findActiveServicesWithPricing: vi.fn(),
    findServiceById: vi.fn(),
    findServiceByIdWithPricing: vi.fn(),
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

  describe('listServices', () => {
    it('should return active services with pricing from repository', async () => {
      vi.mocked(mockRepo.findActiveServicesWithPricing).mockResolvedValue([sampleServiceWithPricing]);

      const result = await service.listServices();

      expect(mockRepo.findActiveServicesWithPricing).toHaveBeenCalled();
      expect(result).toEqual([sampleServiceWithPricing]);
    });
  });

  describe('getServiceById', () => {
    it('should return service with pricing from repository', async () => {
      vi.mocked(mockRepo.findServiceByIdWithPricing).mockResolvedValue(sampleServiceWithPricing);

      const result = await service.getServiceById(sampleService.id);

      expect(mockRepo.findServiceByIdWithPricing).toHaveBeenCalledWith(sampleService.id);
      expect(result).toEqual(sampleServiceWithPricing);
    });

    it('should throw 404 when service not found', async () => {
      vi.mocked(mockRepo.findServiceByIdWithPricing).mockResolvedValue(null);

      await expect(service.getServiceById('missing')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('getSubscription', () => {
    it('should return subscription with service', async () => {
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
        service: null,
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
      const sub = { ...sampleSubscription, end_date: pastDate, status: 'active' };
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
    it('should throw 404 when service not found', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(null);

      await expect(service.subscribe(orgId, 'non-existent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw error for free service', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(freeService);

      await expect(service.subscribe(orgId, freeService.id)).rejects.toMatchObject({
        statusCode: 400,
        message: '免费服务仅在注册时自动开通，请通过付费服务订阅',
      });
    });

    it('should throw error for downgrade', async () => {
      const lowerService = {
        ...sampleService,
        id: '01hqtestplan00000003',
        code: 'basic',
        name: '基础版',
        sort_order: 0,
      } as ServiceProduct;
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(lowerService);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);

      await expect(service.subscribe(orgId, lowerService.id)).rejects.toMatchObject({
        statusCode: 400,
        message: '不支持降级到低等级服务',
      });
    });

    it('should create new subscription when none exists', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(sampleService);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(null);
      vi.mocked(mockRepo.createSubscription).mockResolvedValue(sampleSubscription as OrganizationSubscription);

      const result = await service.subscribe(orgId, sampleService.id);

      expect(mockRepo.createSubscription).toHaveBeenCalled();
      expect(result).toEqual(sampleSubscription);
    });

    it('should update existing subscription', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(higherService);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);
      vi.mocked(mockRepo.updateSubscription).mockResolvedValue({
        ...sampleSubscription,
        service_id: higherService.id,
      } as OrganizationSubscription);

      const result = await service.subscribe(orgId, higherService.id);

      expect(mockRepo.updateSubscription).toHaveBeenCalled();
    });
  });

  describe('updateSubscription', () => {
    it('should throw 404 when service not found', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(null);

      await expect(
        service.updateSubscription(orgId, 'non-existent', 'immediate')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should throw error for free service', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(freeService);

      await expect(
        service.updateSubscription(orgId, freeService.id, 'immediate')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: '免费服务不可通过此接口修改',
      });
    });

    it('should throw 404 when subscription not found', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(sampleService);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(null);

      await expect(
        service.updateSubscription(orgId, sampleService.id, 'immediate')
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('should set next_service for next_cycle effective', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(higherService);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);
      vi.mocked(mockRepo.updateSubscription).mockResolvedValue(sampleSubscription as OrganizationSubscription);

      await service.updateSubscription(orgId, higherService.id, 'next_cycle');

      expect(mockRepo.updateSubscription).toHaveBeenCalledWith(
        orgId,
        expect.objectContaining({
          next_service: { connect: { id: higherService.id } },
        })
      );
    });

    it('should throw error for downgrade', async () => {
      const lowerService = {
        ...sampleService,
        id: '01hqtestplan00000003',
        code: 'basic',
        name: '基础版',
        sort_order: 0,
      } as ServiceProduct;
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(lowerService);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);

      await expect(
        service.updateSubscription(orgId, lowerService.id, 'immediate')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: '不支持降级，当前服务等级更高',
      });
    });

    it('should throw error for upgrade (requires payment)', async () => {
      vi.mocked(mockRepo.findServiceById).mockResolvedValue(higherService);
      vi.mocked(mockRepo.findSubscriptionByOrgId).mockResolvedValue(sampleSubscription);

      await expect(
        service.updateSubscription(orgId, higherService.id, 'immediate')
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
      } as OrganizationSubscription);

      await service.cancelSubscription(orgId);

      expect(mockRepo.updateSubscription).toHaveBeenCalledWith(orgId, { status: 'cancelled' });
    });
  });

  describe('createOrder', () => {
    it('should fallback to monthly pricing when exact billing months pricing is missing', async () => {
      vi.mocked(mockRepo.findServiceByIdWithPricing).mockResolvedValue({
        ...sampleService,
        pricing: [monthlyPricing],
      });
      vi.mocked(mockRepo.createOrder).mockResolvedValue(sampleOrder);

      await service.createOrder(orgId, {
        serviceId: sampleService.id,
        billingMonths: 3,
      });

      expect(mockRepo.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          billing_months: 3,
          amount: 297,
          original_amount: 297,
          pricing: undefined,
        })
      );
    });

    it('should throw when neither exact pricing nor monthly fallback exists', async () => {
      vi.mocked(mockRepo.findServiceByIdWithPricing).mockResolvedValue({
        ...sampleService,
        pricing: [
          {
            id: 'pricing-yearly',
            service_id: sampleService.id,
            months: 12,
            price: 999,
            is_active: true,
            sort_order: 0,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });

      await expect(
        service.createOrder(orgId, {
          serviceId: sampleService.id,
          billingMonths: 2,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: '未找到合适的定价',
      });
    });
  });

  describe('getOrder', () => {
    it('should return order from repository', async () => {
      vi.mocked(mockRepo.findOrderById).mockResolvedValue(sampleOrderWithService);

      const result = await service.getOrder(orgId, sampleOrder.id);

      expect(mockRepo.findOrderById).toHaveBeenCalledWith(sampleOrder.id, orgId);
      expect(result).toEqual(sampleOrderWithService);
    });

    it('should throw 404 when order not found', async () => {
      vi.mocked(mockRepo.findOrderById).mockResolvedValue(null);

      await expect(service.getOrder(orgId, 'missing')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
