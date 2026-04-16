/**
 * 颜色令牌类型定义
 */
export type HSL = { h: number; s: number; l: number };

/**
 * 主题颜色映射
 * key 为 CSS 变量名（不含 --）
 */
export type ThemeColors = Record<string, HSL>;

/**
 * 主题定义
 */
export interface Theme {
  name: string;
  colors: ThemeColors;
}

/**
 * 所有主题的颜色令牌
 * 使用 HSL 格式，便于生成 CSS 变量
 */
export const themes: Record<string, Theme> = {
  light: {
    name: 'light',
    colors: {
      // 基础颜色
      background: { h: 210, s: 20, l: 98 },
      foreground: { h: 222, s: 47, l: 11 },
      card: { h: 0, s: 0, l: 100 },
      'card-foreground': { h: 222, s: 47, l: 11 },
      popover: { h: 0, s: 0, l: 100 },
      'popover-foreground': { h: 222, s: 47, l: 11 },
      primary: { h: 214, s: 84, l: 37 },
      'primary-foreground': { h: 210, s: 40, l: 98 },
      secondary: { h: 210, s: 24, l: 93 },
      'secondary-foreground': { h: 222, s: 47, l: 11 },
      muted: { h: 210, s: 20, l: 95 },
      'muted-foreground': { h: 215, s: 16, l: 39 },
      accent: { h: 210, s: 28, l: 94 },
      'accent-foreground': { h: 222, s: 47, l: 11 },
      destructive: { h: 0, s: 72, l: 51 },
      'destructive-foreground': { h: 210, s: 40, l: 98 },
      success: { h: 142, s: 72, l: 32 },
      'success-foreground': { h: 210, s: 40, l: 98 },
      warning: { h: 38, s: 92, l: 50 },
      'warning-foreground': { h: 24, s: 10, l: 10 },
      info: { h: 214, s: 84, l: 37 },
      'info-foreground': { h: 210, s: 40, l: 98 },
      border: { h: 214, s: 24, l: 88 },
      input: { h: 214, s: 24, l: 88 },
      ring: { h: 214, s: 84, l: 37 },
      // 图表颜色
      'chart-1': { h: 214, s: 84, l: 37 },
      'chart-2': { h: 168, s: 72, l: 32 },
      'chart-3': { h: 262, s: 52, l: 52 },
      'chart-4': { h: 36, s: 88, l: 54 },
      'chart-5': { h: 8, s: 76, l: 58 },
      // 圆角
      radius: { h: 0, s: 0, l: 55 },
      // 卡片阴影
      'card-shadow': { h: 0, s: 0, l: 0 },
      // 侧边栏颜色
      'sidebar-background': { h: 210, s: 20, l: 98 },
      'sidebar-foreground': { h: 220, s: 13, l: 18 },
      'sidebar-primary': { h: 210, s: 40, l: 50 },
      'sidebar-primary-foreground': { h: 210, s: 20, l: 98 },
      'sidebar-accent': { h: 213, s: 21, l: 96 },
      'sidebar-accent-foreground': { h: 220, s: 13, l: 18 },
      'sidebar-border': { h: 214, s: 20, l: 88 },
      'sidebar-ring': { h: 214, s: 84, l: 37 },
      'sidebar-shadow': { h: 20, s: 20, l: 40 },
    },
  },
  dark: {
    name: 'dark',
    colors: {
      // 基础颜色
      background: { h: 222, s: 30, l: 8 },
      foreground: { h: 210, s: 20, l: 96 },
      card: { h: 222, s: 28, l: 11 },
      'card-foreground': { h: 210, s: 20, l: 96 },
      popover: { h: 222, s: 28, l: 11 },
      'popover-foreground': { h: 210, s: 20, l: 96 },
      primary: { h: 210, s: 92, l: 66 },
      'primary-foreground': { h: 222, s: 47, l: 11 },
      secondary: { h: 219, s: 20, l: 18 },
      'secondary-foreground': { h: 210, s: 20, l: 96 },
      muted: { h: 219, s: 18, l: 16 },
      'muted-foreground': { h: 215, s: 14, l: 70 },
      accent: { h: 219, s: 18, l: 18 },
      'accent-foreground': { h: 210, s: 20, l: 96 },
      destructive: { h: 0, s: 70, l: 56 },
      'destructive-foreground': { h: 210, s: 40, l: 98 },
      success: { h: 142, s: 65, l: 42 },
      'success-foreground': { h: 210, s: 40, l: 98 },
      warning: { h: 38, s: 92, l: 50 },
      'warning-foreground': { h: 24, s: 10, l: 10 },
      info: { h: 210, s: 92, l: 66 },
      'info-foreground': { h: 222, s: 47, l: 11 },
      border: { h: 217, s: 19, l: 21 },
      input: { h: 217, s: 19, l: 21 },
      ring: { h: 210, s: 92, l: 66 },
      // 图表颜色
      'chart-1': { h: 210, s: 92, l: 66 },
      'chart-2': { h: 168, s: 70, l: 44 },
      'chart-3': { h: 262, s: 68, l: 68 },
      'chart-4': { h: 36, s: 92, l: 58 },
      'chart-5': { h: 8, s: 82, l: 64 },
      // 圆角
      radius: { h: 0, s: 0, l: 55 },
      // 卡片阴影
      'card-shadow': { h: 0, s: 0, l: 0 },
      // 侧边栏颜色
      'sidebar-background': { h: 222, s: 30, l: 8 },
      'sidebar-foreground': { h: 210, s: 20, l: 96 },
      'sidebar-primary': { h: 210, s: 92, l: 66 },
      'sidebar-primary-foreground': { h: 222, s: 47, l: 11 },
      'sidebar-accent': { h: 220, s: 19, l: 18 },
      'sidebar-accent-foreground': { h: 210, s: 20, l: 96 },
      'sidebar-border': { h: 217, s: 19, l: 21 },
      'sidebar-ring': { h: 210, s: 92, l: 66 },
      'sidebar-shadow': { h: 0, s: 0, l: 0 },
    },
  },
};

/**
 * 获取所有主题名称
 */
export const themeNames = Object.keys(themes);

/**
 * 根据主题名获取主题
 */
export function getTheme(name: string): Theme | undefined {
  return themes[name];
}
