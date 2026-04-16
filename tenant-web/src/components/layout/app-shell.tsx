import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@apartment-ultra/shared-ui/lib/utils';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useState } from 'react';

import { AppHeader } from './app-header';
import { NavProvider, useNavContext } from './nav-context';
import { useBrandConfig } from '@/contexts/brand-config';
import { useAuth } from '@/contexts/auth';

/**
 * 侧边栏品牌区域
 */
function SidebarBrand() {
  const brandConfig = useBrandConfig();

  return (
    <SidebarHeader className="border-b border-sidebar-border/50">
      <Link
        to="/dashboard"
        className="flex h-14 items-center gap-3 px-4"
      >
        {brandConfig.logo_url ? (
          <img
            src={brandConfig.logo_url}
            alt=""
            className="h-8 w-8 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {brandConfig.app_name}
          </p>
        </div>
      </Link>
    </SidebarHeader>
  );
}

/**
 * 导航菜单分区
 */
function NavMenuSection({
  section,
  defaultOpen = true,
}: {
  section: { id: string; label: string; items: Array<{ id: string; href: string; label: string; icon: React.ComponentType<{ className?: string }> }> };
  defaultOpen?: boolean;
}) {
  const { currentItem } = useNavContext();
  const pathname = useLocation().pathname;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className={cn(
          'mb-1 px-2 text-xs font-medium text-sidebar-foreground/50',
          !isOpen && 'cursor-pointer hover:text-sidebar-foreground/70'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {section.label}
      </SidebarGroupLabel>
      {isOpen && (
        <SidebarMenu>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    'h-10 rounded-lg px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    'data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground'
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 truncate text-sm font-medium">
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
}

/**
 * 侧边栏导航内容
 */
function SidebarNavContent() {
  const { visibleSections } = useNavContext();

  return (
    <SidebarContent className="flex flex-col">
      <SidebarBrand />
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <NavMenuSection
            key={section.id}
            section={{
              id: section.id,
              label: section.label,
              items: section.items.map((item) => ({
                id: item.id,
                href: item.href,
                label: item.label,
                icon: item.icon,
              })),
            }}
            defaultOpen={section.id !== 'settings'}
          />
        ))}
      </div>
    </SidebarContent>
  );
}

/**
 * 侧边栏用户信息区域
 */
function SidebarUserFooter() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarFooter className="border-t border-sidebar-border/50 p-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => navigate('/settings')}
            tooltip="设置"
            className="h-10 rounded-lg px-3 text-sidebar-foreground/75 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium">
                {user?.full_name || '用户'}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/60">
                {organization?.name || '未选择团队'}
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

/**
 * 主内容区域
 */
function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen min-h-0 w-full flex-1 flex-col overflow-hidden bg-transparent">
      <AppHeader />
      <main className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col px-4 py-5 md:px-6 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * AppShell - 统一布局容器
 *
 * 整合：
 * - SidebarProvider + Sidebar
 * - AppHeader（面包屑、操作区）
 * - 主内容区域
 */
function AppShellContent() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-transparent">
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarNavContent />
          <SidebarUserFooter />
        </Sidebar>
        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </SidebarProvider>
  );
}

/**
 * AppShell 包装组件 - 提供 NavProvider
 */
export function AppShell() {
  return (
    <NavProvider>
      <AppShellContent />
    </NavProvider>
  );
}
