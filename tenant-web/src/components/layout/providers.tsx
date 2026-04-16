'use client';

/**
 * 全局 Providers 组件
 *
 * 组合多个 Context Provider，按顺序嵌套：
 * 1. QueryClientProvider - React Query 数据获取
 * 2. ThemeProvider - 主题（深色/浅色模式）
 * 3. BrandConfigProvider - 品牌配置
 * 4. AuthProvider - 认证状态管理
 * 5. AppToaster - Toast 通知
 */
import { AppToaster } from '@apartment-ultra/shared-ui/components/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/auth/context';
import { BrandConfigProvider } from '@/contexts/brand-config';
import { ThemeProvider } from '@/components/theme/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据缓存 60 秒后过期
            staleTime: 60 * 1000,
            // 切换窗口时不再自动重新获取数据
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrandConfigProvider>
          <AuthProvider>{children}</AuthProvider>
        </BrandConfigProvider>
      </ThemeProvider>
      <AppToaster />
    </QueryClientProvider>
  );
}
