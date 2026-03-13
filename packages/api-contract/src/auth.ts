/** 用户 */
export interface User {
  id: string;
  phone: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

/** 登录凭证（仅支持密码登录） */
export interface LoginCredentials {
  phone: string;
  password: string;
}

/** 注册数据（无需短信验证） */
export interface RegisterData {
  phone: string;
  password: string;
  full_name: string;
}

/** 令牌响应 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
