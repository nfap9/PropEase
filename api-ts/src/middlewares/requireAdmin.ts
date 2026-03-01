import type { Request, Response, NextFunction } from 'express';
import { decodeToken } from '../utils/jwt.js';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';

/**
 * 运营后台 JWT 认证：从 Authorization Bearer 解析 admin 用户并挂到 req.adminUser。
 */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction): Promise<void> {
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
