/**
 * JWT 令牌工具模块
 *
 * 实现 HS256 算法的 JWT 签名与验证：
 * - Access Token：短期令牌，用于 API 认证
 * - Refresh Token：长期令牌，用于刷新 Access Token
 * - Admin Access Token：管理员专用短期令牌
 *
 * 注意：项目采用手动实现而非 jsonwebtoken 库，以减少外部依赖
 */
import crypto from 'node:crypto';
import { config } from '../config.js';

// JWT 算法和类型标识
const ALG = 'HS256';
const TYP = 'JWT';

/**
 * Base64URL 编码（RFC 4648）
 * - 将 +/= 替换为 -_. 符合 JWT Base64URL 安全编码
 */
function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 签名 JWT
 * @param payload 负载数据
 * @param expiresInMinutes 过期时间（分钟）
 * @returns JWT 字符串 (header.payload.signature)
 */
function sign(payload: Record<string, unknown>, expiresInMinutes: number): string {
  const header = { alg: ALG, typ: TYP };
  const now = Math.floor(Date.now() / 1000);
  // 添加过期时间 exp 字段
  const payloadWithExp = { ...payload, exp: now + expiresInMinutes * 60 };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payloadWithExp));
  // HMAC-SHA256 签名
  const signature = crypto
    .createHmac('sha256', config.secretKey)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const sigB64 = base64UrlEncode(signature);
  return `${headerB64}.${payloadB64}.${sigB64}`;
}

/**
 * 验证 JWT 完整性并检查过期
 * @param token JWT 字符串
 * @returns 解码后的 payload 或 null（无效/过期）
 */
function verify(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  // JWT 必须有三部分
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  // 重新计算签名并比对
  const expectedSig = crypto
    .createHmac('sha256', config.secretKey)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const expectedB64 = base64UrlEncode(expectedSig);
  if (sigB64 !== expectedB64) return null;

  // 解析 payload
  try {
    const payloadJson = Buffer.from(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    ).toString('utf8');
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    // 检查过期
    const exp = payload.exp as number | undefined;
    if (exp != null && Math.floor(Date.now() / 1000) > exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * 创建访问令牌（Access Token）
 * 短期令牌，用于日常 API 认证
 */
export function createAccessToken(data: { sub: string; phone?: string }): string {
  return sign({ ...data, type: 'access' }, config.accessTokenExpireMinutes);
}

/**
 * 创建刷新令牌（Refresh Token）
 * 长期令牌，用于获取新的 Access Token
 */
export function createRefreshToken(data: { sub: string; phone?: string }): string {
  return sign({ ...data, type: 'refresh' }, config.refreshTokenExpireDays * 24 * 60);
}

/**
 * 解码令牌（仅验证，不创建）
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  return verify(token);
}

/**
 * 创建管理员访问令牌
 * 与普通 Access Token 独立，用于运营后台认证
 */
export function createAdminAccessToken(adminUserId: string): string {
  return sign({ sub: adminUserId, type: 'admin' }, config.adminAccessTokenExpireMinutes);
}
