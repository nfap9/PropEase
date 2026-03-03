'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Home,
  Building2,
  DoorOpen,
  Users,
  FileText,
  Zap,
  Receipt,
  BarChart3,
  Menu,
  Shield,
  Bell,
  CreditCard,
  History,
} from 'lucide-react';
import { notificationsApi, subscriptionsApi } from '@/lib/api';
import { useState } from 'react';

/** 套餐 code 到展示名的兜底映射（无订阅或加载中时使用） */
const PLAN_CODE_LABEL: Record<string, string> = {
  free: '免费版',
  pro: '专业版',
  enterprise: '企业版',
};
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { OrgSelector } from '@/components/common/org-selector';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { useBrandConfig } from '@/lib/brand-config-context';

const NAV_ITEMS = [
  { href: '/dashboard', label: '首页', icon: Home, permission: null },
  { href: '/notifications', label: '通知', icon: Bell, permission: null },
  { href: '/apartments', label: '公寓管理', icon: Building2, permission: PERMISSIONS.APARTMENT_VIEW },
  { href: '/rooms', label: '全部房间', icon: DoorOpen, permission: PERMISSIONS.ROOM_VIEW },
  { href: '/tenants', label: '租客管理', icon: Users, permission: PERMISSIONS.TENANT_VIEW },
  { href: '/leases', label: '租约管理', icon: FileText, permission: PERMISSIONS.LEASE_VIEW },
  { href: '/utilities', label: '水电录入', icon: Zap, permission: PERMISSIONS.UTILITY_VIEW, exact: true },
  { href: '/utilities/history', label: '历史水电记录', icon: History, permission: PERMISSIONS.UTILITY_VIEW },
  { href: '/bills', label: '账单管理', icon: Receipt, permission: PERMISSIONS.BILL_VIEW },
  { href: '/reports', label: '经营分析', icon: BarChart3, permission: PERMISSIONS.REPORT_VIEW },
];

const SETTINGS_ITEMS = [
  { href: '/settings/team', label: '团队管理', icon: Users, permission: PERMISSIONS.MEMBER_VIEW },
  { href: '/settings/subscription', label: '套餐购买', icon: CreditCard, permission: null },
  { href: '/settings/permissions', label: '权限管理', icon: Shield, permission: PERMISSIONS.SETTINGS_VIEW },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, logout } = useAuth();
  const brandConfig = useBrandConfig();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
  });

  const orgId = organization?.id;
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', orgId],
    queryFn: () => subscriptionsApi.getSubscriptionStatus(orgId!),
    enabled: !!orgId,
  });
  const planLabel =
    subscriptionStatus?.plan?.name ??
    (organization?.plan ? PLAN_CODE_LABEL[organization.plan] ?? organization.plan : null);

  // 过滤有权限的导航项
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || isSuperAdmin || hasPermission(item.permission)
  );

  const visibleSettingsItems = SETTINGS_ITEMS.filter(
    (item) => !item.permission || isSuperAdmin || hasPermission(item.permission)
  );

  const NavContent = () => (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          {brandConfig.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Logo URL 来自运营配置，域名动态
            <img src={brandConfig.logo_url} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
          <span>{brandConfig.app_name}</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-muted/40 lg:flex">
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4">
          {/* Mobile Sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">导航菜单</SheetTitle>
              <NavContent />
            </SheetContent>
          </Sheet>

          {/* 全局组织选择器 */}
          <div className="flex-1 flex justify-center">
            <OrgSelector />
          </div>

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/notifications" aria-label="通知">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden font-medium md:inline-block">
                  {user?.full_name || '用户'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.phone}</p>
                  {planLabel != null && (
                    <p className="text-xs leading-none text-muted-foreground">当前套餐：{planLabel}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {visibleSettingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              {visibleSettingsItems.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={logout}>
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
