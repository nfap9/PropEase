/** 优惠活动类型 */
export type PromotionType = 'discount' | 'gift' | 'mixed';

/** 折扣类型 */
export type DiscountType = 'percent' | 'fixed';

/** 服务周期定价 */
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

/** 优惠活动关联的服务 */
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
  /** 关联的服务（可选，查询时返回） */
  plans?: PromotionPlan[];
}

