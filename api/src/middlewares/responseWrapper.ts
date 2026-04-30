import type { Request, Response, NextFunction } from 'express';
import { BusinessCode, type SuccessBody } from '@propease/api-contract';
import { shouldSkipResponseWrap } from '../constants.js';
import { Messages } from '../messages.js';

/**
 * 响应包装中间件：将 res.json(payload) 包装为 { code: 0, data, message }。
 * message 优先使用 res.locals.successMessage（语义化成功文案），否则为「操作成功」。
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
    if (
      typeof body === 'object' &&
      body !== null &&
      'code' in body &&
      (body as { code: number }).code === 0
    ) {
      return originalJson(body);
    }
    const message =
      typeof res.locals?.successMessage === 'string' ? res.locals.successMessage : Messages.SUCCESS;
    const wrapped: SuccessBody = {
      code: BusinessCode.SUCCESS,
      data: body,
      message,
    };
    return originalJson(wrapped);
  };
  next();
}
