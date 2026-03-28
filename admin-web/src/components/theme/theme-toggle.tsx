'use client';

import { ThemeToggle as SharedThemeToggle } from '@apartment-ultra/shared-ui/components/ui';
import { adminMessages } from '@/lib/i18n';

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
