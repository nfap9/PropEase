/**
 * 运营后台权限选项类型：仅用中文展示给用户，不暴露权限码。
 * 权限码与后端约定一致，用于 API 请求。
 */
export interface AdminPermissionOption {
  code: string;
  label: string;
  group: string;
}
