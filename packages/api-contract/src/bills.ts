import type { Lease } from './leases.js';

/** 账单状态 */
export type BillStatus = 'pending' | 'partial' | 'paid' | 'overdue';

/** 支付方式 */
export type PaymentMethod =
  | 'cash'
  | 'wechat'
  | 'alipay'
  | 'bank_transfer'
  | 'other';

/** 账单 */
export interface Bill {
  id: string;
  lease_id: string;
  bill_year: number;
  bill_month: number;
  due_date: string;
  rent_amount: number;
  water_amount: number;
  electricity_amount: number;
  other_amount: number;
  total_amount: number;
  paid_amount: number;
  status: BillStatus;
  notes: string | null;
  lease?: Lease;
  created_at: string;
}

/** 支付记录 */
export interface Payment {
  id: string;
  bill_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  created_at: string;
}
