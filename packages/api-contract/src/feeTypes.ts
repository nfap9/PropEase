/** 费用类型分类 */
export type FeeCategory = 'fixed' | 'utility' | 'optional';

/** 费用类型 */
export interface FeeType {
  id: string;
  organization_id: string | null;
  name: string;
  code: string;
  description: string | null;
  category: FeeCategory;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  specifications?: FeeSpecification[];
}

/** 费用规格 */
export interface FeeSpecification {
  id: string;
  fee_type_id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  unit: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** 创建费用类型 */
export interface FeeTypeCreate {
  name: string;
  code: string;
  description?: string;
  category?: FeeCategory;
  specifications?: FeeSpecificationCreate[];
}

/** 更新费用类型 */
export interface FeeTypeUpdate {
  name?: string;
  description?: string;
  category?: FeeCategory;
  is_active?: boolean;
  sort_order?: number;
}

/** 创建费用规格 */
export interface FeeSpecificationCreate {
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  unit?: string;
  is_default?: boolean;
  sort_order?: number;
}

/** 更新费用规格 */
export interface FeeSpecificationUpdate {
  name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  unit?: string;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

/** 公寓费用配置 */
export interface ApartmentFeeConfig {
  id: string;
  apartment_id: string;
  fee_type_id: string;
  specification_id: string | null;
  is_enabled: boolean;
  allow_lease_override: boolean;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  fee_type?: FeeType;
  specification?: FeeSpecification;
}

/** 创建公寓费用配置 */
export interface ApartmentFeeConfigCreate {
  fee_type_id: string;
  specification_id?: string;
  is_enabled?: boolean;
  allow_lease_override?: boolean;
  effective_from: string;
  effective_to?: string;
  notes?: string;
}

/** 更新公寓费用配置 */
export interface ApartmentFeeConfigUpdate {
  specification_id?: string;
  is_enabled?: boolean;
  allow_lease_override?: boolean;
  effective_from?: string;
  effective_to?: string;
  notes?: string;
}

/** 账单费用明细 */
export interface BillFeeItem {
  id: string;
  bill_id: string;
  fee_type_id: string;
  specification_id: string | null;
  fee_name: string;
  specification_name: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  notes: string | null;
  created_at: string;
}
