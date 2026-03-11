// 颜色常量 - 与设计规范对齐
export const Colors = {
  // 主色
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  // 成功色（绿色）
  success: '#059669',
  successLight: '#10B981',

  // 警告色（橙色）
  warning: '#EA580C',
  warningLight: '#F59E0B',

  // 危险色（红色）
  danger: '#DC2626',
  dangerLight: '#EF4444',

  // 背景
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',

  // 文字
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // 边框
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
} as const

// 状态颜色映射
export const StatusColors = {
  // 房间状态
  available: Colors.success,     // 空房
  occupied: Colors.primary,      // 已租
  maintenance: Colors.warning,   // 维修中

  // 账单状态
  pending: Colors.warning,       // 待支付
  partial: Colors.primary,       // 部分支付
  paid: Colors.success,          // 已支付
  overdue: Colors.danger,        // 逾期

  // 租约状态
  active: Colors.success,        // 在租
  expiring: Colors.warning,      // 即将到期
  expired: Colors.danger,        // 已过期
} as const

// 圆角
export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  full: 9999,
} as const

// 间距
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const

// 字体大小
export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
} as const
