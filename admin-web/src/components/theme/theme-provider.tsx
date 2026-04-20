/**
 * 主题 Provider
 */
import { ConfigProvider } from 'antd';
import type { ThemeConfig } from 'antd';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme: ThemeConfig = {
    token: {
      colorPrimary: '#2563eb',
      borderRadius: 8,
    },
  };

  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
}
