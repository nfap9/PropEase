/**
 * Bill Repository 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBillRepository, createPaymentRepository } from './bill.repo.js';

describe('BillRepository', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  let repository: ReturnType<typeof createBillRepository>;

  const orgId = '01HQTESTORG000000001';
  const billId = '01HQTESTBILL00001';
  const leaseId = '01HQTESTLEASE0001';
  const roomId = '01HQTESTROOM00001';

  const mockBill = {
    id: billId,
    lease_id: leaseId,
    bill_year: 2024,
    bill_month: 1,
    due_date: new Date('2024-01-31'),
    rent_amount: 2000,
    water_amount: 50,
    electricity_amount: 200,
    total_amount: 2250,
    paid_amount: 0,
    status: 'unpaid',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockDb = {
      bill: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      room: {
        findMany: vi.fn(),
      },
      lease: {
        findMany: vi.fn(),
      },
    };
    repository = createBillRepository(mockDb);
  });

  describe('findByOrgId', () => {
    it('should return bills by org id', async () => {
      mockDb.room.findMany.mockResolvedValue([{ id: roomId }]);
      mockDb.lease.findMany.mockResolvedValue([{ id: leaseId }]);
      mockDb.bill.findMany.mockResolvedValue([mockBill]);

      const result = await repository.findByOrgId(orgId);

      expect(result).toHaveLength(1);
      expect(mockDb.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { bill_year: 'desc' },
            { bill_month: 'desc' },
            { due_date: 'desc' },
            { created_at: 'desc' },
          ],
        })
      );
    });
  });

  describe('findByIdWithRelations', () => {
    it('should return bill with relations', async () => {
      mockDb.bill.findFirst.mockResolvedValue({
        ...mockBill,
        lease: {
          id: leaseId,
          room: { id: roomId, apartment: { id: 'apt1', organization_id: orgId } },
          tenant: { id: 'tenant1', name: '张三' },
        },
        payments: [],
      });

      const result = await repository.findByIdWithRelations(billId);

      expect(result).not.toBeNull();
    });
  });

  describe('create', () => {
    it('should create bill', async () => {
      mockDb.bill.create.mockResolvedValue(mockBill);

      const result = await repository.create({
        lease: { connect: { id: leaseId } },
        bill_year: 2024,
        bill_month: 1,
        due_date: new Date('2024-01-31'),
        rent_amount: 2000,
        total_amount: 2250,
      });

      expect(result).toEqual(mockBill);
    });
  });

  describe('update', () => {
    it('should update bill', async () => {
      mockDb.bill.update.mockResolvedValue({ ...mockBill, rent_amount: 2500 });

      const result = await repository.update(billId, { rent_amount: 2500 });

      expect(result.rent_amount).toBe(2500);
    });
  });

  describe('delete', () => {
    it('should delete bill', async () => {
      mockDb.bill.delete.mockResolvedValue(undefined);

      await repository.delete(billId);

      expect(mockDb.bill.delete).toHaveBeenCalledWith({ where: { id: billId } });
    });
  });
});

describe('PaymentRepository', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  let repository: ReturnType<typeof createPaymentRepository>;

  const billId = '01HQTESTBILL00001';
  const paymentId = '01HQTESTPAYMENT001';

  const mockPayment = {
    id: paymentId,
    bill_id: billId,
    amount: 2250,
    payment_date: new Date('2024-01-15'),
    payment_method: 'alipay',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockDb = {
      payment: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    };
    repository = createPaymentRepository(mockDb);
  });

  describe('findByBillId', () => {
    it('should return payments by bill id', async () => {
      mockDb.payment.findMany.mockResolvedValue([mockPayment]);

      const result = await repository.findByBillId(billId);

      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create payment', async () => {
      mockDb.payment.create.mockResolvedValue(mockPayment);

      const result = await repository.create({
        bill: { connect: { id: billId } },
        amount: 2250,
        payment_date: new Date('2024-01-15'),
      });

      expect(result).toEqual(mockPayment);
    });
  });
});
