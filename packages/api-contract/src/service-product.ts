/**
 * 服务定价模块 - API 契约类型定义
 *
 * 将原有的「套餐配置」重构为「服务定价」
 */

// ============================================================
// 服务产品
// ============================================================

/** 服务产品 */
export interface ServiceProduct {
  id: string;
  name: string;
  code: string;
  description: string | null;
  /** 最大组织数（null 表示不限制） */
  max_organizations: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  /** 周期定价列表（可选，查询时返回） */
  pricing?: ServicePricing[];
}

/** 服务定价（按时长定价） */
export interface ServicePricing {
  id: string;
  service_id: string;
  /** 购买时长（月） */
  months: number;
  /** 价格 */
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** 创建服务产品参数 */
export interface ServiceProductCreate {
  name: string;
  code: string;
  description?: string;
  max_organizations?: number;
  max_apartments?: number;
  max_rooms?: number;
  max_members?: number;
  is_active?: boolean;
  sort_order?: number;
  /** 创建时同时创建定价 */
  pricing?: ServicePricingCreate[];
}

/** 更新服务产品参数 */
export interface ServiceProductUpdate {
  name?: string;
  description?: string;
  max_organizations?: number;
  max_apartments?: number;
  max_rooms?: number;
  max_members?: number;
  is_active?: boolean;
  sort_order?: number;
}

/** 创建服务定价参数 */
export interface ServicePricingCreate {
  months: number;
  price: number;
  is_active?: boolean;
  sort_order?: number;
}

/** 批量更新服务定价参数 */
export interface ServicePricingBatchUpdate {
  pricing: ServicePricingCreate[];
}
