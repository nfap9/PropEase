import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import * as ctrl from './subscriptions.controller.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../test/controllerHelper.js';

// Mock the services
vi.mock('../../services/subscription.service.js', () => ({
  defaultSubscriptionService: {
    listServices: vi.fn(),
    getServiceById: vi.fn(),
    getSubscription: vi.fn(),
    getSubscriptionStatus: vi.fn(),
    subscribe: vi.fn(),
    cancelSubscription: vi.fn(),
    createSubscriptionOrder: vi.fn(),
  },
}));

vi.mock('../../services/service-product.service.js', () => ({
  defaultServiceProductService: {
    getStorefrontView: vi.fn(),
    calculatePrice: vi.fn(),
  },
}));

vi.mock('../../utils/orgContext.js', () => ({
  requireOrgMembership: vi.fn(),
}));

vi.mock('../../services/wechatPayNative.js', () => ({
  createWechatPayNativeOrder: vi.fn(),
}));

import { defaultSubscriptionService } from '../../services/subscription.service.js';
import { defaultServiceProductService } from '../../services/service-product.service.js';
import { requireOrgMembership } from '../../utils/orgContext.js';

describe('SubscriptionsController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getStorefront', () => {
    it('should return storefront view when found', async () => {
      const mockView = { id: 'store-1', name: 'Test Store', products: [] };
      vi.mocked(defaultServiceProductService.getStorefrontView).mockResolvedValue(mockView as any);

      const req = createMockRequest({ query: { storefront_id: 'store-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getStorefront(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockView);
      expect(next._called).toBe(false);
    });

    it('should call next with 404 when storefront not found', async () => {
      vi.mocked(defaultServiceProductService.getStorefrontView).mockResolvedValue(null);

      const req = createMockRequest({ query: {} });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getStorefront(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(404);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate price successfully', async () => {
      const mockResult = { total: 100, months: 1, service_id: 'svc-1' };
      vi.mocked(defaultServiceProductService.calculatePrice).mockResolvedValue(mockResult as any);

      const req = createMockRequest({ body: { service_id: 'svc-1', months: 1 } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.calculatePrice(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 when service_id missing', async () => {
      const req = createMockRequest({ body: { months: 1 } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.calculatePrice(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(400);
    });

    it('should return 400 when months missing', async () => {
      const req = createMockRequest({ body: { service_id: 'svc-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.calculatePrice(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(400);
    });
  });

  describe('listPlans', () => {
    it('should return list of plans', async () => {
      const mockPlans = [{ id: 'plan-1', name: 'Basic' }];
      vi.mocked(defaultSubscriptionService.listServices).mockResolvedValue(mockPlans as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listPlans(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockPlans);
    });

    it('should pass activeOnly filter', async () => {
      vi.mocked(defaultSubscriptionService.listServices).mockResolvedValue([]);

      const req = createMockRequest({ query: { active_only: 'false' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listPlans(req, res, next);

      expect(defaultSubscriptionService.listServices).toHaveBeenCalledWith(false);
    });
  });

  describe('getPlan', () => {
    it('should return plan when found', async () => {
      const mockPlan = { id: 'plan-1', name: 'Basic' };
      vi.mocked(defaultSubscriptionService.getServiceById).mockResolvedValue(mockPlan as any);

      const req = createMockRequest({ params: { service_id: 'plan-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getPlan(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockPlan);
    });
  });

  describe('getSubscription', () => {
    it('should return subscription for org', async () => {
      vi.mocked(requireOrgMembership).mockResolvedValue('org-1');
      const mockSub = { id: 'sub-1', org_id: 'org-1' };
      vi.mocked(defaultSubscriptionService.getSubscription).mockResolvedValue(mockSub as any);

      const req = createMockRequest({ params: { org_id: 'org-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getSubscription(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockSub);
    });

    it('should return null when no subscription', async () => {
      vi.mocked(requireOrgMembership).mockResolvedValue('org-1');
      vi.mocked(defaultSubscriptionService.getSubscription).mockResolvedValue(null);

      const req = createMockRequest({ params: { org_id: 'org-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getSubscription(req, res, next);

      expect(res._json).toHaveBeenCalledWith(null);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription status', async () => {
      vi.mocked(requireOrgMembership).mockResolvedValue('org-1');
      const mockStatus = { is_active: true, plan_name: 'Pro' };
      vi.mocked(defaultSubscriptionService.getSubscriptionStatus).mockResolvedValue(mockStatus as any);

      const req = createMockRequest({ params: { org_id: 'org-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.getSubscriptionStatus(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockStatus);
    });
  });

  describe('subscribe', () => {
    it('should create subscription successfully', async () => {
      vi.mocked(requireOrgMembership).mockResolvedValue('org-1');
      const mockResult = { success: true, subscription_id: 'sub-1' };
      vi.mocked(defaultSubscriptionService.subscribe).mockResolvedValue(mockResult as any);

      const req = createMockRequest({ params: { org_id: 'org-1' }, body: { service_id: 'svc-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.subscribe(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 when service_id missing', async () => {
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.subscribe(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(400);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      vi.mocked(requireOrgMembership).mockResolvedValue('org-1');
      vi.mocked(defaultSubscriptionService.cancelSubscription).mockResolvedValue({} as any);

      const req = createMockRequest({ params: { org_id: 'org-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.cancelSubscription(req, res, next);

      expect(res._json).toHaveBeenCalledWith({ message: 'ok' });
    });
  });

  describe('createOrder', () => {
    it('should return 422 when schema validation fails', async () => {
      vi.mocked(requireOrgMembership).mockResolvedValue('org-1');

      const req = createMockRequest({
        params: { org_id: 'org-1' },
        body: { billing_cycle: 'monthly' }, // missing service_id
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.createOrder(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });
});
