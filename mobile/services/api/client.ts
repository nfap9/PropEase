import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import {
  type SuccessBody,
  type ErrorResponseBody,
  type FieldError,
  type ErrorResponseData,
  BusinessCode,
} from '@apartment-ultra/api-contract'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/** 统一 API 成功响应格式 */
export type ApiResponse<T = unknown> = SuccessBody<T>

export type { FieldError }

/**
 * API 错误类
 */
export class ApiError extends Error {
  code: number
  data: unknown
  fieldErrors: FieldError[]

  constructor(code: number, message: string, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
    this.fieldErrors =
      data && typeof data === 'object' && 'errors' in data
        ? ((data as ErrorResponseData).errors ?? [])
        : []
  }

  /**
   * 获取指定字段的错误信息
   */
  getFieldError(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.message
  }

  /**
   * 是否为验证错误
   */
  isValidationError(): boolean {
    return this.code === BusinessCode.VALIDATION_ERROR
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: unknown
  headers?: Record<string, string>
  skipOrgId?: boolean
  skipAuth?: boolean
}

/**
 * 获取存储的 token
 */
async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('access_token')
  } catch {
    return null
  }
}

/**
 * 获取存储的组织 ID
 */
async function getOrgId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('current_organization_id')
  } catch {
    return null
  }
}

/**
 * 处理 401 认证失败 - 尝试刷新 token
 */
async function handleUnauthorized(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync('refresh_token')
    if (!refreshToken) {
      return false
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      return false
    }

    const responseData = await response.json()
    const tokenData =
      responseData && 'code' in responseData && responseData.code === 0
        ? responseData.data
        : responseData

    const { access_token, refresh_token } = tokenData
    await SecureStore.setItemAsync('access_token', access_token)
    await SecureStore.setItemAsync('refresh_token', refresh_token)

    return true
  } catch {
    return false
  }
}

/**
 * 清除认证信息并跳转到登录页
 */
async function clearAuthAndRedirect(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    await SecureStore.deleteItemAsync('user')
    await SecureStore.deleteItemAsync('current_organization_id')
  } catch {
    // ignore
  }
  router.replace('/login')
}

/**
 * 统一请求封装
 */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, headers = {}, skipOrgId = false, skipAuth = false } = options

  // 构建 headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (!skipAuth) {
    const token = await getToken()
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }

    if (!skipOrgId) {
      const orgId = await getOrgId()
      if (orgId) {
        requestHeaders['x-org-id'] = orgId
      }
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (data && method !== 'GET') {
    fetchOptions.body = JSON.stringify(data)
  }

  let response = await fetch(`${API_URL}${url}`, fetchOptions)

  // 处理 401 - 尝试刷新 token
  if (response.status === 401 && !skipAuth) {
    const refreshed = await handleUnauthorized()
    if (refreshed) {
      // 重试请求
      const newToken = await getToken()
      if (newToken) {
        requestHeaders['Authorization'] = `Bearer ${newToken}`
      }
      response = await fetch(`${API_URL}${url}`, {
        ...fetchOptions,
        headers: requestHeaders,
      })
    } else {
      await clearAuthAndRedirect()
      throw new ApiError(401, '认证已过期，请重新登录')
    }
  }

  // 解析响应
  const responseData = await response.json()

  // 处理统一响应格式 {code, data, message}
  if (responseData && typeof responseData === 'object' && 'code' in responseData) {
    if (responseData.code === 0) {
      return responseData.data as T
    }

    // 业务失败
    const errBody = responseData as ErrorResponseBody
    throw new ApiError(errBody.code, errBody.message, errBody.data)
  }

  // 非统一格式，直接返回
  return responseData as T
}

/**
 * API 客户端对象
 */
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>, options?: RequestOptions) => {
    const queryString = params
      ? '?' +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : ''
    return request<T>(url + queryString, { ...options, method: 'GET' })
  },

  post: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'POST', data }),

  put: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'PUT', data }),

  patch: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'PATCH', data }),

  delete: <T>(url: string, data?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE', data }),
}

export default api
