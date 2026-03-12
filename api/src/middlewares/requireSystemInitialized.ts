import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';
import { BusinessCode } from '@apartment-ultra/api-contract';

/**
 * 检查系统是否已初始化的中间件
 * 未初始化时返回 503 + SYSTEM_NOT_INITIALIZED 业务码
 */
export async function requireSystemInitialized(
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const count = await prisma.adminUser.count();
  if (count === 0) {
    next(
      createAppError(503, '系统未初始化，请先完成系统初始化', {
        businessCode: BusinessCode.SYSTEM_NOT_INITIALIZED,
      })
    );
    return;
  }
  next();
}
