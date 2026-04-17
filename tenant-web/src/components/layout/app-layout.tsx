import { Outlet } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { OrgSelector } from '@/components/common/org-selector';
import { Building2 } from 'lucide-react';
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
  const { user, logout, organization } = useAuth();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* 头部 */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-background">
        {/* 左侧区域 */}
        <div className="flex items-center gap-4">
          {/* Logo 区域 */}
          <div className="flex h-14 items-center border-b border-border px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>

            <span className="ml-3 truncate text-sm font-semibold text-sidebar-foreground">公寓管理</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4">
          <OrgSelector />

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
                  <span className="text-xs text-muted-foreground">{organization?.name || '未选择团队'}</span>
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
      <main className="flex-1 overflow-y-hidden">{children || <Outlet />}</main>
    </div>
  );
}
