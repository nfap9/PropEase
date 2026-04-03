/**
 * Bill Service 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBillService, type BillService } from './bill.service.js';
import type { BillRepository, PaymentRepository } from '../repositories/bill.repo.js';

describe('BillService', () => {
  // Mock Repository
  const mockBillRepo: BillRepository = {
    findByOrgId: vi.fn(),
    findByIdWithRelations: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const mockPaymentRepo: PaymentRepository = {
    findByBillId: vi.fn(),
    create: vi.fn(),
  };

  // Mock Prisma
  vi.mock('../lib/prisma.js', () => ({
    prisma: {
      lease: {
        findFirst: vi.fn(),
      },
      bill: {
        findUnique: vi.fn().mockResolvedValue(null), // 防止 sendBillGenerated 警告
      },
    },
  }));

  let service: BillService;

  const orgId = '01HQTESTORG000000001';
  const billId = '01HQTESTBILL00001';
  const leaseId = '01HQTESTLEASE0001';

  const mockLease = {
    id: leaseId,
    room_id: '01HQTESTROOM00001',
    room: {
      id: '01HQTESTROOM00001',
      apartment: {
        id: '01HQTESTAPT0000001',
        organization_id: orgId,
      },
    },
  };

  const mockBill = {
    id: billId,
    lease_id: leaseId,
    bill_year: 2024,
    bill_month: 1,
    due_date: new Date('2024-01-31'),
    rent_amount: 2000,
    water_amount: 50,
    electricity_amount: 200,
    other_amount: 0,
    total_amount: 2250,
    paid_amount: 0,
    status: 'unpaid',
    notes: '测试账单',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBillWithRelations = {
    ...mockBill,
    lease: mockLease,
    payments: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = createBillService(() => mockBillRepo, () => mockPaymentRepo);
  });

  describe('list', () => {
    it('should return bills by org', async () => {
      vi.mocked(mockBillRepo.findByOrgId).mockResolvedValue([mockBillWithRelations] as any);

      const result = await service.list(orgId);

      expect(result).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('should return bill when found and belongs to org', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(mockBillWithRelations as any);

      const result = await service.getById(orgId, billId);

      expect(result).toEqual(mockBillWithRelations);
    });

    it('should throw 404 when bill not found', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.getById(orgId, billId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('should throw 404 when bill belongs to different org', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue({
        ...mockBillWithRelations,
        lease: {
          ...mockLease,
          room: { ...mockLease.room, apartment: { ...mockLease.room.apartment, organization_id: 'different-org' } },
        },
      } as any);

      await expect(service.getById(orgId, billId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('create', () => {
    it('should create bill when lease belongs to org', async () => {
      const { prisma } = await import('../lib/prisma.js');
      vi.mocked(prisma.lease.findFirst).mockResolvedValue(mockLease as any);
      vi.mocked(mockBillRepo.create).mockResolvedValue(mockBill as any);

      const input = {
        lease_id: leaseId,
        bill_year: 2024,
        bill_month: 1,
        due_date: '2024-01-31',
        rent_amount: 2000,
        water_amount: 50,
        electricity_amount: 200,
      };

      const result = await service.create(orgId, input);

      expect(result).toEqual(mockBill);
    });

    it('should throw 404 when lease not found', async () => {
      const { prisma } = await import('../lib/prisma.js');
      vi.mocked(prisma.lease.findFirst).mockResolvedValue(null);

      const input = {
        lease_id: leaseId,
        bill_year: 2024,
        bill_month: 1,
        due_date: '2024-01-31',
      };

      await expect(service.create(orgId, input)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('update', () => {
    it('should update bill', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(mockBillWithRelations as any);
      vi.mocked(mockBillRepo.update).mockResolvedValue({ ...mockBill, rent_amount: 2500 } as any);

      const result = await service.update(orgId, billId, { rent_amount: 2500 });

      expect(result.rent_amount).toBe(2500);
    });

    it('should throw 404 when bill not found', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.update(orgId, billId, { rent_amount: 2500 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('delete', () => {
    it('should delete bill', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(mockBillWithRelations as any);
      vi.mocked(mockBillRepo.delete).mockResolvedValue(undefined);

      await service.delete(orgId, billId);

      expect(mockBillRepo.delete).toHaveBeenCalledWith(billId);
    });

    it('should throw 404 when bill not found', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.delete(orgId, billId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('addPayment', () => {
    it('should add payment to bill', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(mockBillWithRelations as any);
      vi.mocked(mockPaymentRepo.create).mockResolvedValue({
        id: 'payment1',
        bill_id: billId,
        amount: 2250,
        payment_date: new Date(),
      } as any);

      const input = {
        amount: 2250,
        payment_date: '2024-01-15',
      };

      const result = await service.addPayment(orgId, billId, input);

      expect(result.amount).toBe(2250);
    });
  });

  describe('getPayments', () => {
    it('should return payments for bill', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(mockBillWithRelations as any);
      vi.mocked(mockPaymentRepo.findByBillId).mockResolvedValue([
        { id: 'payment1', amount: 1000 },
        { id: 'payment2', amount: 1250 },
      ] as any);

      const result = await service.getPayments(orgId, billId);

      expect(result).toHaveLength(2);
    });
  });

  describe('validateOwnership', () => {
    it('should return bill when valid', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(mockBillWithRelations as any);

      const result = await service.validateOwnership(orgId, billId);

      expect(result).toEqual(mockBillWithRelations);
    });

    it('should throw 404 when invalid', async () => {
      vi.mocked(mockBillRepo.findByIdWithRelations).mockResolvedValue(null);

      await expect(service.validateOwnership(orgId, billId)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
