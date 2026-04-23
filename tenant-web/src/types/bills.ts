import type { Bill } from '@apartment-ultra/api-contract';

export interface BillStats {
  total: number;
  pending: number;
  partial: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
}
