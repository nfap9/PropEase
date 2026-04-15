'use client';

/**
 * 租户端导航内容组件
 *
 * 用于桌面端侧边栏和移动端 Sheet 中显示导航菜单
 * 根据用户权限动态过滤可见菜单项
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ChevronRight, Settings } from 'lucide-react';
import { useBrandConfig } from '@/lib/brand-config-context';
import { useAuth } from '@/lib/auth/context';
import { usePermissions } from '@/hooks/use-permissions';
import { canAccessRule } from '@/lib/permission-access';
import { NAV_ITEMS, SETTINGS_ITEMS } from './nav-config';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar,
  AvatarFallback,
} from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@apartment-ultra/shared-ui/lib/utils';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { tenantMessages } from '@/lib/i18n';

interface NavContentProps {
  /** 导航项点击回调（用于移动端关闭 Sheet） */
  onNavClick?: () => void;
}

/**
 * 导航内容组件
 *
 * 功能：
 * 1. 显示品牌 Logo 和应用名称
 * 2. 根据用户权限过滤可见菜单项
 * 3. 高亮当前激活的菜单项
 * 4. 用户头像下拉菜单
 */
export function NavContent({ onNavClick }: NavContentProps) {
  const brandConfig = useBrandConfig();
  const { user, organization, logout } = useAuth();
  const { permissions, hasPermission, isSuperAdmin } = usePermissions();
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 当进入 settings 子路由时自动展开设置菜单
  useEffect(() => {
    setSettingsOpen(pathname.startsWith('/settings'));
  }, [pathname]);

  // 根据权限过滤可见的导航项
  const visibleNavItems = NAV_ITEMS.filter((item) =>
    canAccessRule(item, {
      organization,
      permissions,
      isSuperAdmin,
      hasPermission,
    })
  );

  // 根据权限过滤可见的设置项
  const visibleSettingsItems = SETTINGS_ITEMS.filter((item) =>
    canAccessRule(item, {
      organization,
      permissions,
      isSuperAdmin,
      hasPermission,
    })
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 品牌 Logo 和应用名称区域 */}
      <div className="sidebar-glow flex h-14 shrink-0 items-center border-b border-sidebar-border/50 px-4" data-testid="main-nav">
        <Link href="/dashboard" className="flex items-center gap-3" data-testid="nav-dashboard">
          {brandConfig.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Logo URL 来自运营配置，域名动态
            <img src={brandConfig.logo_url} alt="" className="h-9 w-9 rounded-lg object-contain" />
          ) : (
            // 无 Logo 时显示默认图标
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {brandConfig.app_name}
            </p>
          </div>
        </Link>
      </div>

      {/* 导航菜单区域 */}
      <nav className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarGutter: 'stable' }}>
          <SidebarMenu>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              // 判断是否为当前激活的菜单项
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    className="nav-item-slide group h-11 rounded-lg px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    asChild
                  >
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      data-testid={`nav-${item.id}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <Icon className="icon-glow h-4 w-4" />
                      <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {/* 设置菜单（可折叠） */}
            {visibleSettingsItems.length > 0 && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/settings')}
                    tooltip="设置"
                    className="nav-item-slide group h-11 rounded-lg px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                  >
                    <Settings className="icon-glow h-4 w-4" />
                    <span className="flex-1 truncate text-sm font-medium">设置</span>
                    <ChevronRight className={cn('h-3.5 w-3.5 transition-transform duration-200', settingsOpen && 'rotate-90')} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {settingsOpen && (
                  <div className="submenu-enter">
                    {visibleSettingsItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.label}
                            className="nav-item-slide ml-3 h-10 rounded-md px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                            asChild
                          >
                            <Link href={item.href} onClick={onNavClick} className="flex min-w-0 items-center gap-3">
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="flex-1 truncate text-sm font-medium">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </SidebarMenu>
        </div>

        {/* 用户头像下拉菜单 */}
        <div className="mt-auto pt-4">
          <SidebarSeparator className="mb-3" />
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
                        {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-medium">
                        {user?.full_name || tenantMessages.common.user}
                      </div>
                      <div className="truncate text-xs text-sidebar-foreground/60">
                        {organization?.name || tenantMessages.common.currentTeam}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 rounded-xl" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                      <p className="text-xs leading-none text-sidebar-foreground/60">{user?.phone}</p>
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
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{tenantMessages.common.logout}</span>
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
