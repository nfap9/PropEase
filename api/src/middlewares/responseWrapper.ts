import type { Request, Response, NextFunction } from 'express';
import { BusinessCode, shouldSkipResponseWrap } from '../constants.js';

export interface SuccessBody<T = unknown> {
  code: 0;
  data: T;
  message: string;
}

/**
 * 响应包装中间件：将 res.json(payload) 包装为 { code: 0, data, message }。
 * 对 /health、/docs、/api/v1/webhooks 等路径不包装。
 */
export function responseWrapper(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;
  if (shouldSkipResponseWrap(path)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: unknown): Response {
    if (res.statusCode >= 400) return originalJson(body);
    if (typeof body === 'object' && body !== null && 'code' in body && (body as { code: number }).code === 0) {
      return originalJson(body);
    }
    const wrapped: SuccessBody = {
      code: BusinessCode.SUCCESS,
      data: body,
      message: '操作成功',
    };
    return originalJson(wrapped);
  };
  next();
}
