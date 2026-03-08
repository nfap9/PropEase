import Taro from '@tarojs/taro';
import type { SuccessBody } from '@apartment-ultra/api-contract';

// 从 Taro defineConstants 获取 API URL
// @ts-ignore
const API_URL = typeof TARO_APP_API_URL !== 'undefined' ? TARO_APP_API_URL : 'http://localhost:8000/api/v1';

/**
 * API 错误类
 */
export class ApiError extends Error {
  code: number;
  data: unknown;

  constructor(code: number, message: string, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
  }
}

interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  params?: Record<string, unknown>;
}

/**
 * API 客户端
 */
class ApiClient {
  private baseURL: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAccessToken(): string | null {
    return Taro.getStorageSync('access_token') || null;
  }

  private buildUrl(url: string, params?: Record<string, unknown>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    if (!params) return fullUrl;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const token = this.getAccessToken();

    try {
      const response = await Taro.request({
        url: this.buildUrl(options.url, options.params),
        method: options.method,
        data: options.data,
        header: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const { data, statusCode } = response;

      // 处理统一响应格式 {code, data, message}
      if (data && typeof data === 'object' && 'code' in data) {
        if (data.code === 0) {
          return data.data as T;
        }

        // 401 处理：尝试刷新 token
        if (data.code === 401 || statusCode === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.request<T>(options);
          }
          // 刷新失败，清除登录状态
          await this.clearAuth();
          Taro.reLaunch({ url: '/pages/auth/login/index' });
        }

        throw new ApiError(data.code, data.message || '请求失败', data.data);
      }

      // 非统一格式直接返回
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // 网络错误等
      throw new ApiError(-1, error instanceof Error ? error.message : '网络错误');
    }
  }

  /**
   * 刷新 Token（防止并发刷新）
   */
  private async refreshToken(): Promise<boolean> {
    // 如果已经有正在进行的刷新请求，等待它完成
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefreshToken();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = Taro.getStorageSync('refresh_token');
      if (!refreshToken) return false;

      const response = await Taro.request({
        url: `${this.baseURL}/auth/refresh`,
        method: 'POST',
        data: { refresh_token: refreshToken },
        header: { 'Content-Type': 'application/json' },
      });

      const data = response.data as SuccessBody<{ access_token: string; refresh_token: string }>;
      if (data.code === 0) {
        Taro.setStorageSync('access_token', data.data.access_token);
        Taro.setStorageSync('refresh_token', data.data.refresh_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async clearAuth(): Promise<void> {
    Taro.removeStorageSync('access_token');
    Taro.removeStorageSync('refresh_token');
    Taro.removeStorageSync('current_organization_id');
  }

  get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({ url, method: 'GET', params });
  }

  post<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>({ url, method: 'POST', data });
  }

  put<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>({ url, method: 'PUT', data });
  }

  delete<T>(url: string): Promise<T> {
    return this.request<T>({ url, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);
export default api;
