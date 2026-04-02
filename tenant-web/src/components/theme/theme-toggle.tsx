'use client';

/**
 * 主题切换按钮组件
 *
 * 点击可在深色/浅色模式间切换
 * 重新导出自共享 UI 包
 */
import { ThemeToggle as SharedThemeToggle } from '@apartment-ultra/shared-ui/components/ui';

export function ThemeToggle() {
  return <SharedThemeToggle />;
}
