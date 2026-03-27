'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ChevronRight } from 'lucide-react';
import { useBrandConfig } from '@/lib/brand-config-context';
import { useAuth } from '@/lib/auth/context';
import { usePermissions } from '@/hooks/use-permissions';
import { canAccessRule } from '@/lib/permission-access';
import { NAV_ITEMS } from './nav-config';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

interface NavContentProps {
  onNavClick?: () => void;
}

/**
 * 导航内容组件
 *
 * 用于桌面端侧边栏和移动端 Sheet 中显示导航菜单
 */
export function NavContent({ onNavClick }: NavContentProps) {
  const brandConfig = useBrandConfig();
  const { organization } = useAuth();
  const { permissions, hasPermission, isSuperAdmin } = usePermissions();
  const pathname = usePathname();

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    canAccessRule(item, {
      organization,
      permissions,
      isSuperAdmin,
      hasPermission,
    })
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-sidebar-border/80 px-4 py-4" data-testid="main-nav">
        <Link href="/dashboard" className="flex items-center gap-3" data-testid="nav-dashboard">
          {brandConfig.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Logo URL 来自运营配置，域名动态
            <img src={brandConfig.logo_url} alt="" className="h-9 w-9 rounded-xl object-contain" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{brandConfig.app_name}</p>
          </div>
        </Link>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
          核心业务
        </div>
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto pr-1">
          <SidebarMenu className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    className="group h-11 rounded-xl px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_12px_30px_-20px_rgba(255,255,255,0.65)]"
                    asChild
                  >
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      data-testid={`nav-${item.id}`}
                      className="flex w-full items-center gap-3"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      </nav>
    </div>
  );
}
