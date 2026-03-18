'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ChevronRight, ArrowLeft } from 'lucide-react';

// Page title mapping based on route
const PAGE_TITLES: Record<string, string> = {
  '/settings': '设置',
  '/settings/team': '团队设置',
  '/settings/permissions': '权限管理',
  '/settings/notifications': '租客消息触达',
  '/settings/subscription': '我的订阅',
  '/settings/subscription/purchase': '服务购买',
  '/settings/subscription/pay': '微信扫码支付',
  '/settings/subscription/result': '支付结果',
};

function getPageTitle(pathname: string): string {
  // Try exact match first
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }
  // Try parent path for nested routes
  const parentPath = pathname.split('/').slice(0, -1).join('/');
  if (PAGE_TITLES[parentPath]) {
    return PAGE_TITLES[parentPath];
  }
  // Fallback: extract last segment
  const segments = pathname.split('/');
  return segments[segments.length - 1] || '设置';
}

function isSettingsHome(pathname: string): boolean {
  return pathname === '/settings';
}

export function SettingsBreadcrumb() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const isHome = isSettingsHome(pathname);

  if (isHome) {
    return null; // No breadcrumb on settings home page
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/settings">设置</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = isSettingsHome(pathname);

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Back button - only show on non-home pages */}
        {!isHome && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回设置
              </Link>
            </Button>
          </div>
        )}
        {/* Breadcrumb navigation */}
        <SettingsBreadcrumb />
        {/* Page content */}
        {children}
      </div>
    </MainLayout>
  );
}
