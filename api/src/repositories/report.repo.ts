import type { Prisma } from '@prisma/client';

// 使用 Prisma.Decimal 类型
type Decimal = Prisma.Decimal;
import type { DbClient } from '../types/repository.types.js';
import { prisma } from '../lib/prisma.js';

/**
 * Report Repository 接口
 */
export interface ReportRepository {
  // 概览统计
  countApartments(orgId: string): Promise<number>;
  countRooms(orgId: string): Promise<number>;
  countOccupiedRooms(orgId: string): Promise<number>;
  countTenants(orgId: string): Promise<number>;
  countActiveLeases(orgId: string): Promise<number>;
  sumMonthlyRevenue(orgId: string, year: number, month: number): Promise<number>;
  countPendingBills(orgId: string): Promise<number>;
  countOverdueBills(orgId: string, today: Date): Promise<number>;
  getRoomsMissingInitialReadings(orgId: string): Promise<number>;

  // 收入统计
  getRoomIds(orgId: string): Promise<string[]>;
  getLeaseIds(roomIds: string[]): Promise<string[]>;
  getBillsByYear(
    leaseIds: string[],
    year: number,
    startMonth?: number,
    endMonth?: number
  ): Promise<
    Array<{
      bill_month: number;
      rent_amount: Decimal | null;
      water_amount: Decimal | null;
      electricity_amount: Decimal | null;
      other_amount: Decimal | null;
      total_amount: Decimal | null;
      paid_amount: Decimal | null;
    }>
  >;

  // 入住率统计
  countRoomsTotal(orgId: string): Promise<number>;
  countOccupiedRoomsInMonth(
    roomIds: string[],
    monthStart: Date,
    monthEndNext: Date
  ): Promise<number>;

  // 报表列表
  listReports(orgId: string): Promise<Array<{
    id: string;
    type: 'overview' | 'income' | 'occupancy';
    name: string;
    description: string;
    updated_at: string;
  }>>;
}

/**
 * 创建 Report Repository 实例
 */
export function createReportRepository(db: DbClient): ReportRepository {
  return {
    countApartments: async (orgId: string) => {
      return db.apartment.count({ where: { organization_id: orgId } });
    },

    countRooms: async (orgId: string) => {
      return db.room.count({ where: { apartment: { organization_id: orgId } } });
    },

    countOccupiedRooms: async (orgId: string) => {
      return db.room.count({
        where: { apartment: { organization_id: orgId }, status: 'occupied' },
      });
    },

    countTenants: async (orgId: string) => {
      return db.tenant.count({ where: { organization_id: orgId } });
    },

    countActiveLeases: async (orgId: string) => {
      return db.lease.count({
        where: { room: { apartment: { organization_id: orgId } }, is_active: true },
      });
    },

    sumMonthlyRevenue: async (orgId: string, year: number, month: number) => {
      const result = await db.bill.aggregate({
        where: {
          lease: { room: { apartment: { organization_id: orgId } } },
          bill_year: year,
          bill_month: month,
        },
        _sum: { total_amount: true },
      });
      return Number(result._sum.total_amount ?? 0);
    },

    countPendingBills: async (orgId: string) => {
      return db.bill.count({
        where: { lease: { room: { apartment: { organization_id: orgId } } }, status: 'pending' },
      });
    },

    countOverdueBills: async (orgId: string, today: Date) => {
      return db.bill.count({
        where: {
          lease: { room: { apartment: { organization_id: orgId } } },
          status: { not: 'paid' },
          due_date: { lt: today },
        },
      });
    },

    getRoomsMissingInitialReadings: async (orgId: string) => {
      const rooms = await db.room.findMany({
        where: { apartment: { organization_id: orgId }, status: 'occupied' },
        include: {
          leases: { where: { is_active: true }, take: 1, orderBy: { start_date: 'desc' } },
        },
      });
      const roomIds = rooms.map((r) => r.id);
      const readings = await db.utilityReading.findMany({
        where: { room_id: { in: roomIds } },
        select: { room_id: true, period_year: true, period_month: true },
      });
      const readingKeys = new Set(
        readings.map((r) => `${r.room_id}:${r.period_year}:${r.period_month}`)
      );
      let count = 0;
      for (const r of rooms) {
        const lease = r.leases[0];
        if (!lease) continue;
        const start = lease.start_date;
        if (!readingKeys.has(`${r.id}:${start.getFullYear()}:${start.getMonth() + 1}`)) count += 1;
      }
      return count;
    },

    getRoomIds: async (orgId: string) => {
      const rooms = await db.room.findMany({
        where: { apartment: { organization_id: orgId } },
        select: { id: true },
      });
      return rooms.map((r) => r.id);
    },

    getLeaseIds: async (roomIds: string[]) => {
      const leases = await db.lease.findMany({
        where: { room_id: { in: roomIds } },
        select: { id: true },
      });
      return leases.map((l) => l.id);
    },

    getBillsByYear: async (
      leaseIds: string[],
      year: number,
      startMonth?: number,
      endMonth?: number
    ) => {
      return db.bill.findMany({
        where: {
          lease_id: { in: leaseIds },
          bill_year: year,
          ...(startMonth != null ? { bill_month: { gte: startMonth } } : {}),
          ...(endMonth != null ? { bill_month: { lte: endMonth } } : {}),
        },
        select: {
          bill_month: true,
          rent_amount: true,
          water_amount: true,
          electricity_amount: true,
          other_amount: true,
          total_amount: true,
          paid_amount: true,
        },
      });
    },

    countRoomsTotal: async (orgId: string) => {
      const rooms = await db.room.findMany({
        where: { apartment: { organization_id: orgId } },
        select: { id: true },
      });
      return rooms.length;
    },

    countOccupiedRoomsInMonth: async (roomIds: string[], monthStart: Date, monthEndNext: Date) => {
      const overlappingRooms = await db.lease.groupBy({
        by: ['room_id'],
        where: {
          room_id: { in: roomIds },
          start_date: { lt: monthEndNext },
          OR: [{ end_date: null }, { end_date: { gte: monthStart } }],
        },
      });
      return overlappingRooms.length;
    },

    listReports: async (orgId: string) => {
      // 返回三个内置报表的元数据
      const now = new Date().toISOString();
      return [
        {
          id: `${orgId}-overview`,
          type: 'overview' as const,
          name: '概览统计',
          description: '公寓、房间、入住率、收入等关键指标概览',
          updated_at: now,
        },
        {
          id: `${orgId}-income`,
          type: 'income' as const,
          name: '收入报表',
          description: '月度收入明细及收缴率统计',
          updated_at: now,
        },
        {
          id: `${orgId}-occupancy`,
          type: 'occupancy' as const,
          name: '入住率报表',
          description: '月度入住率变化趋势',
          updated_at: now,
        },
      ];
    },
  };
}

/**
 * 默认实例
 */
export const defaultReportRepo = createReportRepository(prisma);
