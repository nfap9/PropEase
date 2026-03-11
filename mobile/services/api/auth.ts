import api from './client'
import type {
  User,
  LoginCredentials,
  RegisterData,
  TokenResponse,
  SendSmsCodeData,
} from '@apartment-ultra/api-contract'

export const authApi = {
  /**
   * 用户登录
   */
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    return api.post<TokenResponse>('/auth/login', credentials, { skipAuth: true })
  },

  /**
   * 用户注册
   */
  register: async (data: RegisterData): Promise<TokenResponse> => {
    return api.post<TokenResponse>('/auth/register', data, { skipAuth: true })
  },

  /**
   * 发送短信验证码
   */
  sendSmsCode: async (data: SendSmsCodeData): Promise<void> => {
    return api.post<void>('/auth/sms/send', data, { skipAuth: true })
  },

  /**
   * 刷新 token
   */
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    return api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }, { skipAuth: true })
  },

  /**
   * 获取当前用户信息
   */
  getMe: async (): Promise<User> => {
    return api.get<User>('/auth/me')
  },
}

export default authApi
