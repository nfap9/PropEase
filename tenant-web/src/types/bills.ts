import type { Bill } from '@propease/api-contract';

export interface BillStats {
  total: number;
  pending: number;
  partial: number;
  paid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
}
