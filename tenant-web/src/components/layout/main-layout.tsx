'use client';

import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { NavContent } from './nav-content';
import { SidebarFooterContent } from './sidebar-footer';
import { BreadcrumbNav } from './breadcrumb-nav';
import { ThemeToggle } from '@/components/theme/theme-toggle';

function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen min-h-0 w-full flex-1 flex-col overflow-hidden bg-transparent">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <BreadcrumbNav />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col px-4 py-5 md:px-6 md:py-6">{children}</div>
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
          <SidebarFooterContent />
        </Sidebar>

        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
