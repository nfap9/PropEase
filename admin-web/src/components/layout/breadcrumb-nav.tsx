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
import { adminMessages } from '@/lib/i18n';

interface BreadcrumbItem {
  href: string;
  label: string;
}

const ADMIN_NAV = [
  { href: '/', label: adminMessages.layout.nav.dashboard },
  { href: '/brand', label: adminMessages.layout.nav.brand },
  { href: '/users', label: adminMessages.layout.nav.users },
  { href: '/registered-users', label: adminMessages.layout.nav.registeredUsers },
  { href: '/roles', label: adminMessages.layout.nav.roles },
  { href: '/organizations', label: adminMessages.layout.nav.organizations },
  { href: '/service-pricing', label: adminMessages.layout.nav.servicePricing },
  { href: '/storefront', label: adminMessages.layout.nav.storefront },
  { href: '/usage-pricing', label: adminMessages.layout.nav.usagePricing },
  { href: '/subscriptions', label: adminMessages.layout.nav.subscriptions },
];

/**
 * 从路径中提取面包屑项
 */
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // 首页
  if (pathname === '/') {
    return [{ href: '/', label: adminMessages.layout.nav.dashboard }];
  }

  // 匹配导航配置中的项目
  const matchedItem = ADMIN_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );

  if (matchedItem) {
    const items: BreadcrumbItem[] = [{ href: matchedItem.href, label: matchedItem.label }];

    // 详情页处理
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      const lastSegment = segments[segments.length - 1];
      // 检查是否是ID（数字或UUID格式）
      const isIdSegment = /^[0-9]+$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment);
      if (isIdSegment) {
        items.push({ href: pathname, label: '详情' });
      }
    }

    return items;
  }

  return [{ href: pathname, label: pathname.split('/').pop() || '' }];
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
                  <BreadcrumbPage className="text-sm font-medium text-foreground">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
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
