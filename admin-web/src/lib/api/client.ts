import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  type SuccessBody,
  type ErrorResponseBody,
  type FieldError,
  type ErrorResponseData,
  BusinessCode,
} from '@apartment-ultra/api-contract';

/** 统一格式的原始响应（可能是成功包装或健康检查等未包装） */
type RawApiPayload = SuccessBody<unknown> | Record<string, unknown>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** 统一 API 成功响应格式（与共享契约一致） */
export type ApiResponse<T = unknown> = SuccessBody<T>;

export type { FieldError };

/**
 * API 错误类
 */
export class ApiError extends Error {
  code: number;
  data: unknown;
  fieldErrors: FieldError[];

  constructor(code: number, message: string, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
    this.fieldErrors =
      data && typeof data === 'object' && 'errors' in data
        ? ((data as ErrorResponseData).errors ?? [])
        : [];
  }

  /**
   * 获取指定字段的错误信息
   */
  getFieldError(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.message;
  }

  /**
   * 是否为验证错误
   */
  isValidationError(): boolean {
    return this.code === BusinessCode.VALIDATION_ERROR;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to unwrap unified response format
api.interceptors.response.use(
  (response: AxiosResponse<RawApiPayload>) => {
    const responseData = response.data;

    // 如果响应是统一格式 {code, data, message}
    if (responseData && typeof responseData === 'object' && 'code' in responseData) {
      // 业务成功（code === 0）
      if (responseData.code === 0) {
        // 解包：返回 data 部分
        (response as AxiosResponse<unknown>).data = responseData.data;
        return response as AxiosResponse<unknown>;
      }

      // 业务失败：抛出 ApiError
      const errBody = responseData as ErrorResponseBody;
      const error = new ApiError(errBody.code, errBody.message, errBody.data);
      return Promise.reject(error) as Promise<AxiosResponse<unknown>>;
    }

    // 非统一格式（如健康检查），直接返回
    return response as AxiosResponse<unknown>;
  },
  async (error: AxiosError<ErrorResponseBody>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 处理 401 认证失败
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          // 处理统一响应格式：如果是 {code, data, message} 格式，需要解包
          const responseData = response.data as
            | SuccessBody<{ access_token: string; refresh_token: string }>
            | { access_token: string; refresh_token: string };
          const tokenData: { access_token: string; refresh_token: string } =
            responseData &&
            'code' in responseData &&
            responseData.code === 0 &&
            'data' in responseData
              ? responseData.data
              : (responseData as { access_token: string; refresh_token: string });
          const { access_token, refresh_token } = tokenData;

          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        }
      } catch {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // 处理错误响应：优先使用接口返回的 message
    if (error.response?.data && typeof error.response.data === 'object') {
      const responseData = error.response.data as unknown as Record<string, unknown>;
      const msg = typeof responseData.message === 'string' ? responseData.message : null;
      if (msg) {
        const code =
          typeof responseData.code === 'number' ? responseData.code : error.response.status || 500;
        return Promise.reject(new ApiError(code, msg, responseData.data ?? responseData));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
