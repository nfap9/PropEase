/** 费用周期 */
export type FeeCycle = 'monthly' | 'quarterly' | 'yearly' | 'one_time';

/** 计费类型 */
export type FeeCategory = 'fixed' | 'utility' | 'optional';

/** 公寓费用项目 */
export interface ApartmentFeeItem {
  id: string;
  apartment_id: string;
  category: FeeCategory;
  name: string;
  amount: number;
  cycle: FeeCycle;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 创建公寓费用项目 */
export interface ApartmentFeeItemCreate {
  name: string;
  category: FeeCategory;
  amount: number;
  cycle: FeeCycle;
}

/** 更新公寓费用项目 */
export interface ApartmentFeeItemUpdate {
  name?: string;
  category?: FeeCategory;
  amount?: number;
  cycle?: FeeCycle;
  is_active?: boolean;
  sort_order?: number;
}
