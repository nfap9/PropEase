
/**
 * 主题 Provider
 *
 * 提供深色/浅色模式的主题支持
 * 使用 antd 的 ConfigProvider 替代 shared-ui
 */
import { ConfigProvider } from 'antd';
import type { ThemeConfig } from 'antd';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // 使用 antd 默认主题
  const theme: ThemeConfig = {};

  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
}
