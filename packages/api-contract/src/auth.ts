/** 用户 */
export interface User {
  id: string;
  phone: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

/** 登录凭证 */
export interface LoginCredentials {
  phone: string;
  password?: string;
  verification_code?: string;
}

/** 注册数据 */
export interface RegisterData {
  phone: string;
  password: string;
  full_name: string;
  verification_code: string;
}

/** 发送短信验证码 */
export interface SendSmsCodeData {
  phone: string;
  purpose: 'login' | 'register';
}

/** 令牌响应 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
