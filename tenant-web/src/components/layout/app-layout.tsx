import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/utils';
import {
  SIDEBAR_NAV_CONFIG,
  findNavItemByPath,
  type NavItem,
} from './nav-config';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout, organization } = useAuth();

  const currentNavItem = findNavItemByPath(location.pathname);

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
          {!collapsed && (
            <span className="text-sm font-semibold text-foreground">公寓管理系统</span>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 overflow-y-auto py-3">
          {SIDEBAR_NAV_CONFIG.map((section) => (
            <div key={section.id} className="px-3 mb-3">
              {!collapsed && (
                <p className="mb-1 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLinkItem
                    key={item.id}
                    item={item}
                    isActive={
                      location.pathname === item.href ||
                      location.pathname.startsWith(item.href + '/')
                    }
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
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-2">
            {currentNavItem && (
              <span className="text-sm font-medium text-foreground">
                {currentNavItem.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 通知按钮 */}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/workspace/notifications">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>

            {/* 用户菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <span className="text-sm">{user?.full_name || '用户'}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{user?.full_name || '未知用户'}</span>
                    <span className="text-xs text-muted-foreground">
                      {organization?.name || '未选择团队'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
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
          ? 'bg-primary/10 text-primary font-medium'
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
