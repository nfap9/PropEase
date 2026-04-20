
import { Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { useAuth } from '@/contexts/auth';
import { OrgSelector } from '@/components/common/org-selector';
import { Building2 } from 'lucide-react';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, organization } = useAuth();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{user?.full_name || '未知用户'}</span>
          <span className="text-xs text-muted-foreground">{organization?.name || '未选择团队'}</span>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut className="h-4 w-4" />,
      label: '退出登录',
      danger: true,
      onClick: logout,
    },
  ];

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
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <Button type="text" size="small" className="gap-1">
              <span className="text-sm">{user?.full_name || '用户'}</span>
              <ChevronDownIcon className="h-3 w-3" />
            </Button>
          </Dropdown>
        </div>
      </header>

      {/* 页面内容 */}
      <main className="flex-1 overflow-y-hidden">{children || <Outlet />}</main>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
