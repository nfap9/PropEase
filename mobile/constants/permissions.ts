// 权限常量 - 与 Web 端保持一致
export const PERMISSIONS = {
  // 公寓权限
  APARTMENT_VIEW: 'apartment:view',
  APARTMENT_CREATE: 'apartment:create',
  APARTMENT_EDIT: 'apartment:edit',
  APARTMENT_DELETE: 'apartment:delete',

  // 房间权限
  ROOM_VIEW: 'room:view',
  ROOM_CREATE: 'room:create',
  ROOM_EDIT: 'room:edit',
  ROOM_DELETE: 'room:delete',

  // 租客权限
  TENANT_VIEW: 'tenant:view',
  TENANT_CREATE: 'tenant:create',
  TENANT_EDIT: 'tenant:edit',
  TENANT_DELETE: 'tenant:delete',

  // 租约权限
  LEASE_VIEW: 'lease:view',
  LEASE_CREATE: 'lease:create',
  LEASE_EDIT: 'lease:edit',
  LEASE_DELETE: 'lease:delete',
  LEASE_TERMINATE: 'lease:terminate',

  // 账单权限
  BILL_VIEW: 'bill:view',
  BILL_CREATE: 'bill:create',
  BILL_EDIT: 'bill:edit',
  BILL_DELETE: 'bill:delete',

  // 水电权限
  UTILITY_VIEW: 'utility:view',
  UTILITY_CREATE: 'utility:create',
  UTILITY_EDIT: 'utility:edit',

  // 报表权限
  REPORT_VIEW: 'report:view',

  // 设置权限
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',

  // 成员管理权限
  MEMBER_VIEW: 'member:view',
  MEMBER_CREATE: 'member:create',
  MEMBER_EDIT: 'member:edit',
  MEMBER_DELETE: 'member:delete',
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
