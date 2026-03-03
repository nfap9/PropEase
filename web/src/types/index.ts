/**
 * API 契约类型由 @apartment-ultra/api-contract 提供，此处统一再导出便于 @/types 引用保持不变。
 */
export * from '@apartment-ultra/api-contract';

/** 仅前端使用的 API 错误表示（openapi 风格 detail），与 client 中的 ApiError 类区分 */
export interface ApiErrorDetail {
  detail: string;
}
