/**
 * 运营后台 API 客户端。
 * 使用独立的 admin_access_token，与业务端 access_token 分离。
 */
import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface WrappedResponse<T> {
  code: number;
  data: T;
  message: string;
}

export const adminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
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
  (error) => Promise.reject(error)
);

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
  /** 系统预置账号不可删除，后端必返（默认 false） */
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

/** 运营侧注册用户（业务侧账号） */
export interface AdminRegisteredUserOrg {
  id: string;
  name: string;
  slug: string;
  role: string;
}

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

/** 套餐（运营侧与业务侧结构一致） */
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
  created_at: string;
  updated_at: string;
}

export interface AdminPlanCreate {
  name: string;
  code: string;
  description?: string | null;
  price_monthly: number;
  price_yearly: number;
  /** 用户最多可拥有的组织数，null 表示不限制 */
  max_organizations?: number | null;
  max_apartments: number;
  max_rooms: number;
  max_members: number;
  features?: Record<string, unknown> | null;
  sort_order?: number;
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
}

/** 订阅（运营侧） */
export interface AdminSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
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
  getOrganization: (id: string) =>
    adminApi.get<AdminOrganization>(`/admin/organizations/${id}`),
  setOrganizationActive: (id: string, data: AdminOrganizationSetActive) =>
    adminApi.patch<AdminOrganization>(`/admin/organizations/${id}/active`, data),

  // 注册用户（业务侧账号）
  listRegisteredUsers: (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
  }) => adminApi.get<AdminRegisteredUser[]>('/admin/registered-users', { params }),
  getRegisteredUserCount: (params?: {
    is_active?: boolean;
    search?: string;
  }) => adminApi.get<{ total: number }>('/admin/registered-users/count', { params }),
  getRegisteredUser: (id: string) =>
    adminApi.get<AdminRegisteredUserDetail>(`/admin/registered-users/${id}`),
  setRegisteredUserActive: (
    id: string,
    data: AdminRegisteredUserSetActive
  ) =>
    adminApi.patch<AdminRegisteredUser>(
      `/admin/registered-users/${id}/active`,
      data
    ),
  deleteRegisteredUser: (id: string) =>
    adminApi.delete(`/admin/registered-users/${id}`),

  // 套餐
  listPlans: (params?: { active_only?: boolean }) =>
    adminApi.get<AdminPlan[]>('/admin/plans', { params }),
  getPlan: (id: string) => adminApi.get<AdminPlan>(`/admin/plans/${id}`),
  createPlan: (data: AdminPlanCreate) => adminApi.post<AdminPlan>('/admin/plans', data),
  updatePlan: (id: string, data: AdminPlanUpdate) =>
    adminApi.put<AdminPlan>(`/admin/plans/${id}`, data),
  deletePlan: (id: string) => adminApi.delete(`/admin/plans/${id}`),

  // 订阅
  listSubscriptions: (params?: {
    skip?: number;
    limit?: number;
    organization_id?: string;
    status_filter?: string;
  }) => adminApi.get<AdminSubscription[]>('/admin/subscriptions', { params }),
  getSubscription: (id: string) =>
    adminApi.get<AdminSubscription>(`/admin/subscriptions/${id}`),
  renewSubscription: (id: string, data: AdminSubscriptionRenew) =>
    adminApi.post<AdminSubscription>(`/admin/subscriptions/${id}/renew`, data),
  cancelSubscription: (id: string) =>
    adminApi.post<AdminSubscription>(`/admin/subscriptions/${id}/cancel`),
};
