import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReportService } from './report.service.js';
import type { ReportRepository } from '../repositories/report.repo.js';

describe('ReportService', () => {
  const repo: ReportRepository = {
    listReports: vi.fn(),
    countApartments: vi.fn(),
    countRooms: vi.fn(),
    countOccupiedRooms: vi.fn(),
    countTenants: vi.fn(),
    countActiveLeases: vi.fn(),
    sumMonthlyRevenue: vi.fn(),
    countPendingBills: vi.fn(),
    countOverdueBills: vi.fn(),
    getRoomsMissingInitialReadings: vi.fn(),
    getRoomIds: vi.fn(),
    getLeaseIds: vi.fn(),
    getBillsByYear: vi.fn(),
    countRoomsTotal: vi.fn(),
    countOccupiedRoomsInMonth: vi.fn(),
    countRooms: vi.fn(),
  };

  const service = createReportService(() => repo);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should return list of reports', async () => {
      const reports = [
        { id: 'report-1', name: '月报', type: 'monthly', created_at: new Date() },
      ];
      vi.mocked(repo.listReports).mockResolvedValue(reports as any);

      const result = await service.list('org-1');

      expect(result).toHaveLength(1);
      expect(repo.listReports).toHaveBeenCalledWith('org-1');
    });
  });

  describe('getOverview', () => {
    it('should calculate overview stats correctly', async () => {
      vi.mocked(repo.countApartments).mockResolvedValue(5);
      vi.mocked(repo.countRooms).mockResolvedValue(50);
      vi.mocked(repo.countOccupiedRooms).mockResolvedValue(40);
      vi.mocked(repo.countTenants).mockResolvedValue(80);
      vi.mocked(repo.countActiveLeases).mockResolvedValue(35);
      vi.mocked(repo.sumMonthlyRevenue).mockResolvedValue(100000);
      vi.mocked(repo.countPendingBills).mockResolvedValue(10);
      vi.mocked(repo.countOverdueBills).mockResolvedValue(5);
      vi.mocked(repo.getRoomsMissingInitialReadings).mockResolvedValue(3);

      const result = await service.getOverview('org-1');

      expect(result.total_apartments).toBe(5);
      expect(result.total_rooms).toBe(50);
      expect(result.occupied_rooms).toBe(40);
      expect(result.available_rooms).toBe(10);
      expect(result.total_tenants).toBe(80);
      expect(result.active_leases).toBe(35);
      expect(result.occupancy_rate).toBe(80);
      expect(result.monthly_revenue).toBe(100000);
      expect(result.pending_bills).toBe(10);
      expect(result.overdue_bills).toBe(5);
      expect(result.rooms_missing_initial_readings).toBe(3);
    });

    it('should handle zero rooms gracefully', async () => {
      vi.mocked(repo.countApartments).mockResolvedValue(0);
      vi.mocked(repo.countRooms).mockResolvedValue(0);
      vi.mocked(repo.countOccupiedRooms).mockResolvedValue(0);
      vi.mocked(repo.countTenants).mockResolvedValue(0);
      vi.mocked(repo.countActiveLeases).mockResolvedValue(0);
      vi.mocked(repo.sumMonthlyRevenue).mockResolvedValue(0);
      vi.mocked(repo.countPendingBills).mockResolvedValue(0);
      vi.mocked(repo.countOverdueBills).mockResolvedValue(0);
      vi.mocked(repo.getRoomsMissingInitialReadings).mockResolvedValue(0);

      const result = await service.getOverview('org-1');

      expect(result.occupancy_rate).toBe(0);
      expect(result.available_rooms).toBe(0);
    });

    it('should calculate occupancy rate with one decimal place', async () => {
      vi.mocked(repo.countApartments).mockResolvedValue(1);
      vi.mocked(repo.countRooms).mockResolvedValue(3);
      vi.mocked(repo.countOccupiedRooms).mockResolvedValue(1);
      vi.mocked(repo.countTenants).mockResolvedValue(1);
      vi.mocked(repo.countActiveLeases).mockResolvedValue(1);
      vi.mocked(repo.sumMonthlyRevenue).mockResolvedValue(0);
      vi.mocked(repo.countPendingBills).mockResolvedValue(0);
      vi.mocked(repo.countOverdueBills).mockResolvedValue(0);
      vi.mocked(repo.getRoomsMissingInitialReadings).mockResolvedValue(0);

      const result = await service.getOverview('org-1');

      expect(result.occupancy_rate).toBe(33.3);
    });
  });

  describe('getIncome', () => {
    it('should aggregate bills by month', async () => {
      vi.mocked(repo.getRoomIds).mockResolvedValue(['room-1', 'room-2']);
      vi.mocked(repo.getLeaseIds).mockResolvedValue(['lease-1', 'lease-2']);
      vi.mocked(repo.getBillsByYear).mockResolvedValue([
        {
          bill_month: 1,
          rent_amount: 1000 as any,
          water_amount: 100 as any,
          electricity_amount: 200 as any,
          other_amount: 50 as any,
          total_amount: 1350 as any,
          paid_amount: 1350 as any,
        },
        {
          bill_month: 1,
          rent_amount: 2000 as any,
          water_amount: 150 as any,
          electricity_amount: 300 as any,
          other_amount: 100 as any,
          total_amount: 2550 as any,
          paid_amount: 2000 as any,
        },
        {
          bill_month: 2,
          rent_amount: 3000 as any,
          water_amount: 200 as any,
          electricity_amount: 400 as any,
          other_amount: 100 as any,
          total_amount: 3700 as any,
          paid_amount: 0 as any,
        },
      ]);

      const result = await service.getIncome('org-1', 2024);

      expect(result).toHaveLength(2);
      
      // January
      expect(result[0].period).toBe('1月');
      expect(result[0].total_rent).toBe(3000);
      expect(result[0].total_water).toBe(250);
      expect(result[0].total_electricity).toBe(500);
      expect(result[0].total_other).toBe(150);
      expect(result[0].total_amount).toBe(3900);
      expect(result[0].collected_amount).toBe(3350);
      expect(result[0].collection_rate).toBe(85.9);

      // February
      expect(result[1].period).toBe('2月');
      expect(result[1].total_amount).toBe(3700);
      expect(result[1].collected_amount).toBe(0);
      expect(result[1].collection_rate).toBe(0);
    });

    it('should filter by month range', async () => {
      vi.mocked(repo.getRoomIds).mockResolvedValue(['room-1']);
      vi.mocked(repo.getLeaseIds).mockResolvedValue(['lease-1']);
      vi.mocked(repo.getBillsByYear).mockResolvedValue([]);

      await service.getIncome('org-1', 2024, 1, 3);

      expect(repo.getBillsByYear).toHaveBeenCalledWith(['lease-1'], 2024, 1, 3);
    });

    it('should handle bills with null amounts', async () => {
      vi.mocked(repo.getRoomIds).mockResolvedValue(['room-1']);
      vi.mocked(repo.getLeaseIds).mockResolvedValue(['lease-1']);
      vi.mocked(repo.getBillsByYear).mockResolvedValue([
        {
          bill_month: 1,
          rent_amount: null,
          water_amount: null,
          electricity_amount: null,
          other_amount: null,
          total_amount: null,
          paid_amount: null,
        },
      ]);

      const result = await service.getIncome('org-1', 2024);

      expect(result[0].total_rent).toBe(0);
      expect(result[0].total_amount).toBe(0);
    });
  });

  describe('getOccupancy', () => {
    it('should return empty array when no rooms', async () => {
      vi.mocked(repo.countRoomsTotal).mockResolvedValue(0);

      const result = await service.getOccupancy('org-1', 2024);

      expect(result).toEqual([]);
    });

    it('should calculate monthly occupancy rates', async () => {
      vi.mocked(repo.countRoomsTotal).mockResolvedValue(10);
      vi.mocked(repo.getRoomIds).mockResolvedValue(['room-1', 'room-2']);
      vi.mocked(repo.countOccupiedRoomsInMonth)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(9)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(9)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(9)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10);

      const result = await service.getOccupancy('org-1', 2024);

      expect(result).toHaveLength(12);
      expect(result[0].period).toBe('1月');
      expect(result[0].total_rooms).toBe(10);
      expect(result[0].occupied_rooms).toBe(8);
      expect(result[0].vacant_rooms).toBe(2);
      expect(result[0].occupancy_rate).toBe(80);

      expect(result[2].period).toBe('3月');
      expect(result[2].occupancy_rate).toBe(100);
    });
  });
});
