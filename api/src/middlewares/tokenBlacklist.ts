/**
 * Token 黑名单中间件
 *
 * 检查请求中的 JWT 是否已被加入黑名单（已吊销）。
 * 如果 token 在黑名单中，返回 401。
 */
import type { Request, Response, NextFunction } from 'express';
import { decodeToken } from '../utils/jwt.js';
import { isTokenBlacklisted } from '../lib/redis.js';
import { createAppError } from '../utils/appError.js';

/**
 * 检查 Access Token 是否已被吊销
 * - 从 Authorization Bearer 头提取 token
 * - 解码获取 jti
 * - 查询 Redis 黑名单
 */
export async function checkTokenBlacklist(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    // 没有 token，继续后续中间件处理（可能不需要认证）
    next();
    return;
  }

  const token = auth.slice(7);
  const payload = decodeToken(token);

  if (!payload) {
    // 无效 token，后续中间件会处理
    next();
    return;
  }

  const jti = payload.jti as string | undefined;
  if (!jti) {
    // 旧版 token 没有 jti，跳过检查（兼容）
    next();
    return;
  }

  const blacklisted = await isTokenBlacklisted(jti);
  if (blacklisted) {
    next(createAppError(401, 'Token 已失效，请重新登录'));
    return;
  }

  next();
}
