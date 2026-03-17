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

export interface BillCreate {
  lease_id: string;
  bill_year: number;
  bill_month: number;
  due_date: string;
  rent_amount?: number;
  water_amount?: number;
  electricity_amount?: number;
  other_amount?: number;
  total_amount: number;
  notes?: string;
}

export interface BillUpdate {
  rent_amount?: number;
  water_amount?: number;
  electricity_amount?: number;
  other_amount?: number;
  total_amount?: number;
  status?: BillStatus;
  notes?: string;
}

export interface BillListParams {
  lease_id?: string;
  year?: number;
  month?: number;
  status?: BillStatus;
}

export interface GenerateBillsRequest {
  bill_year: number;
  bill_month: number;
  due_date: string;
  lease_ids?: string[];
}

export interface GenerateBillsResult {
  created: number;
  skipped: number;
  bills?: Bill[];
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

export interface PaymentCreate {
  amount: number;
  payment_date: string;
  payment_method?: PaymentMethod;
  reference?: string;
  notes?: string;
}
