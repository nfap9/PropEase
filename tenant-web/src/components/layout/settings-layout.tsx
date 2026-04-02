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
} from '@apartment-ultra/shared-ui';
import { ChevronRight } from 'lucide-react';
import { tenantMessages } from '@/lib/i18n';

// Page title mapping based on route
const PAGE_TITLES: Record<string, string> = {
  '/settings': tenantMessages.settings.breadcrumb.root,
  '/settings/team': tenantMessages.settings.breadcrumb.team,
  '/settings/permissions': tenantMessages.settings.breadcrumb.permissions,
  '/settings/notifications': tenantMessages.settings.breadcrumb.notifications,
  '/settings/subscription': tenantMessages.settings.breadcrumb.subscription,
  '/settings/subscription/purchase': tenantMessages.settings.breadcrumb.subscriptionPurchase,
  '/settings/subscription/pay': tenantMessages.settings.breadcrumb.subscriptionPay,
  '/settings/subscription/result': tenantMessages.settings.breadcrumb.subscriptionResult,
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
  return segments[segments.length - 1] || tenantMessages.settings.breadcrumb.root;
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
              <Link href="/settings">{tenantMessages.settings.breadcrumb.root}</Link>
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
  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Breadcrumb navigation */}
        <SettingsBreadcrumb />
        {/* Page content */}
        {children}
      </div>
    </MainLayout>
  );
}
