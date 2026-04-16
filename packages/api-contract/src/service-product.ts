/**
 * 服务定价模块 - API 契约类型定义
 *
 * 将原有的「套餐配置」重构为「服务定价」
 * 将原有的「优惠活动」重构为「商店配置」
 */

// ============================================================
// 折扣类型
// ============================================================

/** 折扣类型 */
export type DiscountType = 'percent' | 'fixed' | 'gift';

/** 定价折扣配置 */
export interface PricingDiscount {
  /** 购买时长（月） */
  months: number;
  /** 折扣类型 */
  discount_type: DiscountType;
  /**
   * 折扣值
   * - percent: 0.8 表示 8 折（即价格乘以 0.8）
   * - fixed: 50 表示立减 50 元
   * - gift: 此字段无效，使用 gift_months
   */
  discount_value: number | null;
  /** 赠送月数（discount_type 为 gift 时使用） */
  gift_months: number | null;
}

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

// ============================================================
// 商店配置
// ============================================================

/** 商店配置 */
export interface StorefrontConfig {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  /** 商店项列表（可选，查询时返回） */
  items?: StorefrontItem[];
}

/** 商店项 */
export interface StorefrontItem {
  id: string;
  storefront_id: string;
  service_id: string;
  /** 关联的服务产品（可选，查询时返回） */
  service?: ServiceProduct;
  is_visible: boolean;
  sort_order: number;
  /** 按时长的折扣配置 */
  pricing_discounts: PricingDiscount[] | null;
  created_at: string;
  updated_at: string;
}

/** 创建商店配置参数 */
export interface StorefrontConfigCreate {
  name: string;
  code: string;
  is_active?: boolean;
  is_default?: boolean;
}

/** 更新商店配置参数 */
export interface StorefrontConfigUpdate {
  name?: string;
  is_active?: boolean;
  is_default?: boolean;
}

/** 创建商店项参数 */
export interface StorefrontItemCreate {
  service_id: string;
  is_visible?: boolean;
  sort_order?: number;
  pricing_discounts?: PricingDiscount[];
}

/** 更新商店项参数 */
export interface StorefrontItemUpdate {
  is_visible?: boolean;
  sort_order?: number;
  pricing_discounts?: PricingDiscount[];
}

/** 批量更新商店项排序 */
export interface StorefrontItemsReorder {
  item_ids: string[];
}

// ============================================================
// 商店视图（客户端使用）
// ============================================================

/** 商店视图服务项（客户端展示用) */
export interface StorefrontViewService {
  id: string;
  name: string;
  code: string;
  description: string | null;
  max_organizations: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  /** 定价列表 */
  pricing: StorefrontViewPricing[];
}

/** 商店视图定价 */
export interface StorefrontViewPricing {
  id: string;
  months: number;
  price: number;
  /** 折扣信息（如果有） */
  discount?: {
    discount_type: DiscountType;
    discount_value: number | null;
    gift_months: number | null;
  };
  /** 折扣后价格 */
  final_price?: number;
}

/** 商店视图（客户端购买页面使用) */
export interface StorefrontView {
  id: string;
  name: string;
  code: string;
  is_default: boolean;
  /** 可购买的服务列表 */
  services: StorefrontViewService[];
}
