
import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/utils';
import { SIDEBAR_NAV_CONFIG } from '@/constants/nav-config';
import type { NavItem } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from 'antd';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function WorkspaceLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* 侧边栏 */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-sidebar transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-3">
          {SIDEBAR_NAV_CONFIG.map((section) => (
            <div key={section.id} className="mb-3 px-3">
              {!collapsed && (
                <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLinkItem
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.href || location.pathname.startsWith(item.href + '/')}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* 折叠按钮 */}
        <div className="border-t border-border p-2">
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

      {/* 页面内容 */}
      <main className="flex-1 overflow-y-auto p-6">{children || <Outlet />}</main>
    </div>
  );
}

interface NavLinkItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}

function NavLinkItem({ item, isActive, collapsed }: NavLinkItemProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
        isActive
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-1'
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}
