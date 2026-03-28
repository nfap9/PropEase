import type { Bill, Payment, Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import {
  createBillRepository,
  createPaymentRepository,
  type BillRepository,
  type PaymentRepository,
  type BillWithRelations,
  type BillFilter,
} from '../repositories/bill.repo.js';
import { createAppError } from '../utils/appError.js';
import { NotFoundMessages } from '../messages.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { defaultTenantReachabilityService } from './tenantReachability.service.js';

/**
 * 创建账单输入
 */
export interface CreateBillInput {
  lease_id: string;
  bill_year: number;
  bill_month: number;
  due_date: string;
  rent_amount?: number;
  deposit_amount?: number;
  water_amount?: number;
  electricity_amount?: number;
  other_amount?: number;
  total_amount?: number;
  notes?: string;
}

/**
 * 更新账单输入
 */
export interface UpdateBillInput {
  rent_amount?: number;
  water_amount?: number;
  electricity_amount?: number;
  other_amount?: number;
  total_amount?: number;
  status?: string;
  notes?: string;
}

/**
 * 创建支付输入
 */
export interface CreatePaymentInput {
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
  notes?: string;
}

/**
 * Bill Service 接口
 */
export interface BillService {
  list(orgId: string, filter?: BillFilter): Promise<BillWithRelations[]>;
  getById(orgId: string, id: string): Promise<BillWithRelations>;
  create(orgId: string, data: CreateBillInput): Promise<Bill>;
  update(orgId: string, id: string, data: UpdateBillInput): Promise<Bill>;
  delete(orgId: string, id: string): Promise<void>;
  addPayment(orgId: string, billId: string, data: CreatePaymentInput): Promise<Payment>;
  getPayments(orgId: string, billId: string): Promise<Payment[]>;
  validateOwnership(orgId: string, billId: string): Promise<BillWithRelations>;
}

/**
 * 构建账单创建数据
 */
function buildCreateData(data: CreateBillInput): Prisma.BillCreateInput {
  const rent = data.rent_amount ?? 0;
  const deposit = data.deposit_amount ?? 0;
  const water = data.water_amount ?? 0;
  const elec = data.electricity_amount ?? 0;
  const other = data.other_amount ?? 0;
  const total = data.total_amount ?? rent + deposit + water + elec + other;

  return {
    id: ulid().toLowerCase(),
    lease: { connect: { id: data.lease_id } },
    bill_year: data.bill_year,
    bill_month: data.bill_month,
    due_date: new Date(data.due_date),
    rent_amount: rent,
    deposit_amount: deposit,
    water_amount: water,
    electricity_amount: elec,
    other_amount: other,
    total_amount: total,
    paid_amount: 0,
    notes: data.notes,
  };
}

/**
 * 构建账单更新数据
 */
function buildUpdateData(data: UpdateBillInput): Prisma.BillUpdateInput {
  const updateData: Prisma.BillUpdateInput = {};
  if (data.rent_amount != null) updateData.rent_amount = data.rent_amount;
  if (data.water_amount != null) updateData.water_amount = data.water_amount;
  if (data.electricity_amount != null) updateData.electricity_amount = data.electricity_amount;
  if (data.other_amount != null) updateData.other_amount = data.other_amount;
  if (data.total_amount != null) updateData.total_amount = data.total_amount;
  if (data.status != null) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;
  return updateData;
}

/**
 * 创建 Bill Service 实例
 */
export function createBillService(
  getBillRepo: () => BillRepository = () => createBillRepository(prisma),
  getPaymentRepo: () => PaymentRepository = () => createPaymentRepository(prisma)
): BillService {
  return {
    list: async (orgId: string, filter?: BillFilter) => {
      return getBillRepo().findByOrgId(orgId, filter);
    },

    getById: async (orgId: string, id: string) => {
      const bill = await getBillRepo().findByIdWithRelations(id);
      if (!bill || bill.lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.BILL);
      }
      return bill;
    },

    create: async (orgId: string, data: CreateBillInput) => {
      // 验证租约归属
      const lease = await prisma.lease.findFirst({
        where: { id: data.lease_id },
        include: { room: { include: { apartment: true } } },
      });
      if (!lease || lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.LEASE);
      }
      const bill = await getBillRepo().create(buildCreateData(data));
      try {
        await defaultTenantReachabilityService.sendBillGenerated(bill.id);
      } catch (error) {
        logger.error({ err: error, billId: bill.id }, 'failed to send tenant bill_generated sms');
      }
      return bill;
    },

    update: async (orgId: string, id: string, data: UpdateBillInput) => {
      const existing = await getBillRepo().findByIdWithRelations(id);
      if (!existing || existing.lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.BILL);
      }
      return getBillRepo().update(id, buildUpdateData(data));
    },

    delete: async (orgId: string, id: string) => {
      const existing = await getBillRepo().findByIdWithRelations(id);
      if (!existing || existing.lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.BILL);
      }
      await getBillRepo().delete(id);
    },

    addPayment: async (orgId: string, billId: string, data: CreatePaymentInput) => {
      const bill = await getBillRepo().findByIdWithRelations(billId);
      if (!bill || bill.lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.BILL);
      }

      const payment = await getPaymentRepo().create({
        id: ulid().toLowerCase(),
        bill: { connect: { id: billId } },
        amount: data.amount,
        payment_date: new Date(data.payment_date),
        payment_method: data.payment_method ?? 'cash',
        reference: data.reference,
        notes: data.notes,
      });

      // 更新账单支付状态
      const newPaid = Number(bill.paid_amount) + data.amount;
      const newStatus = newPaid >= Number(bill.total_amount) ? 'paid' : 'partial';
      await getBillRepo().update(billId, {
        paid_amount: newPaid,
        status: newStatus,
      });

      return payment;
    },

    getPayments: async (orgId: string, billId: string) => {
      const bill = await getBillRepo().findByIdWithRelations(billId);
      if (!bill || bill.lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.BILL);
      }
      return getPaymentRepo().findByBillId(billId);
    },

    validateOwnership: async (orgId: string, billId: string) => {
      const bill = await getBillRepo().findByIdWithRelations(billId);
      if (!bill || bill.lease.room.apartment.organization_id !== orgId) {
        throw createAppError(404, NotFoundMessages.BILL);
      }
      return bill;
    },
  };
}

/**
 * 默认 Bill Service 实例
 */
export const defaultBillService = createBillService();
