'use client';

/**
 * 主题切换按钮组件（运营后台版本）
 *
 * 点击可在深色/浅色/系统模式间切换
 * 使用运营后台的国际化文案
 */
import { ThemeToggle as SharedThemeToggle } from '@apartment-ultra/shared-ui/components/ui';
import { adminMessages } from '@/i18n';

export function ThemeToggle() {
  return (
    <SharedThemeToggle
      labels={{
        toggle: adminMessages.theme.toggle,
        light: adminMessages.theme.light,
        dark: adminMessages.theme.dark,
        system: adminMessages.theme.system,
      }}
    />
  );
}
