/**
 * 运营后台 API 客户端。
 * 使用独立的 admin_access_token，与业务端 access_token 分离。
 */
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './client';
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
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface WrappedResponse<T> {
  code: number;
  data: T;
  message: string;
}

export const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

adminApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response: AxiosResponse<WrappedResponse<unknown>>) => {
    const body = response.data;
    if (body && typeof body === 'object' && body.code === 0 && 'data' in body) {
      response.data = body.data as AxiosResponse['data'];
    }
    return response;
  },
  (error: AxiosError<Record<string, unknown>>) => {
    // 优先使用接口响应的 message，保持与业务端一致
    if (error.response?.data && typeof error.response.data === 'object') {
      const responseData = error.response.data;
      const msg = typeof responseData.message === 'string' ? responseData.message : null;
      if (msg) {
        const code =
          typeof responseData.code === 'number'
            ? responseData.code
            : (error.response.status ?? 500);
        return Promise.reject(new ApiError(code, msg, responseData.data ?? responseData));
      }
    }
    return Promise.reject(error);
  }
);

export const adminApiEndpoints = {
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

  // 套餐
  listPlans: (params?: { active_only?: boolean }) =>
    adminApi.get<AdminPlan[]>('/admin/plans', { params }),
  getPlan: (id: string) => adminApi.get<AdminPlan>(`/admin/plans/${id}`),
  createPlan: (data: AdminPlanCreate) => adminApi.post<AdminPlan>('/admin/plans', data),
  updatePlan: (id: string, data: AdminPlanUpdate) =>
    adminApi.put<AdminPlan>(`/admin/plans/${id}`, data),
  deletePlan: (id: string) => adminApi.delete(`/admin/plans/${id}`),
  updatePlanPricing: (planId: string, pricing: AdminPlanPricingCreate[]) =>
    adminApi.put(`/admin/plans/${planId}/pricing`, { pricing }),

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
};
