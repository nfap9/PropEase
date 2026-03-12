import { BusinessCode } from '@apartment-ultra/api-contract';

export interface AppErrorOptions {
  /** 业务错误码 */
  code?: string;
  /** 错误消息 */
  message?: string;
  /** HTTP 状态码 */
  statusCode?: number;
  /** 错误详情 */
  details?: Record<string, unknown>;
  /** 字段级错误（用于校验错误） */
  fieldErrors?: Array<{ field: string; message: string }>;
}

/**
 * 基础应用错误
 *
 * 所有领域特定错误的基类，提供：
 * - 统一的错误代码体系
 * - HTTP 状态码映射
 * - 错误详情传递
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly fieldErrors?: Array<{ field: string; message: string }>;

  constructor(options: AppErrorOptions = {}) {
    const {
      code = 'INTERNAL_ERROR',
      message = '服务器错误',
      statusCode = 500,
      details,
      fieldErrors,
    } = options;

    super(message);

    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.fieldErrors = fieldErrors;

    // 保持错误堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 获取对应的业务状态码
   */
  getBusinessCode(): number {
    const statusToCode: Record<string, number> = {
      BAD_REQUEST: BusinessCode.BAD_REQUEST,
      VALIDATION_ERROR: BusinessCode.VALIDATION_ERROR,
      NOT_FOUND: BusinessCode.NOT_FOUND,
      FORBIDDEN: BusinessCode.FORBIDDEN,
      UNAUTHORIZED: BusinessCode.UNAUTHORIZED,
      CONFLICT: BusinessCode.CONFLICT,
      INTERNAL_ERROR: BusinessCode.INTERNAL_ERROR,
    };
    return statusToCode[this.code] ?? BusinessCode.INTERNAL_ERROR;
  }

  /**
   * 转换为错误响应体
   */
  toResponse() {
    let message = this.message;
    let data: Record<string, unknown> | undefined;

    if (this.fieldErrors && this.fieldErrors.length > 0) {
      message = '参数校验失败';
      data = { errors: this.fieldErrors };
    } else if (this.details) {
      data = this.details;
    }

    return {
      code: this.getBusinessCode(),
      message,
      ...(data ? { data } : {}),
    };
  }
}
