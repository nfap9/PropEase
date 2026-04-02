/**
 * 密码安全模块
 *
 * 使用 bcryptjs 实现密码的哈希与验证：
 * - 哈希：单向加密存储，不可逆
 * - 验证：比对明文与哈希值
 *
 * bcrypt 自动生成盐值，防止彩虹表攻击
 */
import bcrypt from 'bcryptjs';

// bcrypt 盐值轮数，10 轮是安全与性能的平衡点
const SALT_ROUNDS = 10;

/**
 * 哈希密码
 * @param plain 明文密码
 * @returns 加密后的哈希值
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param plain 明文密码
 * @param hashed 存储的哈希值
 * @returns 是否匹配
 */
export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
