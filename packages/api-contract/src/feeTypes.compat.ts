/**
 * 费用类型兼容层
 * 为保持向后兼容，保留旧的 FeeType 接口定义
 * 注意：新旧 API 结构差异较大，实际使用时需要适配
 */

import type { FeeCategory, FeeCycle } from './feeTypes.js';

/** 费用类型（兼容旧 API） */
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

/** 费用规格（兼容旧 API） */
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

/** 创建费用类型（兼容旧 API） */
export interface FeeTypeCreate {
  name: string;
  code: string;
  description?: string;
  category?: FeeCategory;
  specifications?: FeeSpecificationCreate[];
}

/** 更新费用类型（兼容旧 API） */
export interface FeeTypeUpdate {
  name?: string;
  description?: string;
  category?: FeeCategory;
  is_active?: boolean;
  sort_order?: number;
}

/** 创建费用规格（兼容旧 API） */
export interface FeeSpecificationCreate {
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  unit?: string;
  is_default?: boolean;
  sort_order?: number;
}

/** 更新费用规格（兼容旧 API） */
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

/** 公寓费用配置（兼容旧 API） */
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

/** 创建公寓费用配置（兼容旧 API） */
export interface ApartmentFeeConfigCreate {
  fee_type_id: string;
  specification_id?: string;
  is_enabled?: boolean;
  allow_lease_override?: boolean;
  effective_from: string;
  effective_to?: string;
  notes?: string;
}

/** 更新公寓费用配置（兼容旧 API） */
export interface ApartmentFeeConfigUpdate {
  specification_id?: string;
  is_enabled?: boolean;
  allow_lease_override?: boolean;
  effective_from?: string;
  effective_to?: string;
  notes?: string;
}

/** 账单费用明细（兼容旧 API） */
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

/**
 * OrgFeeItem 转 FeeType 兼容转换
 * 注意：转换时需要将 OrgFeeItem 的字段映射到 FeeType 结构
 */
export function orgFeeItemToFeeType(orgItem: any): FeeType {
  return {
    id: orgItem.id,
    organization_id: orgItem.organization_id,
    name: orgItem.name,
    code: orgItem.code || orgItem.name.toLowerCase().replace(/\s+/g, '_'),
    description: orgItem.description || null,
    category: orgItem.category,
    is_active: orgItem.is_active ?? true,
    sort_order: orgItem.sort_order ?? 0,
    created_at: orgItem.created_at,
    updated_at: orgItem.updated_at,
    specifications: orgItem.specifications || [],
  };
}
