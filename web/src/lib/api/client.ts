import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/**
 * 字段级错误
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * 验证错误数据
 */
export interface ValidationErrorData {
  errors: FieldError[];
}

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
        ? (data as ValidationErrorData).errors
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
    return this.code === 40001;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (response: AxiosResponse<any>) => {
    const { data: responseData } = response;

    // 如果响应是统一格式 {code, data, message}
    if (
      responseData &&
      typeof responseData === 'object' &&
      'code' in responseData
    ) {
      // 业务成功（code === 0）
      if (responseData.code === 0) {
        // 解包：返回 data 部分
        response.data = responseData.data;
        return response;
      }

      // 业务失败：抛出 ApiError
      const error = new ApiError(
        responseData.code,
        responseData.message,
        responseData.data
      );
      return Promise.reject(error);
    }

    // 非统一格式（如健康检查），直接返回
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 处理 401 认证失败
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            {
              refresh_token: refreshToken,
            }
          );

          // 处理统一响应格式：如果是 {code, data, message} 格式，需要解包
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = response.data as any;
          const tokenData =
            responseData && 'code' in responseData && 'data' in responseData
              ? responseData.data
              : responseData;
          const { access_token, refresh_token } = tokenData as {
            access_token: string;
            refresh_token: string;
          };

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

    // 处理统一格式的错误响应
    if (error.response?.data) {
      const responseData = error.response.data;
      if ('code' in responseData && 'message' in responseData) {
        return Promise.reject(
          new ApiError(responseData.code, responseData.message, responseData.data)
        );
      }
    }

    return Promise.reject(error);
  }
);

export default api;
