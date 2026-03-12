import { AppError, type AppErrorOptions } from './base.js';

/**
 * 认证失败错误
 * - HTTP 401
 * - 用于登录失败、token 无效、token 过期等场景
 */
export class AuthenticationError extends AppError {
  constructor(message = '认证失败', options?: Omit<AppErrorOptions, 'statusCode' | 'code'>) {
    super({
      code: 'UNAUTHORIZED',
      statusCode: 401,
      message,
      ...options,
    });
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}

/**
 * 权限不足错误
 * - HTTP 403
 * - 用于用户没有权限执行某操作
 */
export class AuthorizationError extends AppError {
  constructor(message = '权限不足', options?: Omit<AppErrorOptions, 'statusCode' | 'code'>) {
    super({
      code: 'FORBIDDEN',
      statusCode: 403,
      message,
      ...options,
    });
    Object.defineProperty(this, 'name', { value: 'AuthorizationError' });
  }
}

/**
 * 资源不存在错误
 * - HTTP 404
 * - 用于查询不存在的资源
 */
export class NotFoundError extends AppError {
  constructor(resource: string, options?: Omit<AppErrorOptions, 'statusCode' | 'code' | 'message'>) {
    super({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: `${resource}不存在`,
      ...options,
    });
    Object.defineProperty(this, 'name', { value: 'NotFoundError' });
  }
}

/**
 * 参数校验失败错误
 * - HTTP 400
 * - 用于请求参数校验失败
 */
export class ValidationError extends AppError {
  constructor(
    errors: Array<{ field: string; message: string }>,
    message = '参数校验失败'
  ) {
    super({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      message,
      fieldErrors: errors,
    });
    Object.defineProperty(this, 'name', { value: 'ValidationError' });
  }
}

/**
 * 资源冲突错误
 * - HTTP 409
 * - 用于资源已存在、状态冲突等场景
 */
export class ConflictError extends AppError {
  constructor(message: string, options?: Omit<AppErrorOptions, 'statusCode' | 'code' | 'message'>) {
    super({
      code: 'CONFLICT',
      statusCode: 409,
      message,
      ...options,
    });
    Object.defineProperty(this, 'name', { value: 'ConflictError' });
  }
}

/**
 * 业务规则违反错误
 * - HTTP 422
 * - 用于业务逻辑层面的错误，如状态不对无法操作
 */
export class BusinessError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super({
      code,
      statusCode: 422,
      message,
      details,
    });
    Object.defineProperty(this, 'name', { value: 'BusinessError' });
  }
}

/**
 * 请求参数错误
 * - HTTP 400
 * - 用于请求参数格式错误、缺少必要参数等
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      code: 'BAD_REQUEST',
      statusCode: 400,
      message,
      details,
    });
    Object.defineProperty(this, 'name', { value: 'BadRequestError' });
  }
}
