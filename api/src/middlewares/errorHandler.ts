import type { Request, Response, NextFunction } from 'express';
import { BusinessCode, type ErrorResponseBody } from '@apartment-ultra/api-contract';

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

export interface AppError extends Error {
  statusCode?: number;
  businessCode?: number;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const code = err.businessCode ?? statusToBusinessCode[statusCode] ?? BusinessCode.INTERNAL_ERROR;
  let message = err.message ?? '服务器错误';
  let data: ErrorResponseBody['data'] | undefined;

  if (err.fieldErrors && err.fieldErrors.length > 0) {
    message = '参数校验失败';
    data = { errors: err.fieldErrors };
  }

  res.status(statusCode).json(createErrorResponse(code, message, data));
}
