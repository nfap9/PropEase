/**
 * 管理后台布局组件
 *
 * 参考 tenant-web 简洁风格，使用 Flexbox 布局
 */
import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@apartment-ultra/shared-ui/lib/utils';
import {
  NAV_SECTIONS,
  findNavItem,
  type NavItem,
} from './nav-config-v2';
import {
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { BreadcrumbNav } from './breadcrumb-nav';
import { AppHeaderUserMenu } from './app-header';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // 查找当前导航项
  const currentPath = location.pathname;
  let currentItem: NavItem | null = null;

  for (const section of NAV_SECTIONS) {
    const found = section.items.find(
      (item) =>
        item.href === currentPath ||
        (item.href !== '/' && currentPath.startsWith(item.href))
    );
    if (found) {
      currentItem = found;
      break;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 侧边栏 */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-sidebar transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo 区域 */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="ml-3 truncate text-sm font-semibold text-sidebar-foreground">
              运营后台
            </span>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-3 px-3">
              {!collapsed && (
                <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive =
                    item.href === currentPath ||
                    (item.href !== '/' && currentPath.startsWith(item.href));

                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        collapsed && 'justify-center px-1'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <ItemIcon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 折叠按钮 */}
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>收起</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 头部 */}
        <header className="flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <BreadcrumbNav />
          </div>

          <div className="flex items-center gap-2">
            <AppHeaderUserMenu />
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
