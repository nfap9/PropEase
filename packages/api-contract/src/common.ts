/**
 * 通用 API 契约：成功/错误响应、业务码、分页、字段错误
 * 与 docs/api-contract/README.md 一致
 */

/** 成功响应体 */
export interface SuccessBody<T = unknown> {
  code: 0;
  data: T;
  message: string;
}

/** 字段级错误 */
export interface FieldError {
  field: string;
  message: string;
}

/** 错误响应体中 data.errors */
export interface ErrorResponseData {
  errors?: FieldError[];
}

/** 错误响应体 */
export interface ErrorResponseBody {
  code: number;
  message: string;
  data?: ErrorResponseData;
}

/** 业务状态码 */
export const BusinessCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  VALIDATION_ERROR: 40001,
  NOT_FOUND: 40002,
  FORBIDDEN: 40003,
  UNAUTHORIZED: 40004,
  SYSTEM_NOT_INITIALIZED: 50301,
  CONFLICT: 40900,
  DUPLICATE_RESOURCE: 40901,
  INTERNAL_ERROR: 50000,
} as const;

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
