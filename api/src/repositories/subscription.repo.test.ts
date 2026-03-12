import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSubscriptionRepository,
  type SubscriptionRepository,
  isSubscriptionActive,
} from './subscription.repo.js';
import type { SubscriptionPlan, OrganizationSubscription, SubscriptionOrder } from '@prisma/client';

describe('SubscriptionRepository', () => {
  const mockSubscriptionPlan = {
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
    subscriptionPlan: mockSubscriptionPlan,
    organizationSubscription: mockOrganizationSubscription,
    subscriptionOrder: mockSubscriptionOrder,
  } as unknown as Parameters<typeof createSubscriptionRepository>[0];
  let repo: SubscriptionRepository;

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

  const sampleSubscription: OrganizationSubscription = {
    organization_id: '01hqtestorg000000001',
    plan_id: samplePlan.id,
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

  beforeEach(() => {
    vi.resetAllMocks();
    repo = createSubscriptionRepository(mockDb);
  });

  describe('findActivePlans', () => {
    it('should return active plans excluding free', async () => {
      mockSubscriptionPlan.findMany.mockResolvedValue([samplePlan]);

      const result = await repo.findActivePlans();

      expect(mockSubscriptionPlan.findMany).toHaveBeenCalledWith({
        where: { is_active: true, code: { not: 'free' } },
        orderBy: { sort_order: 'asc' },
      });
      expect(result).toEqual([samplePlan]);
    });

    it('should return empty array when no active plans', async () => {
      mockSubscriptionPlan.findMany.mockResolvedValue([]);

      const result = await repo.findActivePlans();

      expect(result).toEqual([]);
    });
  });

  describe('findPlanById', () => {
    it('should return plan by id', async () => {
      mockSubscriptionPlan.findFirst.mockResolvedValue(samplePlan);

      const result = await repo.findPlanById(samplePlan.id);

      expect(mockSubscriptionPlan.findFirst).toHaveBeenCalledWith({
        where: { id: samplePlan.id },
      });
      expect(result).toEqual(samplePlan);
    });

    it('should return null if not found', async () => {
      mockSubscriptionPlan.findFirst.mockResolvedValue(null);

      const result = await repo.findPlanById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findSubscriptionByOrgId', () => {
    it('should return subscription with plan', async () => {
      const subWithPlan = { ...sampleSubscription, plan: samplePlan };
      mockOrganizationSubscription.findUnique.mockResolvedValue(subWithPlan);

      const result = await repo.findSubscriptionByOrgId('01hqtestorg000000001');

      expect(mockOrganizationSubscription.findUnique).toHaveBeenCalledWith({
        where: { organization_id: '01hqtestorg000000001' },
        include: { plan: true },
      });
      expect(result).toEqual(subWithPlan);
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
        plan: { connect: { id: samplePlan.id } },
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
    it('should return order with plan when orgId matches', async () => {
      const orderWithPlan = { ...sampleOrder, plan: samplePlan };
      mockSubscriptionOrder.findFirst.mockResolvedValue(orderWithPlan);

      const result = await repo.findOrderById(sampleOrder.id, '01hqtestorg000000001');

      expect(mockSubscriptionOrder.findFirst).toHaveBeenCalledWith({
        where: { id: sampleOrder.id, organization_id: '01hqtestorg000000001' },
        include: { plan: true },
      });
      expect(result).toEqual(orderWithPlan);
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
        plan: { connect: { id: samplePlan.id } },
        billing_cycle: 'monthly',
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
