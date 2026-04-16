import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSidebar } from '@apartment-ultra/shared-ui/components/ui';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@apartment-ultra/shared-ui/components/ui';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import { HeaderOrgSwitcher } from './header-org-switcher';
import { HeaderUserMenu } from './header-user-menu';

function BreadcrumbNav() {
  const breadcrumbs = useBreadcrumb();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <div key={item.href} className="flex items-center">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-sm font-medium text-foreground">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </BreadcrumbSeparator>
              )}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * 统一 Header 组件
 *
 * 包含：
 * - Sidebar 切换按钮
 * - 面包屑导航
 * - 组织切换器
 * - 主题切换
 * - 用户菜单
 */
export function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted/50"
          aria-label="切换侧边栏"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
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
