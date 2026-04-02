/**
 * 认证 API 模块
 *
 * 提供用户认证相关的 API 调用：
 * - 登录
 * - 注册
 * - 获取当前用户信息
 * - 刷新 Token
 */
import api from './client';
import type { User, LoginCredentials, RegisterData, TokenResponse } from '@/types';

/** 认证相关 API */
export const authApi = {
  /**
   * 用户登录
   * @param credentials 登录凭据（手机号 + 密码）
   * @returns Token 响应（access_token, refresh_token）
   */
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * 用户注册
   * @param data 注册信息（手机号、密码、姓名）
   * @returns 创建的用户信息
   */
  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  /**
   * 获取当前登录用户信息
   * @returns 当前用户信息
   */
  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   * @returns 新的 Token 响应
   */
  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

export default authApi;
