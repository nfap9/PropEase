/**
 * 领域异常继承体系
 *
 * 提供一套完整的错误类型系统，支持：
 * - 基础应用错误
 * - HTTP 状态码自动映射
 * - 业务错误码传递
 * - 错误详情传递
 */

export { AppError, type AppErrorOptions } from './base.js';
export {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessError,
  BadRequestError,
} from './domain.js';
