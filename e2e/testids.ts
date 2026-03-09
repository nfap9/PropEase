/**
 * E2E 测试用的 data-testid 常量
 *
 * 使用约定：
 * 1. 所有测试用的元素都添加 data-testid 属性
 * 2. 命名格式：page-section-element
 * 3. 使用此文件统一管理，便于维护
 *
 * 示例：
 * <h1 data-testid="dashboard-heading">首页</h1>
 */

// ==================== 页面级 ====================

/** 首页/仪表盘 */
export const DASHBOARD = {
  HEADING: 'dashboard-heading',
  /** 公寓数量卡片 */
  APARTMENT_COUNT_CARD: 'dashboard-apartment-count',
  /** 房间总数卡片 */
  ROOM_COUNT_CARD: 'dashboard-room-count',
  /** 入住率卡片 */
  OCCUPANCY_RATE_CARD: 'dashboard-occupancy-rate',
  /** 活跃租约卡片 */
  ACTIVE_LEASES_CARD: 'dashboard-active-leases',
  /** 租客总数卡片 */
  TENANT_COUNT_CARD: 'dashboard-tenant-count',
  /** 本月收入卡片 */
  MONTHLY_REVENUE_CARD: 'dashboard-monthly-revenue',
  /** 待收账单卡片 */
  PENDING_BILLS_CARD: 'dashboard-pending-bills',
  /** 逾期账单卡片 */
  OVERDUE_BILLS_CARD: 'dashboard-overdue-bills',
} as const;

// ==================== 导航 ====================

/** 侧栏导航 */
export const NAV = {
  /** 首页链接 */
  DASHBOARD: 'nav-dashboard',
  /** 公寓管理链接 */
  APARTMENTS: 'nav-apartments',
  /** 全部房间链接 */
  ROOMS: 'nav-rooms',
  /** 租客管理链接 */
  TENANTS: 'nav-tenants',
  /** 租约管理链接 */
  LEASES: 'nav-leases',
  /** 水电录入链接 */
  UTILITIES: 'nav-utilities',
  /** 账单管理链接 */
  BILLS: 'nav-bills',
  /** 经营分析链接 */
  REPORTS: 'nav-reports',
  /** 设置链接 */
  SETTINGS: 'nav-settings',
  /** 通知链接 */
  NOTIFICATIONS: 'nav-notifications',
} as const;

// ==================== 公寓管理 ====================

/** 公寓管理页面 */
export const APARTMENTS = {
  /** 页面标题 */
  HEADING: 'apartments-heading',
  /** 新增公寓按钮 */
  NEW_BUTTON: 'apartments-new-btn',
  /** 搜索框 */
  SEARCH_INPUT: 'apartments-search-input',
  /** 公寓列表容器 */
  LIST: 'apartments-list',
  /** 空状态提示 */
  EMPTY_STATE: 'apartments-empty-state',
  /** 新增公寓弹窗 */
  CREATE_DIALOG: 'apartments-create-dialog',
  /** 公寓名称输入框 */
  NAME_INPUT: 'apartments-name-input',
  /** 地址输入框 */
  ADDRESS_INPUT: 'apartments-address-input',
  /** 确认创建按钮 */
  CONFIRM_BUTTON: 'apartments-confirm-btn',
  /** 取消按钮 */
  CANCEL_BUTTON: 'apartments-cancel-btn',
  /** 更多操作菜单 */
  MORE_MENU: 'apartments-more-menu',
  /** 编辑按钮 */
  EDIT_BUTTON: 'apartments-edit-btn',
  /** 删除按钮 */
  DELETE_BUTTON: 'apartments-delete-btn',
  /** 编辑公寓弹窗 */
  EDIT_DIALOG: 'apartments-edit-dialog',
  /** 确认删除弹窗 */
  DELETE_CONFIRM_DIALOG: 'apartments-delete-confirm-dialog',
} as const;

// ==================== 房间管理 ====================

/** 房间管理页面 */
export const ROOMS = {
  /** 页面标题 */
  HEADING: 'rooms-heading',
  /** 搜索框 */
  SEARCH_INPUT: 'rooms-search-input',
  /** 房间列表 */
  LIST: 'rooms-list',
  /** 公寓筛选 */
  APARTMENT_FILTER: 'rooms-apartment-filter',
  /** 状态筛选 */
  STATUS_FILTER: 'rooms-status-filter',
  /** 退租确认弹窗 */
  TERMINATE_DIALOG: 'rooms-terminate-dialog',
} as const;

// ==================== 租客管理 ====================

/** 租客管理页面 */
export const TENANTS = {
  /** 页面标题 */
  HEADING: 'tenants-heading',
  /** 新增租客按钮 */
  NEW_BUTTON: 'tenants-new-btn',
  /** 租客列表 */
  LIST: 'tenants-list',
  /** 搜索框 */
  SEARCH_INPUT: 'tenants-search-input',
  /** 新增租客弹窗 */
  CREATE_DIALOG: 'tenants-create-dialog',
  /** 姓名输入框 */
  NAME_INPUT: 'tenants-name-input',
  /** 联系电话输入框 */
  PHONE_INPUT: 'tenants-phone-input',
  /** 身份证号输入框 */
  ID_CARD_INPUT: 'tenants-id-card-input',
} as const;

// ==================== 租约管理 ====================

/** 租约管理页面 */
export const LEASES = {
  /** 页面标题 */
  HEADING: 'leases-heading',
  /** 新增租约按钮 */
  NEW_BUTTON: 'leases-new-btn',
  /** 租约列表 */
  LIST: 'leases-list',
  /** 状态筛选 */
  STATUS_FILTER: 'leases-status-filter',
  /** 公寓筛选 */
  APARTMENT_FILTER: 'leases-apartment-filter',
  /** 新增租约弹窗 */
  CREATE_DIALOG: 'leases-create-dialog',
  /** 公寓选择器 */
  APARTMENT_SELECT: 'leases-apartment-select',
  /** 房间选择器 */
  ROOM_SELECT: 'leases-room-select',
  /** 租客选择器 */
  TENANT_SELECT: 'leases-tenant-select',
  /** 开始日期选择器 */
  START_DATE_INPUT: 'leases-start-date-input',
  /** 月租输入框 */
  MONTHLY_RENT_INPUT: 'leases-monthly-rent-input',
  /** 押金输入框 */
  DEPOSIT_INPUT: 'leases-deposit-input',
  /** 确认签约按钮 */
  CONFIRM_BUTTON: 'leases-confirm-btn',
  /** 终止按钮 */
  TERMINATE_BUTTON: 'leases-terminate-btn',
  /** 终止确认弹窗 */
  TERMINATE_DIALOG: 'leases-terminate-dialog',
} as const;

// ==================== 水电录入 ====================

/** 水电录入页面 */
export const UTILITIES = {
  /** 页面标题 */
  HEADING: 'utilities-heading',
  /** 录入读数按钮 */
  ENTRY_BUTTON: 'utilities-entry-btn',
  /** 批量导入按钮 */
  BATCH_BUTTON: 'utilities-batch-btn',
  /** 水电记录列表 */
  LIST: 'utilities-list',
  /** 待录入提醒列表 */
  PENDING_LIST: 'utilities-pending-list',
  /** 录入读数弹窗 */
  ENTRY_DIALOG: 'utilities-entry-dialog',
  /** 公寓选择器 */
  APARTMENT_SELECT: 'utilities-apartment-select',
  /** 房间选择器 */
  ROOM_SELECT: 'utilities-room-select',
  /** 水表读数输入框 */
  WATER_READING_INPUT: 'utilities-water-reading-input',
  /** 电表读数输入框 */
  ELECTRICITY_READING_INPUT: 'utilities-electricity-reading-input',
  /** 保存按钮 */
  SAVE_BUTTON: 'utilities-save-btn',
} as const;

// ==================== 账单管理 ====================

/** 账单管理页面 */
export const BILLS = {
  /** 页面标题 */
  HEADING: 'bills-heading',
  /** 账单列表 */
  LIST: 'bills-list',
  /** 状态筛选 */
  STATUS_FILTER: 'bills-status-filter',
  /** 月份筛选 */
  MONTH_FILTER: 'bills-month-filter',
  /** 租客筛选 */
  TENANT_FILTER: 'bills-tenant-filter',
  /** 登记付款按钮 */
  PAY_BUTTON: 'bills-pay-btn',
  /** 导出 PDF 按钮 */
  EXPORT_PDF_BUTTON: 'bills-export-pdf-btn',
  /** 导出 Excel 按钮 */
  EXPORT_EXCEL_BUTTON: 'bills-export-excel-btn',
  /** 登记付款弹窗 */
  PAY_DIALOG: 'bills-pay-dialog',
  /** 付款金额输入框 */
  AMOUNT_INPUT: 'bills-amount-input',
  /** 付款方式选择器 */
  PAYMENT_METHOD_SELECT: 'bills-payment-method-select',
  /** 确认按钮 */
  CONFIRM_BUTTON: 'bills-confirm-btn',
  /** 生成账单弹窗 */
  GENERATE_DIALOG: 'bills-generate-dialog',
} as const;

// ==================== 经营分析 ====================

/** 经营分析页面 */
export const REPORTS = {
  /** 页面标题 */
  HEADING: 'reports-heading',
  /** 总览 Tab */
  OVERVIEW_TAB: 'reports-overview-tab',
  /** 收入分析 Tab */
  INCOME_TAB: 'reports-income-tab',
  /** 入住率 Tab */
  OCCUPANCY_TAB: 'reports-occupancy-tab',
  /** 导出报表按钮 */
  EXPORT_BUTTON: 'reports-export-btn',
} as const;

// ==================== 设置 ====================

/** 设置页面 */
export const SETTINGS = {
  /** 页面标题 */
  HEADING: 'settings-heading',
  /** 团队设置链接 */
  TEAM: 'settings-team-link',
  /** 订阅管理链接 */
  SUBSCRIPTION: 'settings-subscription-link',
  /** 权限管理链接 */
  PERMISSIONS: 'settings-permissions-link',
  /** 费用类型链接 */
  FEE_TYPES: 'settings-fee-types-link',
} as const;

/** 费用类型管理页面 */
export const FEE_TYPES = {
  /** 页面标题 */
  HEADING: 'fee-types-heading',
  /** 新增费用类型按钮 */
  NEW_BUTTON: 'fee-types-new-btn',
  /** 费用类型列表 */
  LIST: 'fee-types-list',
  /** 新增费用类型弹窗 */
  CREATE_DIALOG: 'fee-types-create-dialog',
  /** 编辑费用类型弹窗 */
  EDIT_DIALOG: 'fee-types-edit-dialog',
  /** 删除确认弹窗 */
  DELETE_DIALOG: 'fee-types-delete-dialog',
  /** 费用名称输入框 */
  NAME_INPUT: 'fee-types-name-input',
  /** 费用编码输入框 */
  CODE_INPUT: 'fee-types-code-input',
  /** 费用分类选择器 */
  CATEGORY_SELECT: 'fee-types-category-select',
  /** 描述输入框 */
  DESCRIPTION_INPUT: 'fee-types-description-input',
  /** 确认按钮 */
  CONFIRM_BUTTON: 'fee-types-confirm-btn',
  /** 取消按钮 */
  CANCEL_BUTTON: 'fee-types-cancel-btn',
  /** 编辑按钮 */
  EDIT_BUTTON: 'fee-types-edit-btn',
  /** 删除按钮 */
  DELETE_BUTTON: 'fee-types-delete-btn',
  /** 规格列表 */
  SPECIFICATIONS_LIST: 'fee-types-specifications-list',
} as const;

/** 公寓费用配置 */
export const APARTMENT_FEE_CONFIG = {
  /** 费用配置弹窗 */
  DIALOG: 'apartment-fee-config-dialog',
  /** 添加费用按钮 */
  ADD_BUTTON: 'apartment-fee-config-add-btn',
  /** 费用类型选择器 */
  FEE_TYPE_SELECT: 'apartment-fee-config-fee-type-select',
  /** 规格选择器 */
  SPECIFICATION_SELECT: 'apartment-fee-config-specification-select',
  /** 确认添加按钮 */
  CONFIRM_BUTTON: 'apartment-fee-config-confirm-btn',
  /** 取消按钮 */
  CANCEL_BUTTON: 'apartment-fee-config-cancel-btn',
  /** 配置列表 */
  LIST: 'apartment-fee-config-list',
  /** 删除按钮 */
  DELETE_BUTTON: 'apartment-fee-config-delete-btn',
} as const;

/** 团队设置页面 */
export const TEAM_SETTINGS = {
  /** 页面标题 */
  HEADING: 'team-settings-heading',
  /** 创建组织按钮 */
  CREATE_ORG_BTN: 'team-settings-create-org-btn',
  /** 编辑组织按钮 */
  EDIT_ORG_BTN: 'team-edit-org-btn',
  /** 邀请成员按钮 */
  INVITE_BTN: 'team-invite-btn',
  /** 成员列表 */
  MEMBER_LIST: 'team-settings-member-list',
  /** 创建组织弹窗 */
  CREATE_ORG_DIALOG: 'team-create-org-dialog',
  /** 编辑组织弹窗 */
  EDIT_ORG_DIALOG: 'team-edit-org-dialog',
  /** 邀请成员弹窗 */
  INVITE_DIALOG: 'team-invite-dialog',
  /** 移除成员确认弹窗 */
  REMOVE_MEMBER_DIALOG: 'team-remove-member-dialog',
} as const;

/** 权限管理页面 */
export const PERMISSIONS = {
  /** 页面标题 */
  HEADING: 'permissions-heading',
  /** 角色列表 */
  ROLE_LIST: 'permissions-role-list',
  /** 新建角色按钮 */
  CREATE_ROLE_BUTTON: 'permissions-create-role-btn',
  /** 权限分组 */
  PERMISSION_GROUP: 'permissions-group',
} as const;

/** 订阅管理页面 */
export const SUBSCRIPTION = {
  /** 页面标题 */
  HEADING: 'subscription-heading',
  /** 套餐列表 */
  PLAN_LIST: 'subscription-plan-list',
  /** 当前订阅信息 */
  CURRENT_SUBSCRIPTION: 'subscription-current',
  /** 升级套餐按钮 */
  UPGRADE_BUTTON: 'subscription-upgrade-btn',
} as const;

// ==================== 通知 ====================

/** 通知页面 */
export const NOTIFICATIONS = {
  /** 页面标题 */
  HEADING: 'notifications-heading',
  /** 通知列表 */
  LIST: 'notifications-list',
  /** 全部标已读按钮 */
  MARK_ALL_READ_BUTTON: 'notifications-mark-all-read-btn',
  /** 标为已读按钮 */
  MARK_READ_BUTTON: 'notifications-mark-read-btn',
  /** 删除按钮 */
  DELETE_BUTTON: 'notifications-delete-btn',
  /** 空状态 */
  EMPTY_STATE: 'notifications-empty-state',
  /** 未读标识 */
  UNREAD_INDICATOR: 'notifications-unread-indicator',
} as const;

// ==================== 认证 ====================

/** 认证相关 */
export const AUTH = {
  /** 登录页 */
  LOGIN_PAGE: 'auth-login-page',
  /** 注册页 */
  REGISTER_PAGE: 'auth-register-page',
  /** 密码登录 Tab */
  PASSWORD_TAB: 'auth-tab-password',
  /** 验证码登录 Tab */
  CODE_TAB: 'auth-tab-code',
  /** 手机号输入框 */
  PHONE_INPUT: 'auth-phone-input',
  /** 验证码登录时的手机号输入框 */
  PHONE_INPUT_CODE: 'auth-phone-input-code',
  /** 密码输入框 */
  PASSWORD_INPUT: 'auth-password-input',
  /** 确认密码输入框 */
  CONFIRM_PASSWORD_INPUT: 'auth-confirm-password-input',
  /** 验证码输入框 */
  VERIFICATION_CODE_INPUT: 'auth-verification-code-input',
  /** 发送验证码按钮 */
  SEND_CODE_BUTTON: 'auth-send-code-btn',
  /** 登录按钮 */
  LOGIN_BUTTON: 'auth-login-button',
  /** 注册按钮 */
  REGISTER_BUTTON: 'auth-register-button',
  /** 忘记密码链接 */
  FORGOT_PASSWORD_LINK: 'auth-forgot-password-link',
  /** 姓名输入框 */
  NAME_INPUT: 'auth-name-input',
} as const;

// ==================== 通用 ====================

/** 通用元素 */
export const COMMON = {
  /** 加载中 */
  LOADING: 'common-loading',
  /** 错误提示 */
  ERROR: 'common-error',
  /** 成功提示 */
  SUCCESS: 'common-success',
  /** 确认弹窗 */
  CONFIRM_DIALOG: 'common-confirm-dialog',
  /** 确认按钮 */
  CONFIRM_BUTTON: 'common-confirm-btn',
  /** 取消按钮 */
  CANCEL_BUTTON: 'common-cancel-btn',
  /** 关闭按钮 */
  CLOSE_BUTTON: 'common-close-btn',
  /** 搜索框 */
  SEARCH_INPUT: 'common-search-input',
  /** 空状态 */
  EMPTY_STATE: 'common-empty-state',
  /** 分页器 */
  PAGINATION: 'common-pagination',
} as const;

// ==================== 运营端 ====================

/** 运营端 - 概览 */
export const ADMIN = {
  /** 页面标题 */
  OVERVIEW_HEADING: 'admin-overview-heading',
  /** 组织数统计 */
  ORG_COUNT: 'admin-org-count',
  /** 用户数统计 */
  USER_COUNT: 'admin-user-count',
  /** 公寓数统计 */
  APARTMENT_COUNT: 'admin-apartment-count',
  /** 房间数统计 */
  ROOM_COUNT: 'admin-room-count',
  /** 活跃订阅数统计 */
  ACTIVE_SUBSCRIPTION_COUNT: 'admin-active-subscription-count',
  /** 退出登录按钮 */
  LOGOUT_BUTTON: 'admin-logout-btn',
} as const;

/** 运营端 - 登录 */
export const ADMIN_LOGIN = {
  /** 登录页 */
  PAGE: 'admin-login-page',
  /** 用户名输入框 */
  USERNAME_INPUT: 'admin-username-input',
  /** 密码输入框 */
  PASSWORD_INPUT: 'admin-password-input',
  /** 登录按钮 */
  LOGIN_BUTTON: 'admin-login-button',
} as const;

/** 运营端 - 运营角色 */
export const ADMIN_ROLES = {
  /** 页面标题 */
  HEADING: 'admin-roles-heading',
  /** 新建角色按钮 */
  CREATE_BUTTON: 'admin-roles-create-btn',
  /** 角色列表 */
  LIST: 'admin-roles-list',
  /** 新建角色弹窗 */
  CREATE_DIALOG: 'admin-roles-create-dialog',
  /** 角色名称输入框 */
  NAME_INPUT: 'admin-roles-name-input',
} as const;

/** 运营端 - 运营账号 */
export const ADMIN_USERS = {
  /** 页面标题 */
  HEADING: 'admin-users-heading',
  /** 新建账号按钮 */
  CREATE_BUTTON: 'admin-users-create-btn',
  /** 账号列表 */
  LIST: 'admin-users-list',
  /** 新建账号弹窗 */
  CREATE_DIALOG: 'admin-users-create-dialog',
} as const;

/** 运营端 - 用户管理 */
export const ADMIN_REGISTERED_USERS = {
  /** 页面标题 */
  HEADING: 'admin-registered-users-heading',
  /** 搜索框 */
  SEARCH_INPUT: 'admin-registered-users-search',
  /** 用户列表 */
  LIST: 'admin-registered-users-list',
} as const;

/** 运营端 - 组织管理 */
export const ADMIN_ORGANIZATIONS = {
  /** 页面标题 */
  HEADING: 'admin-organizations-heading',
  /** 组织列表 */
  LIST: 'admin-organizations-list',
  /** 组织详情页 */
  DETAIL_HEADING: 'admin-organizations-detail-heading',
  /** 启用组织按钮 */
  ENABLE_BUTTON: 'admin-organizations-enable-btn',
  /** 停用组织按钮 */
  DISABLE_BUTTON: 'admin-organizations-disable-btn',
} as const;

/** 运营端 - 套餐配置 */
export const ADMIN_PLANS = {
  /** 页面标题 */
  HEADING: 'admin-plans-heading',
  /** 新建套餐按钮 */
  CREATE_BUTTON: 'admin-plans-create-btn',
  /** 套餐列表 */
  LIST: 'admin-plans-list',
  /** 新建套餐弹窗 */
  CREATE_DIALOG: 'admin-plans-create-dialog',
} as const;

/** 运营端 - 订阅管理 */
export const ADMIN_SUBSCRIPTIONS = {
  /** 页面标题 */
  HEADING: 'admin-subscriptions-heading',
  /** 订阅列表 */
  LIST: 'admin-subscriptions-list',
  /** 状态筛选 */
  STATUS_FILTER: 'admin-subscriptions-status-filter',
  /** 套餐筛选 */
  PLAN_FILTER: 'admin-subscriptions-plan-filter',
} as const;

/** 运营端 - 品牌配置 */
export const ADMIN_BRAND = {
  /** 页面标题 */
  HEADING: 'admin-brand-heading',
  /** 品牌名称输入框 */
  NAME_INPUT: 'admin-brand-name-input',
  /** 品牌Logo */
  LOGO_INPUT: 'admin-brand-logo-input',
  /** 保存按钮 */
  SAVE_BUTTON: 'admin-brand-save-btn',
} as const;

/** 运营端 - 额度定价配置 */
export const ADMIN_PRICING = {
  /** 页面标题 */
  HEADING: 'admin-pricing-heading',
  /** 价格输入框 */
  PRICE_INPUT: 'admin-pricing-price-input',
  /** 保存按钮 */
  SAVE_BUTTON: 'admin-pricing-save-btn',
} as const;
