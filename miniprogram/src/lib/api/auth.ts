import api from './client';
import type {
  User,
  TokenResponse,
  LoginCredentials,
  RegisterData,
  SendSmsCodeData,
} from '@apartment-ultra/api-contract';

export const authApi = {
  /**
   * 登录
   */
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    return api.post<TokenResponse>('/auth/login', credentials);
  },

  /**
   * 注册
   */
  register: async (data: RegisterData): Promise<TokenResponse> => {
    return api.post<TokenResponse>('/auth/register', data);
  },

  /**
   * 发送短信验证码
   */
  sendSmsCode: async (data: SendSmsCodeData): Promise<void> => {
    await api.post('/auth/sms/send', data);
  },

  /**
   * 获取当前用户信息
   */
  getMe: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },
};
