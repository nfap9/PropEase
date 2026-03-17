import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  OrganizationSubscription,
  ServiceProduct,
  SubscriptionOrder,
} from '@prisma/client';
import { fulfillSubscription } from './fulfillSubscription.js';
import type {
  OrderWithService,
  SubscriptionRepository,
  SubscriptionWithService,
} from '../repositories/subscription.repo.js';

const sampleService: ServiceProduct = {
  id: 'service-pro',
  code: 'pro',
  name: '专业版',
  description: '专业计划',
  max_organizations: null,
  max_apartments: 2,
  max_rooms: 100,
  max_members: 5,
  is_active: true,
  sort_order: 1,
  created_at: new Date(),
  updated_at: new Date(),
};

const upgradedService: ServiceProduct = {
  ...sampleService,
  id: 'service-enterprise',
  code: 'enterprise',
  name: '企业版',
  sort_order: 2,
};

const paidOrder: OrderWithService = {
  id: 'order-1',
  order_no: 'SUB001',
  organization_id: 'org-1',
  service_id: sampleService.id,
  pricing_id: 'pricing-1',
  billing_months: 3,
  amount: 299,
  original_amount: 299,
  currency: 'CNY',
  status: 'paid',
  payment_method: 'wechat_native',
  code_url: null,
  wechat_transaction_id: null,
  paid_at: new Date(),
  expires_at: new Date(),
  organization_subscription_id: null,
  applied_discounts: null,
  total_discount: null,
  total_gift_months: 1,
  created_at: new Date(),
  updated_at: new Date(),
  service: sampleService,
};

describe('fulfillSubscription', () => {
  const txDb = { name: 'tx-db' };
  let baseRepo: SubscriptionRepository;
  let txRepo: SubscriptionRepository;
  let getSubscriptionRepo: (db: unknown) => SubscriptionRepository;
  let runInTransaction: <T>(callback: (db: unknown) => Promise<T>) => Promise<T>;

  beforeEach(() => {
    baseRepo = {
      findOrderByIdOnly: vi.fn(),
    } as unknown as SubscriptionRepository;
    txRepo = {
      findSubscriptionByOrgId: vi.fn(),
      createSubscription: vi.fn(),
      updateSubscription: vi.fn(),
      updateOrder: vi.fn(),
    } as unknown as SubscriptionRepository;

    getSubscriptionRepo = vi.fn((db: unknown) => (db === txDb ? txRepo : baseRepo));
    runInTransaction = async <T>(callback: (db: unknown) => Promise<T>) => callback(txDb);
  });

  it('should return early when order does not exist or is unpaid', async () => {
    vi.mocked(baseRepo.findOrderByIdOnly).mockResolvedValue(null);

    await fulfillSubscription('missing', {
      getSubscriptionRepo: getSubscriptionRepo as never,
      runInTransaction: runInTransaction as never,
    });

    expect(txRepo.findSubscriptionByOrgId).not.toHaveBeenCalled();
  });

  it('should create a new subscription and link order when none exists', async () => {
    vi.mocked(baseRepo.findOrderByIdOnly).mockResolvedValue(paidOrder);
    vi.mocked(txRepo.findSubscriptionByOrgId)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'sub-1',
      } as SubscriptionWithService);
    const createId = vi.fn().mockReturnValue('sub-1');

    await fulfillSubscription(paidOrder.id, {
      createId,
      getSubscriptionRepo: getSubscriptionRepo as never,
      runInTransaction: runInTransaction as never,
    });

    expect(txRepo.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'sub-1',
        organization: { connect: { id: paidOrder.organization_id } },
        service: { connect: { id: paidOrder.service_id } },
        pricing: { connect: { id: paidOrder.pricing_id } },
        auto_renew: true,
      })
    );
    expect(txRepo.updateOrder).toHaveBeenCalledWith(paidOrder.id, {
      org_subscription: { connect: { id: 'sub-1' } },
    });
  });

  it('should extend end date when renewing the same active service', async () => {
    const existingSubscription: SubscriptionWithService = {
      id: 'sub-1',
      organization_id: 'org-1',
      service_id: sampleService.id,
      pricing_id: 'pricing-old',
      status: 'active',
      billing_months: 1,
      start_date: new Date('2025-01-01T00:00:00Z'),
      end_date: new Date('2099-01-01T00:00:00Z'),
      auto_renew: true,
      trial_ends_at: null,
      next_service_id: null,
      limits_snapshot: null,
      created_at: new Date(),
      updated_at: new Date(),
      service: sampleService,
    };
    vi.mocked(baseRepo.findOrderByIdOnly).mockResolvedValue(paidOrder);
    vi.mocked(txRepo.findSubscriptionByOrgId)
      .mockResolvedValueOnce(existingSubscription)
      .mockResolvedValueOnce(existingSubscription);

    await fulfillSubscription(paidOrder.id, {
      getSubscriptionRepo: getSubscriptionRepo as never,
      runInTransaction: runInTransaction as never,
    });

    expect(txRepo.updateSubscription).toHaveBeenCalledWith(
      paidOrder.organization_id,
      expect.objectContaining({
        billing_months: paidOrder.billing_months,
        pricing: { connect: { id: paidOrder.pricing_id } },
        next_service: { disconnect: true },
      })
    );
  });

  it('should switch service when upgrading an active subscription', async () => {
    const existingSubscription: SubscriptionWithService = {
      id: 'sub-1',
      organization_id: 'org-1',
      service_id: sampleService.id,
      pricing_id: 'pricing-old',
      status: 'active',
      billing_months: 1,
      start_date: new Date('2025-01-01T00:00:00Z'),
      end_date: new Date('2099-01-01T00:00:00Z'),
      auto_renew: true,
      trial_ends_at: null,
      next_service_id: null,
      limits_snapshot: null,
      created_at: new Date(),
      updated_at: new Date(),
      service: sampleService,
    };
    const upgradeOrder: OrderWithService = {
      ...paidOrder,
      service_id: upgradedService.id,
      service: upgradedService,
    };
    vi.mocked(baseRepo.findOrderByIdOnly).mockResolvedValue(upgradeOrder);
    vi.mocked(txRepo.findSubscriptionByOrgId)
      .mockResolvedValueOnce(existingSubscription)
      .mockResolvedValueOnce({
        ...existingSubscription,
        service_id: upgradedService.id,
      } as SubscriptionWithService);

    await fulfillSubscription(upgradeOrder.id, {
      getSubscriptionRepo: getSubscriptionRepo as never,
      runInTransaction: runInTransaction as never,
    });

    expect(txRepo.updateSubscription).toHaveBeenCalledWith(
      upgradeOrder.organization_id,
      expect.objectContaining({
        service: { connect: { id: upgradedService.id } },
        pricing: { connect: { id: upgradeOrder.pricing_id } },
        next_service: { disconnect: true },
      })
    );
  });
});
