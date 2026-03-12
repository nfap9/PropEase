import { BusinessCode } from '../constants.js';
import { AppError, ValidationError, type AppErrorOptions } from '../errors/index.js';

/**
 * 兼容旧版的错误接口
 */
interface LegacyAppError extends AppError {
  businessCode: number;
}

/**
 * @deprecated 请使用 @/errors 中的 AppError 类
 */
export function createAppError(
  statusCode: number,
  message: string,
  options?: { businessCode?: number; fieldErrors?: Array<{ field: string; message: string }> }
): LegacyAppError {
  const statusToCode: Record<number, number> = {
    400: BusinessCode.BAD_REQUEST,
    401: BusinessCode.UNAUTHORIZED,
    403: BusinessCode.FORBIDDEN,
    404: BusinessCode.NOT_FOUND,
    409: BusinessCode.CONFLICT,
    422: BusinessCode.VALIDATION_ERROR,
  };

  const businessCode = options?.businessCode ?? statusToCode[statusCode] ?? BusinessCode.INTERNAL_ERROR;

  // 如果是 422 且有 fieldErrors，使用 ValidationError
  if (statusCode === 422 && options?.fieldErrors) {
    const err = new ValidationError(options.fieldErrors, message);
    // 添加 businessCode 属性以兼容旧版
    (err as LegacyAppError).businessCode = businessCode;
    return err as LegacyAppError;
  }

  const errorOptions: AppErrorOptions = {
    code: 'INTERNAL_ERROR',
    statusCode,
    message,
    fieldErrors: options?.fieldErrors,
  };

  // 根据状态码设置错误码
  if (statusCode === 400) errorOptions.code = 'BAD_REQUEST';
  else if (statusCode === 401) errorOptions.code = 'UNAUTHORIZED';
  else if (statusCode === 403) errorOptions.code = 'FORBIDDEN';
  else if (statusCode === 404) errorOptions.code = 'NOT_FOUND';
  else if (statusCode === 409) errorOptions.code = 'CONFLICT';
  else if (statusCode === 422) errorOptions.code = 'VALIDATION_ERROR';

  const err = new AppError(errorOptions);
  // 添加 businessCode 属性以兼容旧版
  (err as LegacyAppError).businessCode = businessCode;
  return err as LegacyAppError;
}
