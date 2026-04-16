import { ThemeToggle } from '@/components/theme/theme-toggle';
import { HeaderOrgSwitcher } from './header-org-switcher';
import { HeaderUserMenu } from './header-user-menu';
import { useBrandConfig } from '@/contexts/brand-config';

/**
 * 统一 Header 组件
 *
 * 包含：
 * - 系统标题
 * - 组织切换器
 * - 主题切换
 * - 用户菜单
 */
export function AppHeader() {
  const brandConfig = useBrandConfig();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-foreground">
          {brandConfig.app_name}
        </span>
        <HeaderOrgSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <HeaderUserMenu />
      </div>
    </header>
  );
}
