import type {
  Prisma,
  Bill,
  Payment,
  Lease,
  Room,
  Apartment,
  Tenant,
} from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * 账单包含关联信息
 */
export type BillWithRelations = Bill & {
  lease: Lease & {
    room: Room & { apartment: Apartment };
    tenant?: Tenant;
  };
  payments?: Payment[];
};

/**
 * 查询账单的过滤条件
 */
export interface BillFilter {
  leaseId?: string;
  year?: number;
  month?: number;
  status?: string;
  excludeStatus?: string;
}

/**
 * Bill Repository 接口
 */
export interface BillRepository {
  findById(id: string): Promise<Bill | null>;
  findByIdWithRelations(id: string): Promise<BillWithRelations | null>;
  findByOrgId(orgId: string, filter?: BillFilter): Promise<BillWithRelations[]>;
  create(data: Prisma.BillCreateInput): Promise<Bill>;
  update(id: string, data: Prisma.BillUpdateInput): Promise<Bill>;
  delete(id: string): Promise<void>;
  getLeaseIdsByOrg(orgId: string): Promise<string[]>;
  findByLeaseAndPeriod(leaseId: string, year: number, month: number): Promise<Bill | null>;
  countByOrgId(orgId: string): Promise<number>;
}

/**
 * 创建 Bill Repository 实例
 */
export function createBillRepository(db: DbClient): BillRepository {
  return {
    findById: async (id: string) => {
      return db.bill.findUnique({ where: { id } });
    },

    findByIdWithRelations: async (id: string) => {
      return db.bill.findFirst({
        where: { id },
        include: {
          lease: {
            include: {
              room: { include: { apartment: true } },
              tenant: true,
            },
          },
          payments: true,
        },
      }) as Promise<BillWithRelations | null>;
    },

    findByOrgId: async (orgId: string, filter?: BillFilter) => {
      // 先获取组织下所有的 leaseIds
      const rooms = await db.room.findMany({
        where: { apartment: { organization_id: orgId } },
        select: { id: true },
      });
      const roomIds = rooms.map((r) => r.id);
      const leases = await db.lease.findMany({
        where: { room_id: { in: roomIds } },
        select: { id: true },
      });
      const leaseIds = leases.map((l) => l.id);

      const where: Prisma.BillWhereInput = {};

      if (filter?.leaseId && leaseIds.includes(filter.leaseId)) {
        where.lease_id = filter.leaseId;
      } else {
        where.lease_id = { in: leaseIds };
      }

      if (filter?.year != null) where.bill_year = filter.year;
      if (filter?.month != null) where.bill_month = filter.month;
      if (filter?.excludeStatus) {
        where.status = { not: filter.excludeStatus };
      } else if (filter?.status) {
        where.status = filter.status;
      }

      return db.bill.findMany({
        where,
        orderBy: [
          { bill_year: 'desc' },
          { bill_month: 'desc' },
          { due_date: 'desc' },
          { created_at: 'desc' },
        ],
        include: {
          lease: {
            include: {
              room: { include: { apartment: true } },
              tenant: true,
            },
          },
        },
      }) as Promise<BillWithRelations[]>;
    },

    create: async (data: Prisma.BillCreateInput) => {
      return db.bill.create({ data });
    },

    update: async (id: string, data: Prisma.BillUpdateInput) => {
      return db.bill.update({ where: { id }, data });
    },

    delete: async (id: string) => {
      await db.bill.delete({ where: { id } });
    },

    getLeaseIdsByOrg: async (orgId: string) => {
      const rooms = await db.room.findMany({
        where: { apartment: { organization_id: orgId } },
        select: { id: true },
      });
      const roomIds = rooms.map((r) => r.id);
      const leases = await db.lease.findMany({
        where: { room_id: { in: roomIds } },
        select: { id: true },
      });
      return leases.map((l) => l.id);
    },

    findByLeaseAndPeriod: async (leaseId: string, year: number, month: number) => {
      return db.bill.findFirst({
        where: { lease_id: leaseId, bill_year: year, bill_month: month },
      });
    },

    countByOrgId: async (orgId: string) => {
      return db.bill.count({
        where: { lease: { room: { apartment: { organization_id: orgId } } } },
      });
    },
  };
}

/**
 * Payment Repository 接口
 */
export interface PaymentRepository {
  create(data: Prisma.PaymentCreateInput): Promise<Payment>;
  findByBillId(billId: string): Promise<Payment[]>;
}

/**
 * 创建 Payment Repository 实例
 */
export function createPaymentRepository(db: DbClient): PaymentRepository {
  return {
    create: async (data: Prisma.PaymentCreateInput) => {
      return db.payment.create({ data });
    },
    findByBillId: async (billId: string) => {
      return db.payment.findMany({
        where: { bill_id: billId },
        orderBy: [{ payment_date: 'desc' }, { created_at: 'desc' }],
      });
    },
  };
}

/**
 * 默认实例
 */
export const defaultBillRepo = createBillRepository(prisma);
export const defaultPaymentRepo = createPaymentRepository(prisma);
