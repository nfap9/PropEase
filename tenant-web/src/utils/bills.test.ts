import { describe, expect, it } from 'vitest';
import type { Bill, BillStatus } from '@/types';
import type { BillStats } from '@/types/bills';
import {
  getBillStatusFilter,
  filterBillsByStatus,
  buildBillStats,
  buildBillPdfFilename,
  buildBillsExcelFilename,
  getBillDetailDescription,
  getBillPaymentSummary,
  formatBillPeriod,
  formatBillLocation,
  formatPaymentRecord,
} from './bills';

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'bill-1',
    organization_id: 'org-1',
    lease_id: 'lease-1',
    bill_year: 2026,
    bill_month: 3,
    total_amount: 1000,
    paid_amount: 0,
    status: 'pending',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  } as Bill;
}

describe('bills utils', () => {
  describe('getBillStatusFilter', () => {
    it('returns null for invalid status', () => {
      expect(getBillStatusFilter('invalid')).toBeNull();
      expect(getBillStatusFilter('')).toBeNull();
      expect(getBillStatusFilter(null)).toBeNull();
    });

    it('returns valid status as-is', () => {
      expect(getBillStatusFilter('pending')).toBe('pending');
      expect(getBillStatusFilter('overdue')).toBe('overdue');
      expect(getBillStatusFilter('partial')).toBe('partial');
      expect(getBillStatusFilter('paid')).toBe('paid');
    });
  });

  describe('filterBillsByStatus', () => {
    const bills = [
      makeBill({ id: '1', status: 'pending' }),
      makeBill({ id: '2', status: 'overdue' }),
      makeBill({ id: '3', status: 'paid' }),
      makeBill({ id: '4', status: 'partial' }),
    ];

    it('returns all bills for status "all"', () => {
      expect(filterBillsByStatus(bills, 'all')).toHaveLength(4);
    });

    it('filters by specific status', () => {
      expect(filterBillsByStatus(bills, 'pending')).toHaveLength(1);
      expect(filterBillsByStatus(bills, 'overdue')).toHaveLength(1);
      expect(filterBillsByStatus(bills, 'paid')).toHaveLength(1);
      expect(filterBillsByStatus(bills, 'partial')).toHaveLength(1);
    });

    it('returns empty array for undefined input', () => {
      expect(filterBillsByStatus(undefined, 'pending')).toEqual([]);
    });
  });

  describe('buildBillStats', () => {
    it('returns zero stats for empty array', () => {
      const stats = buildBillStats([]);
      expect(stats.total).toBe(0);
      expect(stats.totalAmount).toBe(0);
    });

    it('returns zero stats for undefined input', () => {
      const stats = buildBillStats(undefined);
      expect(stats.total).toBe(0);
    });

    it('aggregates bill counts and amounts', () => {
      const bills = [
        makeBill({ id: '1', status: 'pending', total_amount: 500, paid_amount: 0 }),
        makeBill({ id: '2', status: 'overdue', total_amount: 300, paid_amount: 0 }),
        makeBill({ id: '3', status: 'paid', total_amount: 1000, paid_amount: 1000 }),
        makeBill({ id: '4', status: 'partial', total_amount: 200, paid_amount: 100 }),
      ];
      const stats = buildBillStats(bills);
      expect(stats.total).toBe(4);
      expect(stats.totalAmount).toBe(2000);
      expect(stats.paidAmount).toBe(1100);
      expect(stats.pending).toBe(1);
      expect(stats.overdue).toBe(1);
      expect(stats.paid).toBe(1);
      expect(stats.partial).toBe(1);
    });
  });

  describe('buildBillPdfFilename', () => {
    it('returns bill-{id}.pdf', () => {
      expect(buildBillPdfFilename('abc-123')).toBe('bill-abc-123.pdf');
    });
  });

  describe('buildBillsExcelFilename', () => {
    it('returns bills.xlsx for all', () => {
      expect(buildBillsExcelFilename('all')).toBe('bills.xlsx');
    });
    it('returns bills_unfinished.xlsx for unfinished', () => {
      expect(buildBillsExcelFilename('unfinished')).toBe('bills_unfinished.xlsx');
    });
  });

  describe('getBillDetailDescription', () => {
    const bill = makeBill({ bill_year: 2026, bill_month: 4 });

    it('returns empty string when no bill or selectedBillId', () => {
      expect(getBillDetailDescription(null, null)).toBe('');
      expect(getBillDetailDescription(bill, null)).toBe('');
      expect(getBillDetailDescription(null, 'bill-1')).toBe('');
    });

    it('returns formatted description', () => {
      const billWithLease = {
        ...bill,
        lease: {
          room: { apartment: { name: '阳光公寓' }, room_number: '301' },
        },
      };
      expect(getBillDetailDescription(billWithLease, 'bill-1')).toBe('2026年4月 - 阳光公寓 301');
    });
  });

  describe('getBillPaymentSummary', () => {
    it('calculates pending amount correctly', () => {
      const bill = makeBill({ total_amount: 1000, paid_amount: 300 });
      const summary = getBillPaymentSummary(bill);
      expect(summary.totalAmount).toBe(1000);
      expect(summary.paidAmount).toBe(300);
      expect(summary.pendingAmount).toBe(700);
    });

    it('handles null bill', () => {
      const summary = getBillPaymentSummary(null);
      expect(summary.totalAmount).toBe(0);
      expect(summary.paidAmount).toBe(0);
      expect(summary.pendingAmount).toBe(0);
    });
  });

  describe('formatBillPeriod', () => {
    it('returns yyyy年MM月 format', () => {
      expect(formatBillPeriod(makeBill({ bill_year: 2026, bill_month: 1 }))).toBe('2026年1月');
      expect(formatBillPeriod(makeBill({ bill_year: 2026, bill_month: 12 }))).toBe('2026年12月');
    });
  });

  describe('formatBillLocation', () => {
    it('returns dash for bill without lease/room', () => {
      expect(formatBillLocation(makeBill())).toBe('-');
    });

    it('returns apartment name and room number', () => {
      const bill = makeBill({
        lease: {
          room: { apartment: { name: '月亮公寓' }, room_number: '101' },
        } as Bill['lease'],
      });
      expect(formatBillLocation(bill)).toBe('月亮公寓 - 101');
    });
  });

  describe('formatPaymentRecord', () => {
    it('formats payment record string', () => {
      const result = formatPaymentRecord(500, '微信支付', '2026-03-15');
      expect(result).toBe('¥500 · 微信支付 · 2026-03-15');
    });
  });
});
