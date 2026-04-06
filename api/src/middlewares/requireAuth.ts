import type { Request, Response, NextFunction } from 'express';
import { decodeToken } from '../utils/jwt.js';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { isTokenBlacklisted } from '../lib/redis.js';

/**
 * 控制台 JWT 认证：从 Authorization Bearer 解析用户并挂到 req.consoleUser。
 * 未携带或无效则 401。
 * 支持 Token 黑名单检查（已吊销的 Token 无法使用）。
 */
export async function requireConsoleAuth(
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
  if (!payload || (payload.type as string) !== 'access') {
    next(createAppError(401, '请使用注册账号登录公寓管理系统'));
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

  const userId = payload.sub as string | undefined;
  if (!userId) {
    next(createAppError(401, 'Could not validate credentials'));
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.is_active) {
    next(createAppError(401, 'User not found'));
    return;
  }
  req.consoleUser = {
    id: user.id,
    phone: user.phone,
    full_name: user.full_name,
    is_active: user.is_active,
  };
  next();
}
