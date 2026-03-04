import { BusinessCode } from '../constants.js';
import type { AppError as AppErrorType } from '../middlewares/errorHandler.js';

export function createAppError(
  statusCode: number,
  message: string,
  options?: { businessCode?: number; fieldErrors?: Array<{ field: string; message: string }> }
): AppErrorType {
  const err = new Error(message) as AppErrorType;
  err.statusCode = statusCode;
  err.businessCode =
    options?.businessCode ?? (statusCode === 422 ? BusinessCode.VALIDATION_ERROR : undefined);
  err.fieldErrors = options?.fieldErrors;
  if (err.businessCode === undefined) {
    const map: Record<number, number> = {
      400: BusinessCode.BAD_REQUEST,
      401: BusinessCode.UNAUTHORIZED,
      403: BusinessCode.FORBIDDEN,
      404: BusinessCode.NOT_FOUND,
      409: BusinessCode.CONFLICT,
    };
    err.businessCode = map[statusCode] ?? BusinessCode.INTERNAL_ERROR;
  }
  return err;
}
