/** 费用周期 */
export type FeeCycle = 'monthly' | 'quarterly' | 'yearly' | 'one_time';

/** 计费类型 */
export type FeeCategory = 'fixed' | 'utility' | 'optional';

/** 组织级费用项目 */
export interface OrgFeeItem {
  id: string;
  organization_id: string | null;
  category: FeeCategory;
  name: string;
  amount: number;
  cycle: FeeCycle;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 创建组织级费用项目 */
export interface OrgFeeItemCreate {
  name: string;
  category: FeeCategory;
  amount: number;
  cycle: FeeCycle;
}

/** 更新组织级费用项目 */
export interface OrgFeeItemUpdate {
  name?: string;
  category?: FeeCategory;
  amount?: number;
  cycle?: FeeCycle;
  is_active?: boolean;
  sort_order?: number;
}
