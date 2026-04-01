import type { Room } from './apartments.js';
import type { Tenant } from './tenants.js';

/** 租约费用项目（直接输入模式） */
export interface LeaseFeeItem {
  id: string;
  lease_id: string;
  fee_type_id: string | null; // 可选，关联费用类型
  fee_category: string;
  fee_name: string;
  fee_amount: number;
  fee_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  quantity: number;
  notes: string | null;
  feeType?: { id: string; name: string; category: string } | null;
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
  fee_items?: Array<{
    fee_name: string;
    fee_amount: number;
    fee_cycle: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
    quantity?: number;
    notes?: string;
  }>;
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
