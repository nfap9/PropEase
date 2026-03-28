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
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Bell, Building2, ChevronDown } from 'lucide-react';
import { notificationsApi, subscriptionsApi } from '@/lib/api';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { usePermissions } from '@/hooks/use-permissions';
import { canAccessRule } from '@/lib/permission-access';
import { NavContent } from './nav-content';
import { NAV_ITEMS, SETTINGS_ITEMS } from './nav-config';
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { tenantI18n, tenantMessages } from '@/lib/i18n';

function MainContent({ children }: { children: React.ReactNode }) {
  const { user, organization, logout } = useAuth();
  const { permissions, hasPermission, isSuperAdmin } = usePermissions();

  const accessContext = {
    organization,
    permissions,
    isSuperAdmin,
    hasPermission,
  };
  const canAccessNotifications = canAccessRule(NAV_ITEMS.find((item) => item.id === 'notifications')!, accessContext);

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

  const visibleSettingsItems = SETTINGS_ITEMS.filter((item) => canAccessRule(item, accessContext));

  return (
    <div className="flex h-screen min-h-0 w-full flex-1 flex-col overflow-hidden bg-transparent">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 px-4 py-2.5 backdrop-blur-xl md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-base font-semibold text-foreground">{organization?.name ?? tenantMessages.common.currentTeam}</h1>
              {planLabel ? <Badge variant="outline">{planLabel}</Badge> : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />

            {canAccessNotifications && (
              <Button variant="outline" size="icon" className="relative bg-background/70" asChild>
                <Link href="/notifications" aria-label={tenantMessages.common.notifications}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-2 rounded-xl bg-background/85 pl-2 pr-3 text-left">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{user?.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="hidden min-w-0 md:block">
                    <div className="truncate text-sm font-medium">{user?.full_name || tenantMessages.common.user}</div>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-2xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.phone}</p>
                    {planLabel != null && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {tenantI18n.t('common.currentService', { name: planLabel })}
                      </p>
                    )}
                    {organization && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {tenantI18n.t('common.currentTeamLabel', { name: organization.name })}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/organizations">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{tenantMessages.common.switchTeam}</span>
                  </Link>
                </DropdownMenuItem>
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
                  <span>{tenantMessages.common.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-5 md:px-6 md:py-6">{children}</div>
      </main>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-transparent">
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarContent>
            <NavContent />
          </SidebarContent>
        </Sidebar>

        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
