import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@apartment-ultra/shared-ui/components/ui';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { HeaderOrgSwitcher } from './header-org-switcher';
import { HeaderUserMenu } from './header-user-menu';
import { Outlet } from 'react-router-dom';
import { useBrandConfig } from '@/contexts/brand-config';

/**
 * 面包屑导航
 */
function BreadcrumbNav() {
  const items = [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/workspace/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              首页
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          /
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="text-sm font-medium text-foreground">选择团队</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * 简单 Header - 无侧边栏切换按钮
 */
function SimpleHeader() {
  const brandConfig = useBrandConfig();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <Link
          to="/workspace/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted/50"
        >
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </Link>
        <BreadcrumbNav />
      </div>

      <div className="flex items-center gap-2">
        <HeaderOrgSwitcher />
        <ThemeToggle />
        <HeaderUserMenu />
      </div>
    </header>
  );
}

/**
 * 简单布局 - 仅包含 Header，无侧边栏
 * 用于组织选择等不需要侧边栏的页面
 */
export function SimpleHeaderLayout() {
  return (
    <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden bg-transparent">
      <SimpleHeader />
      <main className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
