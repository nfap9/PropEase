import type { ReportRepository } from '../repositories/report.repo.js';
import { defaultReportRepo } from '../repositories/report.repo.js';

/**
 * 概览统计响应
 */
export interface OverviewStats {
  total_apartments: number;
  total_rooms: number;
  occupied_rooms: number;
  available_rooms: number;
  total_tenants: number;
  active_leases: number;
  occupancy_rate: number;
  monthly_revenue: number;
  pending_bills: number;
  overdue_bills: number;
  rooms_missing_initial_readings: number;
}

/**
 * 月度收入统计
 */
export interface MonthlyIncome {
  period: string;
  total_rent: number;
  total_water: number;
  total_electricity: number;
  total_other: number;
  total_amount: number;
  collected_amount: number;
  collection_rate: number;
}

/**
 * 月度入住率统计
 */
export interface MonthlyOccupancy {
  period: string;
  total_rooms: number;
  occupied_rooms: number;
  vacant_rooms: number;
  occupancy_rate: number;
}

/**
 * Report Service 接口
 */
export interface ReportService {
  getOverview(orgId: string): Promise<OverviewStats>;
  getIncome(
    orgId: string,
    year: number,
    startMonth?: number,
    endMonth?: number
  ): Promise<MonthlyIncome[]>;
  getOccupancy(orgId: string, year: number): Promise<MonthlyOccupancy[]>;
}

/**
 * 创建 Report Service 实例
 */
export function createReportService(
  getRepo: () => ReportRepository = () => defaultReportRepo
): ReportService {
  return {
    getOverview: async (orgId: string) => {
      const today = new Date();
      const [
        total_apartments,
        total_rooms,
        occupied_rooms,
        total_tenants,
        active_leases,
        monthly_revenue,
        pending_bills,
        overdue_bills,
        rooms_missing_initial_readings,
      ] = await Promise.all([
        getRepo().countApartments(orgId),
        getRepo().countRooms(orgId),
        getRepo().countOccupiedRooms(orgId),
        getRepo().countTenants(orgId),
        getRepo().countActiveLeases(orgId),
        getRepo().sumMonthlyRevenue(orgId, today.getFullYear(), today.getMonth() + 1),
        getRepo().countPendingBills(orgId),
        getRepo().countOverdueBills(orgId, today),
        getRepo().getRoomsMissingInitialReadings(orgId),
      ]);

      const available_rooms = total_rooms - occupied_rooms;
      const occupancy_rate =
        total_rooms > 0 ? Math.round((occupied_rooms / total_rooms) * 1000) / 10 : 0;

      return {
        total_apartments,
        total_rooms,
        occupied_rooms,
        available_rooms,
        total_tenants,
        active_leases,
        occupancy_rate,
        monthly_revenue,
        pending_bills,
        overdue_bills,
        rooms_missing_initial_readings,
      };
    },

    getIncome: async (orgId: string, year: number, startMonth?: number, endMonth?: number) => {
      const roomIds = await getRepo().getRoomIds(orgId);
      const leaseIds = await getRepo().getLeaseIds(roomIds);
      const bills = await getRepo().getBillsByYear(leaseIds, year, startMonth, endMonth);

      const byMonth = new Map<
        number,
        {
          total_rent: number;
          total_water: number;
          total_electricity: number;
          total_other: number;
          total_amount: number;
          collected_amount: number;
        }
      >();

      for (const b of bills) {
        const m = b.bill_month;
        if (!byMonth.has(m)) {
          byMonth.set(m, {
            total_rent: 0,
            total_water: 0,
            total_electricity: 0,
            total_other: 0,
            total_amount: 0,
            collected_amount: 0,
          });
        }
        const row = byMonth.get(m)!;
        row.total_rent += Number(b.rent_amount);
        row.total_water += Number(b.water_amount);
        row.total_electricity += Number(b.electricity_amount);
        row.total_other += Number(b.other_amount);
        row.total_amount += Number(b.total_amount);
        row.collected_amount += Number(b.paid_amount);
      }

      const sortedMonths = Array.from(byMonth.entries()).sort((a, b) => a[0] - b[0]);
      return sortedMonths.map(([month, row]) => ({
        period: `${month}月`,
        total_rent: row.total_rent,
        total_water: row.total_water,
        total_electricity: row.total_electricity,
        total_other: row.total_other,
        total_amount: row.total_amount,
        collected_amount: row.collected_amount,
        collection_rate:
          row.total_amount > 0
            ? Math.round((row.collected_amount / row.total_amount) * 1000) / 10
            : 0,
      }));
    },

    getOccupancy: async (orgId: string, year: number) => {
      const total_rooms = await getRepo().countRoomsTotal(orgId);
      if (total_rooms === 0) {
        return [];
      }

      const roomIds = await getRepo().getRoomIds(orgId);
      const result: MonthlyOccupancy[] = [];

      for (let month = 1; month <= 12; month++) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEndNext = new Date(year, month, 1);

        const occupiedInMonth = await getRepo().countOccupiedRoomsInMonth(
          roomIds,
          monthStart,
          monthEndNext
        );
        const vacant_rooms = total_rooms - occupiedInMonth;
        const occupancy_rate =
          total_rooms > 0 ? Math.round((occupiedInMonth / total_rooms) * 1000) / 10 : 0;

        result.push({
          period: `${month}月`,
          total_rooms,
          occupied_rooms: occupiedInMonth,
          vacant_rooms,
          occupancy_rate,
        });
      }

      return result;
    },
  };
}

/**
 * 默认实例
 */
export const defaultReportService = createReportService();
