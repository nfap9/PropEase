import { APIRequestContext } from '@playwright/test';

/**
 * API 基础 URL
 */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

/**
 * API 辅助类
 */
export class ApiHelper {
  private request: APIRequestContext;
  private baseUrl: string;
  private token?: string;
  private orgId?: string;

  constructor(request: APIRequestContext, baseUrl: string = API_BASE_URL) {
    this.request = request;
    this.baseUrl = baseUrl;
  }

  /**
   * 设置认证 token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 设置组织 ID
   */
  setOrgId(orgId: string): void {
    this.orgId = orgId;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.orgId) {
      headers['x-org-id'] = this.orgId;
    }
    return headers;
  }

  /**
   * 解包 API 响应
   * API 使用 responseWrapper 中间件，返回格式为 { code: 0, data: T, message?: string }
   */
  private unwrapResponse<T>(response: { code: number; data: T; message?: string }): T {
    if (response.code !== 0) {
      throw new Error(`API error: ${response.message || 'Unknown error'}`);
    }
    return response.data;
  }

  /**
   * GET 请求
   */
  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const response = await this.request.get(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      params,
    });
    const json = await response.json();
    return this.unwrapResponse<T>(json);
  }

  /**
   * GET 请求（不解包，返回原始响应）
   */
  async getRaw<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const response = await this.request.get(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      params,
    });
    return response.json();
  }

  /**
   * POST 请求
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request.post(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body,
    });
    const json = await response.json();
    return this.unwrapResponse<T>(json);
  }

  /**
   * POST 请求（不解包，返回原始响应）
   */
  async postRaw<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request.post(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body,
    });
    return response.json();
  }

  /**
   * PUT 请求
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request.put(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body,
    });
    const json = await response.json();
    return this.unwrapResponse<T>(json);
  }

  /**
   * DELETE 请求
   */
  async delete<T>(path: string): Promise<T> {
    const response = await this.request.delete(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
    });
    const json = await response.json();
    return this.unwrapResponse<T>(json);
  }

  /**
   * PATCH 请求
   */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request.patch(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(),
      data: body,
    });
    const json = await response.json();
    return this.unwrapResponse<T>(json);
  }
}

/**
 * 创建 API 辅助实例
 */
export function createApiHelper(request: APIRequestContext, baseUrl?: string): ApiHelper {
  return new ApiHelper(request, baseUrl);
}

/**
 * API 登录获取 token
 */
export async function apiLogin(
  request: APIRequestContext,
  phone: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
    data: { phone, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  const responseData = await response.json();
  // 处理包装后的响应格式
  const data = responseData.data || responseData;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}
