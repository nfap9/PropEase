/**
 * 管理后台布局组件
 */
import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/utils';
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
import { Button } from 'antd';
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
    <div className="flex h-screen overflow-hidden bg-white">
      {/* 侧边栏 */}
      <aside
        className={cn(
          'flex flex-col border-r border-gray-200 bg-gray-50 transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo 区域 */}
        <div className="flex h-14 items-center border-b border-gray-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="ml-3 truncate text-sm font-semibold text-gray-900">
              运营后台
            </span>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-3 px-3">
              {!collapsed && (
                <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-gray-500">
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
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
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
        <div className="border-t border-gray-200 p-2">
          <Button
            type="text"
            size="small"
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
        <header className="flex h-14 items-center justify-between border-b border-gray-200/70 bg-white/85 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <BreadcrumbNav />
          </div>

          <div className="flex items-center gap-2">
            <AppHeaderUserMenu />
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
