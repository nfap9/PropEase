import { Building2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { HeaderUserMenu } from './header-user-menu';
import { useBrandConfig } from '@/contexts/brand-config';

/**
 * 统一 Header 组件
 *
 * 包含：
 * - 左侧：Logo + 应用名称
 * - 右侧：主题切换 + 用户头像/名称/组织
 */
export function AppHeader() {
  const { app_name } = useBrandConfig();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border/50 bg-background px-4 md:px-6">
      {/* 左侧：Logo + 应用名称 */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-foreground">{app_name}</span>
      </div>

      {/* 右侧：主题 + 用户信息 */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <HeaderUserMenu />
      </div>
    </header>
  );
}
