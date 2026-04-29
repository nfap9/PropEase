import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import * as ctrl from './bills.controller.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../test/controllerHelper.js';

// Mock the services
vi.mock('../../services/bill.service.js', () => ({
  defaultBillService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getPayments: vi.fn(),
    addPayment: vi.fn(),
    listFeeItems: vi.fn(),
    validateOwnership: vi.fn(),
  },
}));

vi.mock('../../services/billGeneration.js', () => ({
  generateBillsForOrg: vi.fn(),
}));

vi.mock('../../services/tenant.service.js', () => ({
  defaultTenantService: {
    getByIds: vi.fn(),
    getById: vi.fn(),
    sendBillNotification: vi.fn(),
  },
}));

vi.mock('../../utils/orgContext.js', () => ({
  requireOrgMembership: vi.fn(),
  requirePermission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/billExports.js', () => ({
  generateBillsExcel: vi.fn(),
  generateBillPdf: vi.fn(),
}));

vi.mock('../../services/platformConfig.js', () => ({
  getBrandConfig: vi.fn(),
}));

vi.mock('../../repositories/organization.repo.js', () => ({
  defaultOrgRepo: {
    findById: vi.fn(),
  },
}));

import { defaultBillService } from '../../services/bill.service.js';
import { generateBillsForOrg } from '../../services/billGeneration.js';
import { requireOrgMembership } from '../../utils/orgContext.js';

describe('BillsController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireOrgMembership).mockResolvedValue('org-1');
  });

  describe('query', () => {
    it('should return list of bills', async () => {
      const mockBills = [{ id: 'bill-1', total_amount: 1000 }];
      vi.mocked(defaultBillService.list).mockResolvedValue(mockBills as any);

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.query(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockBills);
    });

    it('should pass filters to service', async () => {
      vi.mocked(defaultBillService.list).mockResolvedValue([]);

      const req = createMockRequest({
        body: { lease_id: 'lease-1', year: 2024, month: 6, status: 'pending' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.query(req, res, next);

      expect(defaultBillService.list).toHaveBeenCalledWith('org-1', {
        leaseId: 'lease-1',
        year: 2024,
        month: 6,
        status: 'pending',
      });
    });
  });

  describe('generate', () => {
    it('should generate bills successfully', async () => {
      const mockResult = { generated: 10, failed: 0 };
      vi.mocked(generateBillsForOrg).mockResolvedValue(mockResult as any);

      const req = createMockRequest({
        body: { bill_year: 2024, bill_month: 6, due_date: '2024-06-30' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.generate(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 422 when validation fails', async () => {
      const req = createMockRequest({ body: { bill_year: 'not-a-number' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.generate(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });

  describe('get', () => {
    it('should return bill by id', async () => {
      const mockBill = { id: 'bill-1', total_amount: 1000 };
      vi.mocked(defaultBillService.getById).mockResolvedValue(mockBill as any);

      const req = createMockRequest({ params: { id: 'bill-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.get(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockBill);
    });
  });

  describe('create', () => {
    it('should create bill successfully', async () => {
      const mockBill = { id: 'bill-new', total_amount: 1500 };
      vi.mocked(defaultBillService.create).mockResolvedValue(mockBill as any);

      const req = createMockRequest({
        body: {
          lease_id: 'lease-1',
          bill_year: 2024,
          bill_month: 6,
          due_date: '2024-06-30',
          total_amount: 1500,
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(res._status).toHaveBeenCalledWith(201);
      expect(res._json).toHaveBeenCalledWith(mockBill);
    });

    it('should return 422 when validation fails', async () => {
      const req = createMockRequest({ body: { total_amount: 100 } }); // missing required fields
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.create(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });

  describe('update', () => {
    it('should update bill successfully', async () => {
      const mockBill = { id: 'bill-1', total_amount: 2000 };
      vi.mocked(defaultBillService.update).mockResolvedValue(mockBill as any);

      const req = createMockRequest({
        params: { id: 'bill-1' },
        body: { total_amount: 2000 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.update(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockBill);
    });
  });

  describe('del', () => {
    it('should delete bill successfully', async () => {
      vi.mocked(defaultBillService.delete).mockResolvedValue({} as any);

      const req = createMockRequest({ params: { id: 'bill-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.del(req, res, next);

      expect(res._status).toHaveBeenCalledWith(204);
    });
  });

  describe('listPayments', () => {
    it('should return list of payments', async () => {
      const mockPayments = [{ id: 'pay-1', amount: 500 }];
      vi.mocked(defaultBillService.getPayments).mockResolvedValue(mockPayments as any);

      const req = createMockRequest({ params: { id: 'bill-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listPayments(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockPayments);
    });
  });

  describe('addPayment', () => {
    it('should add payment successfully', async () => {
      const mockPayment = { id: 'pay-new', amount: 500 };
      vi.mocked(defaultBillService.addPayment).mockResolvedValue(mockPayment as any);

      const req = createMockRequest({
        params: { id: 'bill-1' },
        body: { amount: 500, payment_date: '2024-06-15' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.addPayment(req, res, next);

      expect(res._status).toHaveBeenCalledWith(201);
      expect(res._json).toHaveBeenCalledWith(mockPayment);
    });

    it('should return 422 when validation fails', async () => {
      const req = createMockRequest({ body: {} }); // missing amount
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.addPayment(req, res, next);

      expect(next._called).toBe(true);
      expect(next._error.statusCode).toBe(422);
    });
  });

  describe('listFeeItems', () => {
    it('should return list of fee items', async () => {
      const mockItems = [{ id: 'item-1', name: 'Rent' }];
      vi.mocked(defaultBillService.listFeeItems).mockResolvedValue(mockItems as any);

      const req = createMockRequest({ params: { id: 'bill-1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await ctrl.listFeeItems(req, res, next);

      expect(res._json).toHaveBeenCalledWith(mockItems);
    });
  });
});
