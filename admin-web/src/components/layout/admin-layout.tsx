'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Shield,
  Building2,
  Package,
  CreditCard,
  LogOut,
  Palette,
  Store,
  DollarSign,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ChevronDown } from 'lucide-react';
import { adminMessages } from '@/lib/i18n';
import { BreadcrumbNav } from './breadcrumb-nav';

const ADMIN_NAV = [
  { href: '/', label: adminMessages.layout.nav.dashboard, icon: LayoutDashboard },
  { href: '/brand', label: adminMessages.layout.nav.brand, icon: Palette },
  { href: '/users', label: adminMessages.layout.nav.users, icon: Users },
  { href: '/registered-users', label: adminMessages.layout.nav.registeredUsers, icon: UserCircle },
  { href: '/roles', label: adminMessages.layout.nav.roles, icon: Shield },
  { href: '/organizations', label: adminMessages.layout.nav.organizations, icon: Building2 },
  { href: '/service-pricing', label: adminMessages.layout.nav.servicePricing, icon: DollarSign },
  { href: '/storefront', label: adminMessages.layout.nav.storefront, icon: Store },
  { href: '/usage-pricing', label: adminMessages.layout.nav.usagePricing, icon: Package },
  { href: '/subscriptions', label: adminMessages.layout.nav.subscriptions, icon: CreditCard },
];

function AdminNavContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 顶部标题区域 */}
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border/80 px-4">
        <span className="truncate text-sm font-semibold">{adminMessages.layout.appName}</span>
      </div>

      {/* 导航菜单区域 */}
      <nav className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <div
          className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
          style={{ scrollbarGutter: 'stable' }}
        >
          <SidebarMenu>
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    className="group h-11 rounded-xl px-3 text-sidebar-foreground/75 transition-all hover:bg-secondary hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_12px_30px_-20px_rgba(255,255,255,0.65)]"
                    asChild
                  >
                    <Link
                      href={item.href}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>

        {/* 用户信息 */}
        <div className="mt-auto pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto w-full items-center justify-start gap-3 p-2 text-sidebar-foreground/75 hover:bg-secondary hover:text-sidebar-foreground"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                        A
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-medium">管理员</div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 rounded-2xl" align="end" forceMount>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    localStorage.removeItem('admin_access_token');
                    window.location.href = '/login';
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{adminMessages.layout.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </nav>
    </div>
  );
}

function AdminMainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <BreadcrumbNav />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarContent>
            <AdminNavContent />
          </SidebarContent>
        </Sidebar>

        <AdminMainContent>{children}</AdminMainContent>
      </div>
    </SidebarProvider>
  );
}
