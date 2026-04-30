import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { hashPassword } from '../utils/security.js';
import { createAdminAccessToken } from '../utils/jwt.js';
import { BusinessCode } from '@propease/api-contract';

/**
 * 初始化输入
 */
export interface SetupInput {
  username: string;
  password: string;
  name?: string;
}

/**
 * 初始化结果
 */
export interface SetupResult {
  access_token: string;
  token_type: string;
}

/**
 * 检查系统是否已初始化（是否有管理员账号）
 */
export async function isSystemInitialized(): Promise<boolean> {
  const count = await prisma.adminUser.count();
  return count > 0;
}

/**
 * 密码强度验证
 * 要求：至少8位，包含大写字母、小写字母、数字、特殊字符
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: '密码必须包含特殊字符' };
  }
  return { valid: true };
}

/**
 * 执行系统初始化，创建第一个超级管理员
 */
export async function setupInitialAdmin(input: SetupInput): Promise<SetupResult> {
  // 1. 检查是否已初始化
  const initialized = await isSystemInitialized();
  if (initialized) {
    throw createAppError(409, '系统已初始化', { businessCode: BusinessCode.CONFLICT });
  }

  // 2. 验证输入
  if (!input.username || input.username.trim().length === 0) {
    throw createAppError(400, '用户名不能为空');
  }
  if (input.username.length < 3 || input.username.length > 64) {
    throw createAppError(400, '用户名长度应为3-64个字符');
  }

  const passwordValidation = validatePasswordStrength(input.password);
  if (!passwordValidation.valid) {
    throw createAppError(400, passwordValidation.message!);
  }

  // 3. 创建超级管理员
  const passwordHash = await hashPassword(input.password);
  const admin = await prisma.adminUser.create({
    data: {
      id: ulid().toLowerCase(),
      username: input.username.trim(),
      password_hash: passwordHash,
      name: input.name?.trim() || '超级管理员',
      is_active: true,
      is_system: true,
    },
  });

  // 5. 生成访问令牌
  const access_token = createAdminAccessToken(admin.id);

  return {
    access_token,
    token_type: 'bearer',
  };
}
