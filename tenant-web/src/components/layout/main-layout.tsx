'use client';

import Link from 'next/link';
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
import { Bell } from 'lucide-react';
import { notificationsApi, subscriptionsApi } from '@/lib/api';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { OrgSelector } from '@/components/common/org-selector';
import { usePermissions } from '@/hooks/use-permissions';
import { NavContent } from './nav-content';
import { SETTINGS_ITEMS } from './nav-config';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, logout } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
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
    subscriptionStatus?.plan?.name ?? null;

  const visibleSettingsItems = SETTINGS_ITEMS.filter(
    (item) => !item.permission || isSuperAdmin || hasPermission(item.permission)
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
                <Bell className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">导航菜单</SheetTitle>
              <NavContent onNavClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* 全局组织选择器 */}
          <div className="flex flex-1 justify-center">
            <OrgSelector />
          </div>

          <ThemeToggle />

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
                      当前套餐：{planLabel}
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
    </div>
  );
}
