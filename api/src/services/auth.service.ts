import type { AuthRepository } from '../repositories/auth.repo.js';
import { defaultAuthRepo } from '../repositories/auth.repo.js';
import { hashPassword, verifyPassword } from '../utils/security.js';
import { createAccessToken, createRefreshToken, decodeToken } from '../utils/jwt.js';
import { createAppError } from '../utils/appError.js';
import { ulid } from 'ulid';

/**
 * 注册输入（无需短信验证）
 */
export interface RegisterInput {
  phone: string;
  full_name: string;
  password: string;
}

/**
 * 登录输入（仅支持密码登录）
 */
export interface LoginInput {
  phone: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/**
 * 用户信息响应
 */
export interface UserInfo {
  id: string;
  phone: string | null;
  full_name: string | null;
  is_active: boolean;
  created_at: Date;
}

/**
 * Auth Service 接口
 */
export interface AuthService {
  register(data: RegisterInput): Promise<UserInfo>;
  login(data: LoginInput): Promise<LoginResult>;
  refreshToken(refreshToken: string): Promise<LoginResult>;
  getUserById(id: string): Promise<UserInfo | null>;
}

/**
 * 创建 Auth Service 实例
 */
export function createAuthService(
  getRepo: () => AuthRepository = () => defaultAuthRepo
): AuthService {
  return {
    register: async (data: RegisterInput) => {
      const { phone, full_name, password } = data;

      // 检查手机号是否已注册
      const existing = await getRepo().findUserByPhone(phone);
      if (existing) {
        throw createAppError(400, '手机号已注册');
      }

      // 创建用户
      const passwordHash = await hashPassword(password);
      const userId = ulid().toLowerCase();
      const user = await getRepo().createUser({
        id: userId,
        phone,
        full_name,
        password_hash: passwordHash,
      });

      return {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        is_active: user.is_active,
        created_at: user.created_at,
      };
    },

    login: async (data: LoginInput) => {
      const { phone, password } = data;

      const user = await getRepo().findUserByPhone(phone);
      if (!user) {
        throw createAppError(401, '手机号或密码错误');
      }

      // 仅支持密码登录
      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) {
        throw createAppError(401, '手机号或密码错误');
      }

      if (!user.is_active) {
        throw createAppError(401, '账号已停用或不允许登录');
      }

      const access_token = createAccessToken({ sub: user.id, phone: user.phone });
      const refresh_token = createRefreshToken({ sub: user.id, phone: user.phone });

      return {
        access_token,
        refresh_token,
        token_type: 'bearer',
      };
    },

    refreshToken: async (refreshToken: string) => {
      const payload = decodeToken(refreshToken);
      if (!payload || (payload.type as string) !== 'refresh') {
        throw createAppError(401, 'Could not validate credentials');
      }

      const sub = payload.sub as string;
      const user = await getRepo().findUserById(sub);
      if (!user || !user.is_active) {
        throw createAppError(401, 'Could not validate credentials');
      }

      const access_token = createAccessToken({ sub: user.id, phone: user.phone });
      const refresh_token = createRefreshToken({ sub: user.id, phone: user.phone });

      return {
        access_token,
        refresh_token,
        token_type: 'bearer',
      };
    },

    getUserById: async (id: string) => {
      const user = await getRepo().findUserById(id);
      if (!user) return null;
      return {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        is_active: user.is_active,
        created_at: user.created_at,
      };
    },
  };
}

/**
 * 默认实例
 */
export const defaultAuthService = createAuthService();
