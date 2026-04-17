import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@apartment-ultra/shared-ui/lib/utils';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { NavProvider, useNavContext } from './nav-context';
import { ROUTE_META } from './nav-config-v2';

function SidebarNavContent() {
  const { visibleSections } = useNavContext();
  const pathname = useLocation().pathname;

  const workspaceSection = visibleSections.find((s) => s.id === 'workspace');

  return (
    <SidebarContent className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
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
                    <div className="px-2 py-1.5 text-xs font-medium text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
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
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
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
      <div className="flex justify-end p-3">
        <SidebarTrigger className="h-7 w-7" />
      </div>
    </SidebarContent>
  );
}

export function WorkspaceLayout() {
  return (
    <NavProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="relative flex h-full w-full overflow-hidden bg-transparent">
          <Sidebar side="left" variant="sidebar" collapsible="icon" position="relative">
            <SidebarNavContent />
          </Sidebar>
          <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </NavProvider>
  );
}
