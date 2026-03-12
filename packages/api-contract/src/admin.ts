import type { PlanPricing } from './promotion.js';

/**
 * 运营后台 API 契约类型
 * 与业务端类型分离，独立维护
 */

/** 运营登录响应 */
export interface AdminTokenResponse {
  access_token: string;
  token_type: string;
}

/** 平台统计 */
export interface AdminPlatformStats {
  organizations_count: number;
  users_count: number;
  apartments_count: number;
  rooms_count: number;
  active_subscriptions_count: number;
}

/** 运营账号 */
export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role_id: string;
  role_name: string | null;
  is_active: boolean;
  /** 系统预置账号不可删除 */
  is_system: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface AdminUserCreate {
  username: string;
  password: string;
  name: string;
  email?: string | null;
  role_id: string;
}

export interface AdminUserUpdate {
  name?: string | null;
  email?: string | null;
  role_id?: string | null;
  is_active?: boolean | null;
}

export interface AdminPasswordReset {
  new_password: string;
}

/** 运营角色 */
export interface AdminRole {
  id: string;
  name: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
}

export interface AdminRoleCreate {
  name: string;
  permissions?: string[];
}

export interface AdminRoleUpdate {
  name?: string | null;
  permissions?: string[] | null;
}

/** 运营侧组织 */
export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_personal: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AdminOrganizationSetActive {
  is_active: boolean;
}

/** 运营侧注册用户关联的组织 */
export interface AdminRegisteredUserOrg {
  id: string;
  name: string;
  slug: string;
  role: string;
}

/** 运营侧注册用户（业务侧账号） */
export interface AdminRegisteredUser {
  id: string;
  phone: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminRegisteredUserDetail extends AdminRegisteredUser {
  organizations: AdminRegisteredUserOrg[];
}

export interface AdminRegisteredUserSetActive {
  is_active: boolean;
}

/** 周期定价 */
export interface AdminPlanPricingCreate {
  months: number;
  price: number;
  is_active?: boolean;
  sort_order?: number;
}

/** 套餐（运营侧） */
export interface AdminPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  /** 用户最多可拥有的组织数，null 表示不限制 */
  max_organizations: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  features: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  /** 已废弃，保留向后兼容 */
  free_validity_days: number | null;
  created_at: string;
  updated_at: string;
  /** 周期定价列表 */
  pricing?: PlanPricing[];
}

export interface AdminPlanCreate {
  name: string;
  code: string;
  description?: string | null;
  price_monthly: number;
  price_yearly: number;
  max_organizations?: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  features?: Record<string, unknown> | null;
  sort_order?: number;
  /** 已废弃 */
  free_validity_days?: number | null;
  /** 周期定价列表 */
  pricing?: AdminPlanPricingCreate[];
}

export interface AdminPlanUpdate {
  name?: string | null;
  description?: string | null;
  price_monthly?: number | null;
  price_yearly?: number | null;
  max_organizations?: number | null;
  max_apartments?: number | null;
  max_rooms?: number | null;
  max_members?: number | null;
  features?: Record<string, unknown> | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  /** 已废弃 */
  free_validity_days?: number | null;
}

/** 批量更新套餐定价 */
export interface AdminPlanPricingUpdate {
  pricing: AdminPlanPricingCreate[];
}

/** 订阅（运营侧） */
export interface AdminSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  /** 订阅月数 */
  billing_months: number;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  plan?: AdminPlan | null;
}

export interface AdminSubscriptionRenew {
  extend_days: number;
}

/** 品牌配置 */
export interface AdminPlatformConfig {
  app_name: string;
  app_description: string;
  logo_url: string;
  favicon_url: string;
  login_subtitle: string;
  register_subtitle: string;
}

/** 按量定价 */
export interface AdminUsagePricing {
  id: string;
  price_per_org: number;
  price_per_apartment: number;
  price_per_room: number;
  price_per_member: number;
}

export interface AdminUsagePricingUpdate {
  price_per_org?: number;
  price_per_apartment?: number;
  price_per_room?: number;
  price_per_member?: number;
}
