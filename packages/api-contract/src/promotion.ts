/** 优惠活动类型 */
export type PromotionType = 'discount' | 'gift' | 'mixed';

/** 折扣类型 */
export type DiscountType = 'percent' | 'fixed';

/** 套餐周期定价 */
export interface PlanPricing {
  id: string;
  plan_id: string;
  months: number;
  price: number;
  is_active: boolean;
  /** 是否允许购买 */
  is_purchasable: boolean;
  sort_order: number;
}

/** 优惠活动关联的套餐 */
export interface PromotionPlan {
  id: string;
  promotion_id: string;
  plan_id: string;
  created_at: string;
}

/** 优惠活动 */
export interface Promotion {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: PromotionType;
  /** 折扣类型：percent 百分比折扣 | fixed 固定金额减免 */
  discount_type: DiscountType | null;
  /** 折扣率(如0.8表示8折)或减免金额(如50表示立减50元) */
  discount_value: number | null;
  /** 赠送月数 */
  gift_months: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** 关联的套餐（可选，查询时返回） */
  plans?: PromotionPlan[];
}

/** 创建优惠活动 */
export interface PromotionCreate {
  name: string;
  code: string;
  description?: string | null;
  type: PromotionType;
  /** 折扣类型 */
  discount_type?: DiscountType | null;
  discount_value?: number | null;
  gift_months?: number | null;
  start_date: string;
  end_date?: string | null;
  is_active?: boolean;
  /** 关联的套餐 ID 列表 */
  plan_ids?: string[];
}

/** 更新优惠活动 */
export interface PromotionUpdate {
  name?: string;
  description?: string | null;
  type?: PromotionType;
  discount_type?: DiscountType | null;
  discount_value?: number | null;
  gift_months?: number | null;
  start_date?: string;
  end_date?: string | null;
  is_active?: boolean;
}

/** 优惠活动列表查询参数 */
export interface PromotionListParams {
  is_active?: boolean;
  plan_id?: string;
}

/** 计算优惠后的价格结果 */
export interface PromotionCalculation {
  original_price: number;
  discount_amount: number;
  final_price: number;
  gift_months: number;
  promotion: Promotion | null;
}
