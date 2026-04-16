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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@apartment-ultra/shared-ui/components/ui';
import { cn } from '@apartment-ultra/shared-ui/lib/utils';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { BreadcrumbNav } from './breadcrumb-nav';
import { NavProvider, useNavContext } from './nav-context';
import { adminMessages } from '@/i18n';

/**
 * 侧边栏品牌区域
 */
function SidebarBrand() {
  return (
    <SidebarHeader className="border-b border-sidebar-border/50">
      <div className="flex h-14 items-center gap-3 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <span className="truncate text-sm font-semibold text-sidebar-foreground">
          {adminMessages.layout.appName}
        </span>
      </div>
    </SidebarHeader>
  );
}

/**
 * 导航菜单分区
 */
function NavMenuSection({
  section,
}: {
  section: {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    collapsible?: boolean;
    defaultOpen?: boolean;
    items: Array<{
      id: string;
      href: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }>;
  };
}) {
  const { currentItem } = useNavContext();
  const pathname = useLocation().pathname;
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? true);
  const Icon = section.icon;

  // 如果是当前 section 中的项，保持展开
  const isInSection = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  useEffect(() => {
    if (isInSection && !isOpen) {
      setIsOpen(true);
    }
  }, [isInSection, isOpen]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        className={cn(
          'mb-1 px-2 text-xs font-medium text-sidebar-foreground/50',
          section.collapsible && 'cursor-pointer hover:text-sidebar-foreground/70'
        )}
        onClick={() => section.collapsible && setIsOpen(!isOpen)}
      >
        {section.collapsible ? (
          <div className="flex items-center justify-between">
            <span>{section.label}</span>
            {Icon && <Icon className="h-3.5 w-3.5" />}
          </div>
        ) : (
          section.label
        )}
      </SidebarGroupLabel>
      {isOpen && (
        <SidebarMenu>
          {section.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

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
                    <ItemIcon className="h-4 w-4" />
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
              icon: section.icon,
              collapsible: section.collapsible,
              defaultOpen: section.defaultOpen,
              items: section.items.map((item) => ({
                id: item.id,
                href: item.href,
                label: item.label,
                icon: item.icon,
              })),
            }}
          />
        ))}
      </div>
    </SidebarContent>
  );
}

/**
 * 主内容区域
 */
function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <BreadcrumbNav />
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-muted/30 p-6">
        {children}
      </main>
    </div>
  );
}

/**
 * AppShell 内容组件
 */
function AppShellContent() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarNavContent />
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
