import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSubscriptionRepository,
  type SubscriptionRepository,
  isSubscriptionActive,
} from './subscription.repo.js';
import type { ServiceProduct, OrganizationSubscription, SubscriptionOrder } from '@prisma/client';

describe('SubscriptionRepository', () => {
  const mockServiceProduct = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  };

  const mockOrganizationSubscription = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const mockSubscriptionOrder = {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const mockDb = {
    serviceProduct: mockServiceProduct,
    organizationSubscription: mockOrganizationSubscription,
    subscriptionOrder: mockSubscriptionOrder,
  } as unknown as Parameters<typeof createSubscriptionRepository>[0];
  let repo: SubscriptionRepository;

  const sampleService: ServiceProduct = {
    id: '01hqtestplan00000001',
    code: 'pro',
    name: '专业版',
    description: '专业版套餐',
    max_organizations: null,
    max_apartments: 1,
    max_rooms: 100,
    max_members: 5,
    is_active: true,
    sort_order: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const sampleSubscription: OrganizationSubscription = {
    id: '01hqtestsub000000001',
    organization_id: '01hqtestorg000000001',
    service_id: sampleService.id,
    pricing_id: null,
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

  beforeEach(() => {
    vi.resetAllMocks();
    repo = createSubscriptionRepository(mockDb);
  });

  describe('findActiveServices', () => {
    it('should return active services excluding free', async () => {
      mockServiceProduct.findMany.mockResolvedValue([sampleService]);

      const result = await repo.findActiveServices();

      expect(mockServiceProduct.findMany).toHaveBeenCalledWith({
        where: { is_active: true, code: { not: 'free' } },
        orderBy: { sort_order: 'asc' },
      });
      expect(result).toEqual([sampleService]);
    });

    it('should return empty array when no active services', async () => {
      mockServiceProduct.findMany.mockResolvedValue([]);

      const result = await repo.findActiveServices();

      expect(result).toEqual([]);
    });
  });

  describe('findServiceById', () => {
    it('should return service by id', async () => {
      mockServiceProduct.findFirst.mockResolvedValue(sampleService);

      const result = await repo.findServiceById(sampleService.id);

      expect(mockServiceProduct.findFirst).toHaveBeenCalledWith({
        where: { id: sampleService.id },
      });
      expect(result).toEqual(sampleService);
    });

    it('should return null if not found', async () => {
      mockServiceProduct.findFirst.mockResolvedValue(null);

      const result = await repo.findServiceById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findSubscriptionByOrgId', () => {
    it('should return subscription with service', async () => {
      const subWithService = { ...sampleSubscription, service: sampleService };
      mockOrganizationSubscription.findUnique.mockResolvedValue(subWithService);

      const result = await repo.findSubscriptionByOrgId('01hqtestorg000000001');

      expect(mockOrganizationSubscription.findUnique).toHaveBeenCalledWith({
        where: { organization_id: '01hqtestorg000000001' },
        include: { service: true },
      });
      expect(result).toEqual(subWithService);
    });

    it('should return null if not found', async () => {
      mockOrganizationSubscription.findUnique.mockResolvedValue(null);

      const result = await repo.findSubscriptionByOrgId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create subscription with data', async () => {
      const createInput = {
        id: 'test-sub-id',
        organization: { connect: { id: '01hqtestorg000000001' } },
        service: { connect: { id: sampleService.id } },
        status: 'active',
      };
      mockOrganizationSubscription.create.mockResolvedValue(sampleSubscription);

      const result = await repo.createSubscription(createInput);

      expect(mockOrganizationSubscription.create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(sampleSubscription);
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription', async () => {
      const updateInput = { status: 'cancelled' };
      const updatedSub = { ...sampleSubscription, status: 'cancelled' };
      mockOrganizationSubscription.update.mockResolvedValue(updatedSub);

      const result = await repo.updateSubscription('01hqtestorg000000001', updateInput);

      expect(mockOrganizationSubscription.update).toHaveBeenCalledWith({
        where: { organization_id: '01hqtestorg000000001' },
        data: updateInput,
      });
      expect(result.status).toBe('cancelled');
    });
  });

  describe('findOrderById', () => {
    it('should return order with service when orgId matches', async () => {
      const orderWithService = { ...sampleOrder, service: sampleService };
      mockSubscriptionOrder.findFirst.mockResolvedValue(orderWithService);

      const result = await repo.findOrderById(sampleOrder.id, '01hqtestorg000000001');

      expect(mockSubscriptionOrder.findFirst).toHaveBeenCalledWith({
        where: { id: sampleOrder.id, organization_id: '01hqtestorg000000001' },
        include: { service: true },
      });
      expect(result).toEqual(orderWithService);
    });

    it('should return null if order belongs to different org', async () => {
      mockSubscriptionOrder.findFirst.mockResolvedValue(null);

      const result = await repo.findOrderById(sampleOrder.id, 'different-org');

      expect(result).toBeNull();
    });
  });

  describe('createOrder', () => {
    it('should create order with data', async () => {
      const createInput = {
        id: 'test-order-id',
        order_no: 'SUB123',
        organization: { connect: { id: '01hqtestorg000000001' } },
        service: { connect: { id: sampleService.id } },
        billing_months: 1,
        amount: 99,
        status: 'pending',
      };
      mockSubscriptionOrder.create.mockResolvedValue(sampleOrder);

      const result = await repo.createOrder(createInput);

      expect(mockSubscriptionOrder.create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(sampleOrder);
    });
  });

  describe('updateOrder', () => {
    it('should update order', async () => {
      const updateInput = { status: 'paid', paid_at: new Date() };
      const updatedOrder = { ...sampleOrder, status: 'paid' };
      mockSubscriptionOrder.update.mockResolvedValue(updatedOrder);

      const result = await repo.updateOrder(sampleOrder.id, updateInput);

      expect(mockSubscriptionOrder.update).toHaveBeenCalledWith({
        where: { id: sampleOrder.id },
        data: updateInput,
      });
      expect(result.status).toBe('paid');
    });
  });

  describe('isSubscriptionActive (pure function)', () => {
    it('should return false when status is not active', () => {
      const result = isSubscriptionActive({ status: 'cancelled', end_date: null });
      expect(result).toBe(false);
    });

    it('should return true when status is active and end_date is null', () => {
      const result = isSubscriptionActive({ status: 'active', end_date: null });
      expect(result).toBe(true);
    });

    it('should return true when end_date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const result = isSubscriptionActive({ status: 'active', end_date: futureDate });
      expect(result).toBe(true);
    });

    it('should return false when end_date is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const result = isSubscriptionActive({ status: 'active', end_date: pastDate });
      expect(result).toBe(false);
    });

    it('should return true when end_date is today', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const result = isSubscriptionActive({ status: 'active', end_date: today });
      expect(result).toBe(true);
    });
  });
});
