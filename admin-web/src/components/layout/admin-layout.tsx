import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  DollarSign,
  ChevronDown,
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
import { cn } from '@apartment-ultra/shared-ui/lib/utils';
import { adminMessages } from '@/i18n';
import { BreadcrumbNav } from './breadcrumb-nav';
import { adminApiEndpoints } from '@/api/admin-client';

const ADMIN_NAV = [
  { href: '/', label: adminMessages.layout.nav.dashboard, icon: LayoutDashboard },
  { href: '/brand', label: adminMessages.layout.nav.brand, icon: Palette },
  { href: '/users', label: adminMessages.layout.nav.users, icon: Users },
  { href: '/registered-users', label: adminMessages.layout.nav.registeredUsers, icon: UserCircle },
  { href: '/roles', label: adminMessages.layout.nav.roles, icon: Shield },
  { href: '/organizations', label: adminMessages.layout.nav.organizations, icon: Building2 },
];

const BILLING_NAV = [
  { href: '/billing/plans', label: adminMessages.layout.nav.servicePricing, icon: DollarSign },
  { href: '/billing/usage-pricing', label: adminMessages.layout.nav.usagePricing, icon: Package },
  { href: '/billing/orders', label: adminMessages.layout.nav.billingOrders, icon: CreditCard },
];

function AdminNavContent() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [billingOpen, setBillingOpen] = useState(false);

  // 进入 billing 路由时自动展开
  useEffect(() => {
    setBillingOpen(pathname.startsWith('/billing'));
  }, [pathname]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 顶部标题区域 */}
      <div className="sidebar-glow flex h-14 shrink-0 items-center border-b border-sidebar-border/50 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="truncate text-sm font-semibold text-sidebar-foreground">
            {adminMessages.layout.appName}
          </span>
        </div>
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
                    className="nav-item-slide group h-11 rounded-lg px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    asChild
                  >
                    <Link
                      to={item.href}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <Icon className="icon-glow h-4 w-4" />
                      <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {/* 计费管理子菜单 */}
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith('/billing')}
                  tooltip={adminMessages.layout.nav.billingManagement}
                  className="nav-item-slide group h-11 rounded-lg px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  onClick={() => setBillingOpen(!billingOpen)}
                >
                  <Link
                    to="/billing/plans"
                    className="flex min-w-0 items-center gap-3"
                  >
                    <DollarSign className="icon-glow h-4 w-4" />
                    <span className="flex-1 truncate text-sm font-medium">{adminMessages.layout.nav.billingManagement}</span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', billingOpen && 'rotate-180')} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {billingOpen && (
                <div className="submenu-enter">
                  {BILLING_NAV.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.label}
                          className="nav-item-slide ml-6 h-9 rounded-md px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                          asChild
                        >
                          <Link
                            to={item.href}
                            className="flex min-w-0 items-center gap-3"
                          >
                            <Icon className="h-4 w-4" />
                            <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </div>
              )}
            </>
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
                    className="avatar-hover h-auto w-full items-center justify-start gap-3 p-2 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
                <DropdownMenuContent className="w-64 rounded-xl" align="end" forceMount>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await adminApiEndpoints.logout();
                      } catch {
                        // 即使失败也继续清除本地状态
                      }
                      localStorage.removeItem('admin_access_token');
                      // Clear cookie for middleware
                      document.cookie = 'admin_access_token=; path=/; max-age=0; SameSite=Lax';
                      navigate('/login');
                    }}
                  >
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

function AdminMainContent() {
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

      <main className="flex-1 overflow-auto bg-muted/30 p-6">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarContent>
            <AdminNavContent />
          </SidebarContent>
        </Sidebar>

        <AdminMainContent />
      </div>
    </SidebarProvider>
  );
}
