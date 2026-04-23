/**
 * API 契约类型由 @apartment-ultra/api-contract 提供，此处统一再导出便于 @/types 引用保持不变。
 */
export * from '@apartment-ultra/api-contract';

/** 仅前端使用的 API 错误表示（openapi 风格 detail），与 client 中的 ApiError 类区分 */
export interface ApiErrorDetail {
  detail: string;
}

// 从本目录重导出 admin-permissions 类型（避免 types/index.ts → constants → types 的循环）
export type { AdminPermissionOption } from './admin-permissions';

// 从 constants/ 重导出（保留 @/types 路径兼容性）
export { ADMIN_PERMISSION_OPTIONS } from '@/constants/admin-permissions';

// 从 utils/ 重导出（保留 @/types 路径兼容性）
export { adminPermissionCodesToLabels, formatAdminPermissionsForDisplay, getAdminPermissionGroups } from '@/utils/admin-permissions';
