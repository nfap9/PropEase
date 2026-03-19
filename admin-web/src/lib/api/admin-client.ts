/**
 * 运营后台 API 客户端。
 * 使用独立的 admin_access_token，与业务端 access_token 分离。
 */
import { createAdminApiClient, ApiError } from '@apartment-ultra/web-api-client';
import type { AxiosResponse } from 'axios';
import type {
  AdminTokenResponse,
  AdminPlatformStats,
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  AdminPasswordReset,
  AdminRole,
  AdminRoleCreate,
  AdminRoleUpdate,
  AdminOrganization,
  AdminOrganizationSetActive,
  AdminRegisteredUserOrg,
  AdminRegisteredUser,
  AdminRegisteredUserDetail,
  AdminRegisteredUserSetActive,
  AdminPlan,
  AdminPlanCreate,
  AdminPlanUpdate,
  AdminPlanPricingCreate,
  AdminSubscription,
  AdminSubscriptionRenew,
  AdminPlatformConfig,
  AdminUsagePricing,
  AdminUsagePricingUpdate,
  Promotion,
  PromotionCreate,
  PromotionUpdate,
  ServiceProduct,
  ServiceProductCreate,
  ServiceProductUpdate,
  ServicePricingCreate,
  ServicePricingBatchUpdate,
  StorefrontConfig,
  StorefrontConfigCreate,
  StorefrontConfigUpdate,
  StorefrontItem,
  StorefrontItemCreate,
  StorefrontItemUpdate,
  StorefrontItemsReorder,
  PricingDiscount,
} from '@apartment-ultra/api-contract';

// 重新导出类型，保持向后兼容
export type {
  AdminTokenResponse,
  AdminPlatformStats,
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  AdminPasswordReset,
  AdminRole,
  AdminRoleCreate,
  AdminRoleUpdate,
  AdminOrganization,
  AdminOrganizationSetActive,
  AdminRegisteredUserOrg,
  AdminRegisteredUser,
  AdminRegisteredUserDetail,
  AdminRegisteredUserSetActive,
  AdminPlan,
  AdminPlanCreate,
  AdminPlanUpdate,
  AdminPlanPricingCreate,
  AdminSubscription,
  AdminSubscriptionRenew,
  AdminPlatformConfig,
  AdminUsagePricing,
  AdminUsagePricingUpdate,
  Promotion,
  PromotionCreate,
  PromotionUpdate,
  ServiceProduct,
  ServiceProductCreate,
  ServiceProductUpdate,
  ServicePricingCreate,
  ServicePricingBatchUpdate,
  StorefrontConfig,
  StorefrontConfigCreate,
  StorefrontConfigUpdate,
  StorefrontItem,
  StorefrontItemCreate,
  StorefrontItemUpdate,
  StorefrontItemsReorder,
  PricingDiscount,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function toAdminPlan(product: ServiceProduct): AdminPlan {
  const pricing = product.pricing ?? [];
  const monthlyPricing = pricing.find((item) => item.months === 1) ?? null;
  const yearlyPricing = pricing.find((item) => item.months === 12) ?? null;

  return {
    id: product.id,
    name: product.name,
    code: product.code,
    description: product.description,
    price_monthly: monthlyPricing?.price ?? 0,
    price_yearly: yearlyPricing?.price ?? (monthlyPricing ? monthlyPricing.price * 12 : 0),
    max_organizations: product.max_organizations,
    max_apartments: product.max_apartments,
    max_rooms: product.max_rooms,
    max_members: product.max_members,
    features: null,
    is_active: product.is_active,
    is_purchasable: product.code !== 'free',
    sort_order: product.sort_order,
    free_validity_days: null,
    created_at: product.created_at,
    updated_at: product.updated_at,
    pricing: pricing.map((item) => ({
      id: item.id,
      plan_id: product.id,
      months: item.months,
      price: item.price,
      is_active: item.is_active,
      is_purchasable: true,
      sort_order: item.sort_order,
      created_at: item.created_at,
      updated_at: item.updated_at,
    })),
  };
}

function mapAxiosData<TIn, TOut>(
  response: AxiosResponse<TIn>,
  mapper: (value: TIn) => TOut
): AxiosResponse<TOut> {
  return {
    ...response,
    data: mapper(response.data),
  };
}

export const adminApi = createAdminApiClient({
  baseURL: API_URL,
  adminTokenKey: 'admin_access_token',
  loginPath: '/login',
});

export const adminApiEndpoints = {
  // 系统初始化
  checkInitStatus: () =>
    adminApi.get<{ initialized: boolean }>('/admin/init/status'),
  setupSystem: (data: { username: string; password: string; name?: string }) =>
    adminApi.post<AdminTokenResponse>('/admin/init/setup', data),

  login: (username: string, password: string) =>
    adminApi.post<AdminTokenResponse>('/admin/auth/login', {
      username,
      password,
    }),

  getStats: () => adminApi.get<AdminPlatformStats>('/admin/stats'),

  // 运营账号
  listUsers: (params?: { skip?: number; limit?: number }) =>
    adminApi.get<AdminUser[]>('/admin/users', { params }),
  getMe: () => adminApi.get<AdminUser>('/admin/users/me'),
  getUser: (id: string) => adminApi.get<AdminUser>(`/admin/users/${id}`),
  createUser: (data: AdminUserCreate) => adminApi.post<AdminUser>('/admin/users', data),
  updateUser: (id: string, data: AdminUserUpdate) =>
    adminApi.put<AdminUser>(`/admin/users/${id}`, data),
  deleteUser: (id: string) => adminApi.delete(`/admin/users/${id}`),
  resetUserPassword: (id: string, data: AdminPasswordReset) =>
    adminApi.post(`/admin/users/${id}/reset-password`, data),

  // 运营角色
  listRoles: (params?: { skip?: number; limit?: number }) =>
    adminApi.get<AdminRole[]>('/admin/roles', { params }),
  getRole: (id: string) => adminApi.get<AdminRole>(`/admin/roles/${id}`),
  createRole: (data: AdminRoleCreate) => adminApi.post<AdminRole>('/admin/roles', data),
  updateRole: (id: string, data: AdminRoleUpdate) =>
    adminApi.put<AdminRole>(`/admin/roles/${id}`, data),
  deleteRole: (id: string) => adminApi.delete(`/admin/roles/${id}`),

  // 组织
  listOrganizations: (params?: { skip?: number; limit?: number; is_active?: boolean }) =>
    adminApi.get<AdminOrganization[]>('/admin/organizations', { params }),
  getOrganization: (id: string) => adminApi.get<AdminOrganization>(`/admin/organizations/${id}`),
  setOrganizationActive: (id: string, data: AdminOrganizationSetActive) =>
    adminApi.patch<AdminOrganization>(`/admin/organizations/${id}/active`, data),

  // 注册用户（业务侧账号）
  listRegisteredUsers: (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
  }) => adminApi.get<AdminRegisteredUser[]>('/admin/registered-users', { params }),
  getRegisteredUserCount: (params?: { is_active?: boolean; search?: string }) =>
    adminApi.get<{ total: number }>('/admin/registered-users/count', { params }),
  getRegisteredUser: (id: string) =>
    adminApi.get<AdminRegisteredUserDetail>(`/admin/registered-users/${id}`),
  setRegisteredUserActive: (id: string, data: AdminRegisteredUserSetActive) =>
    adminApi.patch<AdminRegisteredUser>(`/admin/registered-users/${id}/active`, data),
  deleteRegisteredUser: (id: string) => adminApi.delete(`/admin/registered-users/${id}`),

  // 服务
  listPlans: async (params?: { active_only?: boolean }) =>
    mapAxiosData(
      await adminApi.get<ServiceProduct[]>('/admin/service-products', {
        params: { is_active: params?.active_only, include_pricing: true },
      }),
      (products) => products.map(toAdminPlan)
    ),
  getPlan: async (id: string) =>
    mapAxiosData(
      await adminApi.get<ServiceProduct>(`/admin/service-products/${id}`),
      toAdminPlan
    ),
  createPlan: async (data: AdminPlanCreate) =>
    mapAxiosData(
      await adminApi.post<ServiceProduct>('/admin/service-products', {
        name: data.name,
        code: data.code,
        description: data.description ?? undefined,
        max_organizations: data.max_organizations,
        max_apartments: data.max_apartments,
        max_rooms: data.max_rooms,
        max_members: data.max_members,
        is_active: true,
        sort_order: data.sort_order ?? 0,
        pricing: data.pricing?.map((item) => ({
          months: item.months,
          price: item.price,
          is_active: item.is_active,
          sort_order: item.sort_order,
        })),
      }),
      toAdminPlan
    ),
  updatePlan: async (id: string, data: AdminPlanUpdate) =>
    mapAxiosData(
      await adminApi.put<ServiceProduct>(`/admin/service-products/${id}`, {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        max_organizations: data.max_organizations,
        max_apartments: data.max_apartments ?? undefined,
        max_rooms: data.max_rooms ?? undefined,
        max_members: data.max_members ?? undefined,
        is_active: data.is_active ?? undefined,
        sort_order: data.sort_order ?? undefined,
      }),
      toAdminPlan
    ),
  deletePlan: (id: string) => adminApi.delete(`/admin/service-products/${id}`),
  updatePlanPricing: async (planId: string, pricing: AdminPlanPricingCreate[]) =>
    mapAxiosData(
      await adminApi.put<ServiceProduct>(`/admin/service-products/${planId}/pricing`, {
        pricing: pricing.map((item) => ({
          months: item.months,
          price: item.price,
          is_active: item.is_active,
          sort_order: item.sort_order,
        })),
      }),
      toAdminPlan
    ),

  // 订阅
  listSubscriptions: (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    status_filter?: string;
  }) => adminApi.get<AdminSubscription[]>('/admin/subscriptions', { params }),
  getSubscription: (id: string) => adminApi.get<AdminSubscription>(`/admin/subscriptions/${id}`),
  renewSubscription: (id: string, data: AdminSubscriptionRenew) =>
    adminApi.post<AdminSubscription>(`/admin/subscriptions/${id}/renew`, data),
  cancelSubscription: (id: string) =>
    adminApi.post<AdminSubscription>(`/admin/subscriptions/${id}/cancel`),
  giftSubscription: (data: {
    organization_id: string;
    service_id: string;
    pricing_id?: string | null;
    billing_months: number;
    gift_months?: number;
  }) =>
    adminApi.post<AdminSubscription>('/admin/subscriptions/gift', data),

  // 品牌配置
  getPlatformConfig: () =>
    adminApi.get<{
      app_name: string;
      app_description: string;
      logo_url: string;
      favicon_url: string;
      login_subtitle: string;
      register_subtitle: string;
    }>('/admin/platform-config'),
  updatePlatformConfig: (data: {
    app_name: string;
    app_description: string;
    logo_url: string;
    favicon_url: string;
    login_subtitle: string;
    register_subtitle: string;
  }) => adminApi.put<unknown>('/admin/platform-config', data),

  // 按量定价
  getUsagePricing: () =>
    adminApi.get<{
      id: string;
      price_per_org: number;
      price_per_apartment: number;
      price_per_room: number;
      price_per_member: number;
    }>('/admin/usage-pricing'),
  updateUsagePricing: (data: {
    price_per_org?: number;
    price_per_apartment?: number;
    price_per_room?: number;
    price_per_member?: number;
  }) => adminApi.put<unknown>('/admin/usage-pricing', data),

  // 优惠活动
  listPromotions: (params?: { is_active?: boolean; plan_id?: string }) =>
    adminApi.get<Promotion[]>('/admin/promotions', { params }),
  getPromotion: (id: string) =>
    adminApi.get<Promotion>(`/admin/promotions/${id}`),
  createPromotion: (data: PromotionCreate) =>
    adminApi.post<Promotion>('/admin/promotions', data),
  updatePromotion: (id: string, data: PromotionUpdate) =>
    adminApi.put<Promotion>(`/admin/promotions/${id}`, data),
  deletePromotion: (id: string) =>
    adminApi.delete(`/admin/promotions/${id}`),
  addPlanToPromotion: (promotionId: string, planId: string) =>
    adminApi.post(`/admin/promotions/${promotionId}/plans`, { plan_id: planId }),
  removePlanFromPromotion: (promotionId: string, planId: string) =>
    adminApi.delete(`/admin/promotions/${promotionId}/plans/${planId}`),

  // 服务产品
  listServiceProducts: (params?: { is_active?: boolean }) =>
    adminApi.get<ServiceProduct[]>('/admin/service-products', { params }),
  getServiceProduct: (id: string) =>
    adminApi.get<ServiceProduct>(`/admin/service-products/${id}`),
  createServiceProduct: (data: ServiceProductCreate) =>
    adminApi.post<ServiceProduct>('/admin/service-products', data),
  updateServiceProduct: (id: string, data: ServiceProductUpdate) =>
    adminApi.put<ServiceProduct>(`/admin/service-products/${id}`, data),
  deleteServiceProduct: (id: string) =>
    adminApi.delete(`/admin/service-products/${id}`),
  updateServiceProductPricing: (id: string, data: ServicePricingBatchUpdate) =>
    adminApi.put<ServiceProduct>(`/admin/service-products/${id}/pricing`, data),

  // 商店配置
  listStorefronts: (params?: { is_active?: boolean }) =>
    adminApi.get<StorefrontConfig[]>('/admin/storefronts', { params }),
  getStorefront: (id: string) =>
    adminApi.get<StorefrontConfig>(`/admin/storefronts/${id}`),
  createStorefront: (data: StorefrontConfigCreate) =>
    adminApi.post<StorefrontConfig>('/admin/storefronts', data),
  updateStorefront: (id: string, data: StorefrontConfigUpdate) =>
    adminApi.put<StorefrontConfig>(`/admin/storefronts/${id}`, data),
  deleteStorefront: (id: string) =>
    adminApi.delete(`/admin/storefronts/${id}`),
  // 商店项
  addStorefrontItem: (storefrontId: string, data: StorefrontItemCreate) =>
    adminApi.post<StorefrontItem>(`/admin/storefronts/${storefrontId}/items`, data),
  updateStorefrontItem: (storefrontId: string, itemId: string, data: StorefrontItemUpdate) =>
    adminApi.put<StorefrontItem>(`/admin/storefronts/${storefrontId}/items/${itemId}`, data),
  deleteStorefrontItem: (storefrontId: string, itemId: string) =>
    adminApi.delete(`/admin/storefronts/${storefrontId}/items/${itemId}`),
  reorderStorefrontItems: (storefrontId: string, data: StorefrontItemsReorder) =>
    adminApi.put<void>(`/admin/storefronts/${storefrontId}/items/reorder`, data),
};
