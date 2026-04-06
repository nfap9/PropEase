import type { Request, Response, NextFunction } from 'express';
import { decodeToken } from '../utils/jwt.js';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { isTokenBlacklisted } from '../lib/redis.js';

/**
 * 运营后台 JWT 认证：从 Authorization Bearer 解析 admin 用户并挂到 req.adminUser。
 * 支持 Token 黑名单检查（已吊销的 Token 无法使用）。
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    next(createAppError(401, 'Could not validate credentials'));
    return;
  }
  const token = auth.slice(7);
  const payload = decodeToken(token);
  if (!payload || (payload.type as string) !== 'admin') {
    next(createAppError(401, '请使用运营后台账号登录'));
    return;
  }

  // Token 黑名单检查
  const jti = payload.jti as string | undefined;
  if (jti) {
    const blacklisted = await isTokenBlacklisted(jti);
    if (blacklisted) {
      next(createAppError(401, 'Token 已失效，请重新登录'));
      return;
    }
  }

  const adminUserId = payload.sub as string | undefined;
  if (!adminUserId) {
    next(createAppError(401, 'Could not validate credentials'));
    return;
  }
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    include: { role: true },
  });
  if (!admin || !admin.is_active) {
    next(createAppError(401, 'User not found'));
    return;
  }
  req.adminUser = {
    id: admin.id,
    username: admin.username,
    role_id: admin.role_id,
  };
  next();
}
