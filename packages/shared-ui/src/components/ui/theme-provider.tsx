'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * 统一主题 Provider。
 * 负责挂载 `next-themes`，供运营端与业务端共享同一套主题切换能力。
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      {children}
    </NextThemesProvider>
  );
}
