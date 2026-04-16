import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@apartment-ultra/shared-ui/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useBrandConfig } from '@/contexts/brand-config';
import { useAuth } from '@/contexts/auth';
import { NavProvider, useNavContext } from './nav-context';
import { ROUTE_META } from './nav-config-v2';

function SidebarBrand() {
  const brandConfig = useBrandConfig();

  return (
    <SidebarHeader className="border-b border-sidebar-border/50">
      <Link
        to="/workspace/dashboard"
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

function SidebarUserFooter() {
  const { user, organization } = useAuth();

  return (
    <SidebarFooter className="border-t border-sidebar-border/50 p-3">
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
          {user?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium text-sidebar-foreground">
            {user?.full_name || '用户'}
          </div>
          <div className="truncate text-xs text-sidebar-foreground/60">
            {organization?.name || '未选择团队'}
          </div>
        </div>
      </div>
    </SidebarFooter>
  );
}

function SidebarNavContent() {
  const { visibleSections } = useNavContext();
  const pathname = useLocation().pathname;

  const workspaceSection = visibleSections.find((s) => s.id === 'workspace');

  return (
    <SidebarContent className="flex flex-col">
      <SidebarBrand />
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {workspaceSection && (
          <SidebarMenu>
            {workspaceSection.items.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (() => {
                  const hasDetailPages = Object.keys(ROUTE_META).some(
                    (route) => route.startsWith(item.href + '/') && route.includes('/:')
                  );
                  if (!hasDetailPages) return false;

                  const prefix = item.href + '/';
                  if (!pathname.startsWith(prefix)) return false;
                  const remaining = pathname.slice(prefix.length);
                  return !remaining.includes('/');
                })();
              const prevItem = workspaceSection.items[index - 1];
              const showGroupHeader = prevItem?.group !== item.group;

              return (
                <SidebarMenuItem key={item.id}>
                  {showGroupHeader && item.group && (
                    <div className="px-2 py-1.5 text-xs font-medium text-sidebar-foreground/50">
                      {item.group}
                    </div>
                  )}
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
      </div>
    </SidebarContent>
  );
}

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-full w-full overflow-hidden bg-transparent">
          <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarNavContent />
            <SidebarUserFooter />
          </Sidebar>
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </SidebarProvider>
    </NavProvider>
  );
}
