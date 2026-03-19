'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { Avatar, AvatarFallback } from '@apartment-ultra/shared-ui/components/ui';
import { Bell } from 'lucide-react';
import { notificationsApi, subscriptionsApi } from '@/lib/api';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { OrgSelector } from '@/components/common/org-selector';
import { usePermissions } from '@/hooks/use-permissions';
import { canAccessRule } from '@/lib/permission-access';
import { NavContent } from './nav-content';
import { NAV_ITEMS, SETTINGS_ITEMS } from './nav-config';
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

function MainContent({ children }: { children: React.ReactNode }) {
  const { user, organization, logout } = useAuth();
  const { permissions, hasPermission, isSuperAdmin } = usePermissions();

  const accessContext = {
    organization,
    permissions,
    isSuperAdmin,
    hasPermission,
  };
  const canAccessNotifications = canAccessRule(
    NAV_ITEMS.find((item) => item.id === 'notifications')!,
    accessContext
  );

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: canAccessNotifications,
  });

  const orgId = organization?.id;
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', orgId],
    queryFn: () => subscriptionsApi.getSubscriptionStatus(orgId!),
    enabled: !!orgId,
  });
  const planLabel = subscriptionStatus?.service?.name ?? null;

  const visibleSettingsItems = SETTINGS_ITEMS.filter((item) =>
    canAccessRule(item, accessContext)
  );

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b px-4">
        {/* Mobile Nav Trigger - uses SidebarTrigger which handles Sheet automatically */}
        <SidebarTrigger className="lg:hidden" />

        {/* 全局组织选择器 */}
        <div className="flex flex-1 justify-center">
          <OrgSelector />
        </div>

        <ThemeToggle />

        {canAccessNotifications && (
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
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex h-8 items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
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
                  <p className="text-xs leading-none text-muted-foreground">
                    当前服务：{planLabel}
                  </p>
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
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        {/* Sidebar - responsive, handles desktop and mobile via Sheet automatically */}
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarContent>
            <NavContent />
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
