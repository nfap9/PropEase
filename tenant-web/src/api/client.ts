/**
 * API 客户端配置模块
 *
 * 基于 @apartment-ultra/web-api-client 包创建浏览器端 API 客户端：
 * - 自动附加 JWT Token 到请求头
 * - 自动处理 Token 刷新
 * - 401 响应自动跳转登录页
 *
 * 环境变量：
 * - VITE_API_URL: API 基础地址（默认 http://localhost:8000/api/v1）
 */
import {
  ApiError,
  createBrowserApiClient,
  type ApiResponse,
  type FieldError,
} from '@apartment-ultra/web-api-client';

// API 基础地址
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export type { ApiResponse, FieldError };
export { ApiError };

/**
 * 创建浏览器端 API 客户端
 * 配置了 Token 管理和自动刷新
 */
export const api = createBrowserApiClient({
  baseURL: API_URL,
  // localStorage 中的 access_token key
  accessTokenKey: 'access_token',
  // localStorage 中的 refresh_token key
  refreshTokenKey: 'refresh_token',
  // 刷新 Token 的接口路径
  refreshPath: '/auth/refresh',
  // 401 时跳转的登录页路径
  loginPath: '/tenant/login',
  // 启用 Token 自动刷新
  enableRefresh: true,
  // 不静默处理 401 错误（跳登录页）
  suppressUnauthorizedError: false,
});

export default api;
