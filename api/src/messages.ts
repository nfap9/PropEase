/**
 * API 语义化 message 常量（中文，供成功/错误响应使用）
 */

/** 成功类 */
export const Messages = {
  SUCCESS: '操作成功',
  ROOM_DELETED: '房间已删除',
  APARTMENT_DELETED: '公寓已删除',
  LEASE_TERMINATED: '租约已终止',
  TEAM_MIGRATED: '团队迁移成功',
  TEAM_DELETED: '团队已删除',
  MEMBER_REMOVED: '成员已移除',
  ALREADY_INITIALIZED: '已初始化',
} as const;

/** 404 资源不存在 */
export const NotFoundMessages = {
  ROOM: '房间不存在',
  APARTMENT: '公寓不存在',
  LEASE: '租约不存在',
  BILL: '账单不存在',
  ORGANIZATION: '组织不存在',
  MEMBER: '成员不存在',
  USER: '用户不存在',
  TENANT: '租客不存在',
  ORDER: '订单不存在',
  READING: '抄表记录不存在',
  NOTIFICATION: '通知不存在',
  CUSTOM_ROLE: '自定义角色不存在',
  SUBSCRIPTION: '订阅不存在',
  PLAN: '套餐不存在',
  ROLE: '角色不存在',
  UTILITY_CONFIG: '水电配置不存在',
  PROMOTION: '优惠活动不存在',
  /** 难以归类的 fallback */
  DEFAULT: '资源不存在',
} as const;
