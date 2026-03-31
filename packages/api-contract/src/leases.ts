import type { Room } from './apartments.js';
import type { Tenant } from './tenants.js';

/** 租约费用项目 */
export interface LeaseFeeItem {
  id: string;
  lease_id: string;
  fee_type_id: string;
  specification_id: string | null;
  quantity: number;
  billing_cycle: 'monthly' | 'yearly';
  feeType: { id: string; name: string; code: string };
  specification: { id: string; name: string; price_monthly: number; price_yearly?: number } | null;
}

/** 租约 */
export interface Lease {
  id: string;
  room_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string | null;
  billing_day: number;
  monthly_rent: number;
  deposit: number;
  water_rate: number;
  electricity_rate: number;
  is_active: boolean;
  notes: string | null;
  room?: Room;
  tenant?: Tenant;
  fee_items?: LeaseFeeItem[];
  created_at: string;
}

export interface LeaseCreate {
  room_id: string;
  tenant_id: string;
  start_date: string;
  end_date?: string;
  billing_day?: number;
  monthly_rent: number;
  deposit?: number;
  water_rate?: number;
  electricity_rate?: number;
  notes?: string;
}

export interface LeaseUpdate {
  room_id?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  billing_day?: number;
  monthly_rent?: number;
  deposit?: number;
  water_rate?: number;
  electricity_rate?: number;
  notes?: string;
}

export interface LeaseListParams {
  is_active?: boolean;
}
