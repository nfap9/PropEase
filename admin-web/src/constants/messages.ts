// Static i18n message objects used by business-layer hooks and constants.
// Kept here so these layers can access messages without depending on the i18n infrastructure layer.
// (i18n/context.tsx lives in infrastructure layer due to React context)
export const adminMessages = {
  users: {
    toast: {
      created: '管理账号创建成功',
      updated: '管理账号已更新',
      resetPassword: '密码已重置',
      deleted: '管理账号已删除',
    },
  },
  registeredUsers: {
    toast: {
      updated: '已更新',
      deleted: '已删除',
      gifted: '赠送已生效，订阅有效期已更新',
    },
    errors: {
      action: '操作失败，请重试',
      delete: '删除失败，请重试',
      gift: '赠送失败，请重试',
    },
  },
  layout: {
    nav: {
      dashboard: '工作台',
      brand: '界面信息',
      users: '管理账号',
      registeredUsers: '用户管理',
      organizations: '团队管理',
      servicePricing: '服务方案',
      usagePricing: '用量计费',
      subscriptions: '已购服务',
      billingOrders: '订单管理',
      billingManagement: '计费管理',
    },
  },
} as const;
