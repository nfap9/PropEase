import { formatDate } from '@/utils/date';
import type { Bill, BillStatus } from '@/types';

export interface BillStats {
  total: number;
  pending: number;
  partial: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
}

const VALID_BILL_STATUSES = new Set<BillStatus>(['pending', 'overdue', 'partial', 'paid']);

export function getBillStatusFilter(status: string | null): BillStatus | null {
  if (!status || !VALID_BILL_STATUSES.has(status as BillStatus)) {
    return null;
  }

  return status as BillStatus;
}

export function filterBillsByStatus(
  bills: Bill[] | undefined,
  status: BillStatus | 'all'
): Bill[] {
  if (!bills) {
    return [];
  }

  if (status === 'all') {
    return bills;
  }

  return bills.filter((bill) => bill.status === status);
}

export function buildBillStats(bills: Bill[] | undefined): BillStats {
  if (!bills || bills.length === 0) {
    return {
      total: 0,
      pending: 0,
      partial: 0,
      paid: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
    };
  }

  return bills.reduce<BillStats>(
    (stats, bill) => {
      stats.total += 1;
      stats.totalAmount += Number(bill.total_amount);
      stats.paidAmount += Number(bill.paid_amount);
      stats[bill.status] += 1;
      return stats;
    },
    {
      total: 0,
      pending: 0,
      partial: 0,
      paid: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
    }
  );
}

export function buildBillPdfFilename(billId: string) {
  return `bill-${billId}.pdf`;
}

export function buildBillsExcelFilename(exportType: 'all' | 'unfinished') {
  return exportType === 'unfinished' ? 'bills_unfinished.xlsx' : 'bills.xlsx';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function getBillDetailDescription(bill: Bill | null, selectedBillId: string | null) {
  if (!selectedBillId || !bill) {
    return '';
  }

  return `${bill.bill_year}年${bill.bill_month}月 - ${bill.lease?.room?.apartment?.name ?? ''} ${bill.lease?.room?.room_number ?? ''}`;
}

export function getBillPaymentSummary(bill: Bill | null) {
  const totalAmount = Number(bill?.total_amount ?? 0);
  const paidAmount = Number(bill?.paid_amount ?? 0);
  const pendingAmount = totalAmount - paidAmount;

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
  };
}

export function formatBillPeriod(bill: Bill) {
  return `${bill.bill_year}年${bill.bill_month}月`;
}

export function formatBillLocation(bill: Bill) {
  const room = bill.lease?.room;
  if (!room) {
    return '-';
  }

  return `${room.apartment?.name || ''} - ${room.room_number}`;
}

export function formatPaymentRecord(amount: number, paymentMethodLabel: string, paymentDate: string) {
  return `¥${amount.toLocaleString()} · ${paymentMethodLabel} · ${formatDate(paymentDate)}`;
}

// ============ Default form values (from former schemas/) ============

import type { PaymentMethod } from '@/types';

export function getDefaultGenerateValues(): { bill_year: number; bill_month: number; due_date: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dueDate = new Date(year, now.getMonth(), 15);
  return {
    bill_year: year,
    bill_month: month,
    due_date: dueDate.toISOString().split('T')[0],
  };
}

export function getDefaultPaymentValues(amount = 0): {
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string;
  notes: string;
} {
  return {
    amount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'wechat',
    reference: '',
    notes: '',
  };
}
