'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@apartment-ultra/shared-ui/components/ui';
import { NAV_ITEMS } from './nav-config';
import { tenantMessages } from '@/lib/i18n';

interface BreadcrumbItem {
  href: string;
  label: string;
}

// 设置页面的面包屑配置
const SETTINGS_BREADCRUMBS: Record<string, string> = {
  '/settings': tenantMessages.settings.breadcrumb.root,
  '/settings/team': tenantMessages.settings.breadcrumb.team,
  '/settings/permissions': tenantMessages.settings.breadcrumb.permissions,
  '/settings/notifications': tenantMessages.settings.breadcrumb.notifications,
  '/settings/subscription': tenantMessages.settings.breadcrumb.subscription,
  '/settings/subscription/purchase': tenantMessages.settings.breadcrumb.subscriptionPurchase,
  '/settings/subscription/pay': tenantMessages.settings.breadcrumb.subscriptionPay,
  '/settings/subscription/result': tenantMessages.settings.breadcrumb.subscriptionResult,
};

// 公寓页面的面包屑配置
const APARTMENTS_BREADCRUMBS: Record<string, string> = {
  '/apartments/new': '新增公寓',
};

/**
 * 从路径中提取面包屑项
 */
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  // 首页
  if (pathname === '/dashboard') {
    return [{ href: '/dashboard', label: tenantMessages.layout.nav.home }];
  }

  // 设置页面处理
  if (pathname.startsWith('/settings')) {
    // 首页 > 设置
    items.push({ href: '/settings', label: tenantMessages.settings.breadcrumb.root });
    // 子页面
    const pageTitle = SETTINGS_BREADCRUMBS[pathname];
    if (pageTitle && pathname !== '/settings') {
      items.push({ href: pathname, label: pageTitle });
    }
    return items;
  }

  // 公寓页面处理
  if (pathname.startsWith('/apartments')) {
    // 首页 > 公寓
    const matchedApartment = NAV_ITEMS.find((item) => item.href === '/apartments');
    if (matchedApartment) {
      items.push({ href: '/apartments', label: matchedApartment.label });
    }
    // 子页面（如新增公寓）
    const pageTitle = APARTMENTS_BREADCRUMBS[pathname];
    if (pageTitle) {
      items.push({ href: pathname, label: pageTitle });
    }
    return items;
  }

  // 匹配导航配置中的项目
  const matchedItem = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));

  if (matchedItem) {
    items.push({ href: matchedItem.href, label: matchedItem.label });
  }

  // 详情页处理（如 /apartments/123 -> " apartments / 详情"）
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 1) {
    const lastSegment = segments[segments.length - 1];
    // 如果最后一个segment不是已匹配的导航项，认为是详情页
    if (!matchedItem || !pathname.startsWith(matchedItem.href + '/') || pathname !== matchedItem.href) {
      // 检查是否是ID（数字或UUID格式）
      const isIdSegment = /^[0-9]+$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
      if (isIdSegment) {
        items.push({ href: pathname, label: '详情' });
      }
    }
  }

  return items;
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

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
                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground">
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
