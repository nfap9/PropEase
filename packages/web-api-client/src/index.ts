import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosResponse,
  type AxiosInstance,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  BusinessCode,
  type ErrorResponseBody,
  type ErrorResponseData,
  type FieldError,
  type SuccessBody,
} from '@apartment-ultra/api-contract';
import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

type RawApiPayload = SuccessBody<unknown> | Record<string, unknown>;

export type ApiResponse<T = unknown> = SuccessBody<T>;
export type { FieldError };

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export interface TokenStorage {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (tokens: TokenPair) => void;
  clearTokens: () => void;
}

export interface CreateApiClientOptions {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  tokenStorage?: TokenStorage;
  refreshTokens?: (refreshToken: string) => Promise<TokenPair>;
  onAuthFailure?: () => void;
  suppressUnauthorizedError?: boolean;
}

export interface CreateBrowserApiClientOptions {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  accessTokenKey?: string;
  refreshTokenKey?: string;
  refreshPath?: string;
  loginPath?: string;
  enableRefresh?: boolean;
  suppressUnauthorizedError?: boolean;
}

/**
 * 统一 API 错误类
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

  getFieldError(field: string): string | undefined {
    return this.fieldErrors.find((error) => error.field === field)?.message;
  }

  isValidationError(): boolean {
    return this.code === BusinessCode.VALIDATION_ERROR;
  }
}

function unwrapRefreshResponse(
  response: SuccessBody<TokenPair> | TokenPair
): TokenPair {
  if (
    response &&
    typeof response === 'object' &&
    'code' in response &&
    response.code === 0 &&
    'data' in response
  ) {
    return response.data;
  }

  return response as TokenPair;
}

function toAxiosHeaders(headers?: Record<string, string>): AxiosRequestHeaders {
  return new AxiosHeaders(headers) as AxiosRequestHeaders;
}

export function createApiClient(options: CreateApiClientOptions): AxiosInstance {
  const api = axios.create({
    baseURL: options.baseURL,
    headers: toAxiosHeaders({
      'Content-Type': 'application/json',
      ...(options.defaultHeaders ?? {}),
    }),
  });

  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = options.tokenStorage?.getAccessToken();
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response: AxiosResponse<RawApiPayload>) => {
      const responseData = response.data;

      if (responseData && typeof responseData === 'object' && 'code' in responseData) {
        if (responseData.code === 0) {
          (response as AxiosResponse<unknown>).data = responseData.data;
          return response as AxiosResponse<unknown>;
        }

        const errorBody = responseData as ErrorResponseBody;
        return Promise.reject(new ApiError(errorBody.code, errorBody.message, errorBody.data));
      }

      return response as AxiosResponse<unknown>;
    },
    async (error: AxiosError<ErrorResponseBody>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (
        error.response?.status === 401 &&
        !originalRequest?._retry &&
        options.refreshTokens &&
        options.tokenStorage
      ) {
        originalRequest._retry = true;

        try {
          const refreshToken = options.tokenStorage.getRefreshToken();
          if (refreshToken) {
            const tokens = await options.refreshTokens(refreshToken);
            options.tokenStorage.setTokens(tokens);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
            }

            return api(originalRequest);
          }
        } catch {
          // fall through to auth failure handling
        }
      }

      if (error.response?.status === 401) {
        options.tokenStorage?.clearTokens();
        options.onAuthFailure?.();

        if (options.suppressUnauthorizedError) {
          return new Promise(() => {});
        }
      }

      if (error.response?.data && typeof error.response.data === 'object') {
        const responseData = error.response.data as unknown as Record<string, unknown>;
        const message = typeof responseData.message === 'string' ? responseData.message : null;

        if (message) {
          const code =
            typeof responseData.code === 'number'
              ? responseData.code
              : (error.response.status ?? 500);

          return Promise.reject(new ApiError(code, message, responseData.data ?? responseData));
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
}

export function createLocalStorageTokenStorage(
  accessTokenKey = 'access_token',
  refreshTokenKey = 'refresh_token'
): TokenStorage {
  return {
    getAccessToken: () => {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(accessTokenKey);
    },
    getRefreshToken: () => {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(refreshTokenKey);
    },
    setTokens: (tokens) => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(accessTokenKey, tokens.access_token);
      window.localStorage.setItem(refreshTokenKey, tokens.refresh_token);
    },
    clearTokens: () => {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(accessTokenKey);
      window.localStorage.removeItem(refreshTokenKey);
    },
  };
}

export function createBrowserApiClient(
  options: CreateBrowserApiClientOptions
): AxiosInstance {
  const tokenStorage = createLocalStorageTokenStorage(
    options.accessTokenKey,
    options.refreshTokenKey
  );
  const refreshPath = options.refreshPath ?? '/auth/refresh';
  const loginPath = options.loginPath ?? '/login';
  const enableRefresh = options.enableRefresh ?? true;

  return createApiClient({
    baseURL: options.baseURL,
    defaultHeaders: options.defaultHeaders,
    tokenStorage,
    refreshTokens: enableRefresh
      ? async (refreshToken) => {
          const response = await axios.post<SuccessBody<TokenPair> | TokenPair>(
            `${options.baseURL}${refreshPath}`,
            { refresh_token: refreshToken }
          );
          return unwrapRefreshResponse(response.data);
        }
      : undefined,
    onAuthFailure: () => {
      if (typeof window === 'undefined') return;
      if (!window.location.pathname.startsWith(loginPath)) {
        window.location.href = loginPath;
      }
    },
    suppressUnauthorizedError: options.suppressUnauthorizedError,
  });
}

export interface AdminApiConfig {
  baseURL: string;
  adminTokenKey?: string;
  loginPath?: string;
}

export function createAdminApiClient(config: AdminApiConfig): AxiosInstance {
  const tokenStorage = createLocalStorageTokenStorage(
    config.adminTokenKey ?? 'admin_access_token',
    'admin_refresh_token'
  );

  return createApiClient({
    baseURL: config.baseURL,
    tokenStorage,
    refreshTokens: undefined,
    onAuthFailure: () => {
      if (typeof window === 'undefined') return;
      if (!window.location.pathname.startsWith(config.loginPath ?? '/login')) {
        window.location.href = config.loginPath ?? '/login';
      }
    },
    suppressUnauthorizedError: true,
  });
}

interface ErrorMessageBody {
  message?: string;
  data?: { errors?: Array<{ field?: string; message?: string }> };
}

export function getErrorMessage(error: unknown, fallback = '操作失败，请重试'): string {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as AxiosError<ErrorMessageBody>).response?.data;
    if (response && typeof response === 'object') {
      if (typeof response.message === 'string' && response.message) {
        return response.message;
      }

      const firstFieldError = response.data?.errors?.[0]?.message;
      if (typeof firstFieldError === 'string' && firstFieldError) {
        return firstFieldError;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function filterEmptyStrings<T extends Record<string, unknown>>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== '')) as Partial<T>;
}

export function setFormErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown
): void {
  if (error instanceof ApiError && error.fieldErrors.length > 0) {
    error.fieldErrors.forEach((fieldError) => {
      const fieldName = fieldError.field.replace(/^body\./, '') as FieldPath<T>;
      setError(fieldName, {
        type: 'server',
        message: fieldError.message,
      });
    });
  }
}

export function extractFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.fieldErrors.length > 0) {
    return Object.fromEntries(
      error.fieldErrors.map((fieldError) => [
        fieldError.field.replace(/^body\./, ''),
        fieldError.message,
      ])
    );
  }

  return {};
}
