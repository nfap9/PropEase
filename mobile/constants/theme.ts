// 颜色常量 - 与 tamagui.config.ts 设计令牌对齐
export const Colors = {
  // 主色（对应 tamagui primary600）
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primary50: '#EFF6FF',
  primary100: '#DBEAFE',
  primary200: '#BFDBFE',
  primary300: '#93C5FD',
  primary400: '#60A5FA',
  primary500: '#3B82F6',
  primary600: '#2563EB',
  primary700: '#1D4ED8',
  primary800: '#1E40AF',
  primary900: '#1E3A8A',

  // 成功色（对应 tamagui success600）
  success: '#10B981',
  successLight: '#34D399',
  success50: '#ECFDF5',
  success100: '#D1FAE5',
  success200: '#A7F3D0',
  success300: '#6EE7B7',
  success400: '#34D399',
  success500: '#10B981',
  success600: '#059669',
  success700: '#047857',
  success800: '#065F46',
  success900: '#064E3B',

  // 警告色（对应 tamagui warning600）
  warning: '#F97316',
  warningLight: '#FB923C',
  warning50: '#FFF7ED',
  warning100: '#FFEDD5',
  warning200: '#FED7AA',
  warning300: '#FDBA74',
  warning400: '#FB923C',
  warning500: '#F97316',
  warning600: '#EA580C',
  warning700: '#C2410C',
  warning800: '#9A3412',
  warning900: '#7C2D12',

  // 危险色（对应 tamagui danger600）
  danger: '#EF4444',
  dangerLight: '#F87171',
  danger50: '#FEF2F2',
  danger100: '#FEE2E2',
  danger200: '#FECACA',
  danger300: '#FCA5A5',
  danger400: '#F87171',
  danger500: '#EF4444',
  danger600: '#DC2626',
  danger700: '#B91C1C',
  danger800: '#991B1B',
  danger900: '#7F1D1D',

  // 灰色梯度（对应 tamagui gray）
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // 背景
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',

  // 文字
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // 边框
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // 透明
  transparent: 'transparent',
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
