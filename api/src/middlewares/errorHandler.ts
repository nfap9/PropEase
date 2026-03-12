import type { Request, Response, NextFunction } from 'express';
import { BusinessCode, type ErrorResponseBody } from '@apartment-ultra/api-contract';
import { AppError } from '../errors/index.js';

/**
 * 导出 AppError 以保持向后兼容
 * @deprecated 请使用 @/errors 中的 AppError 类
 */
export { AppError };

export function createErrorResponse(
  code: number,
  message: string,
  data?: ErrorResponseBody['data']
): ErrorResponseBody {
  return { code, message, ...(data ? { data } : {}) };
}

const statusToBusinessCode: Record<number, number> = {
  400: BusinessCode.BAD_REQUEST,
  401: BusinessCode.UNAUTHORIZED,
  403: BusinessCode.FORBIDDEN,
  404: BusinessCode.NOT_FOUND,
  409: BusinessCode.CONFLICT,
  422: BusinessCode.VALIDATION_ERROR,
};

/**
 * 兼容旧版 AppError 接口
 * @deprecated 请使用 @/errors 中的 AppError 类
 */
export interface LegacyAppError extends Error {
  statusCode?: number;
  businessCode?: number;
  fieldErrors?: Array<{ field: string; message: string }>;
}

/**
 * 判断是否为新版 AppError
 */
function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/**
 * 判断是否为旧版 AppError
 * 检查是否有 statusCode 或 businessCode 属性
 */
function isLegacyAppError(err: unknown): err is LegacyAppError {
  if (!(err instanceof Error)) return false;
  const maybeLegacy = err as LegacyAppError;
  // 有 statusCode 或 businessCode 属性，或者 Error 有 message
  return 'statusCode' in maybeLegacy || 'businessCode' in maybeLegacy;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode: number;
  let code: number;
  let message: string;
  let data: ErrorResponseBody['data'] | undefined;

  // 新版 AppError - 使用 toResponse() 方法
  if (isAppError(err)) {
    const response = err.toResponse();
    statusCode = err.statusCode;
    code = response.code;
    message = response.message;
    data = response.data;
  }
  // 旧版兼容
  else if (isLegacyAppError(err)) {
    statusCode = err.statusCode ?? 500;
    code = err.businessCode ?? statusToBusinessCode[statusCode] ?? BusinessCode.INTERNAL_ERROR;
    message = err.message;  // 使用原始错误消息

    if (err.fieldErrors && err.fieldErrors.length > 0) {
      message = '参数校验失败';
      data = { errors: err.fieldErrors };
    }
  }
  // 未知错误
  else {
    statusCode = 500;
    code = BusinessCode.INTERNAL_ERROR;
    message = err.message || '服务器错误';
  }

  // 记录 500 错误日志
  if (statusCode === 500) {
    console.error('[errorHandler] 500:', err.message);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json(createErrorResponse(code, message, data));
}
