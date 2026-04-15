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

/**
 * 面包屑配置
 * - 精确匹配时使用 label
 * - 前缀匹配时使用 detailLabel（用于详情页）
 */
const BREADCRUMB_CONFIG: Record<string, { label: string; detailLabel?: string }> = {
  '/': { label: adminMessages.layout.nav.dashboard },
  '/brand': { label: adminMessages.layout.nav.brand },
  '/users': { label: adminMessages.layout.nav.users },
  '/registered-users': { label: adminMessages.layout.nav.registeredUsers },
  '/roles': { label: adminMessages.layout.nav.roles },
  '/organizations': { label: adminMessages.layout.nav.organizations, detailLabel: '团队详情' },
  '/organizations/new': { label: '新增团队' },
  '/service-pricing': { label: adminMessages.layout.nav.servicePricing },
  '/storefront': { label: adminMessages.layout.nav.storefront },
  '/plans': { label: '套餐管理' },
  '/subscriptions': { label: adminMessages.layout.nav.subscriptions },
  '/usage-pricing': { label: adminMessages.layout.nav.usagePricing },
  '/setup': { label: '设置向导' },
};

/**
 * 按路径层级构建面包屑
 * 不依赖 ID 正则匹配，而是通过路径前缀匹配
 */
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  const segments = pathname.split('/').filter(Boolean);

  // 首页特殊处理
  if (pathname === '/') {
    return [{ href: '/', label: adminMessages.layout.nav.dashboard }];
  }

  // 从根路径开始，逐层构建面包屑
  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    currentPath += '/' + segments[i];
    const isLastSegment = i === segments.length - 1;
    const config = BREADCRUMB_CONFIG[currentPath];

    if (config) {
      // 如果是最后一个路径段且有 detailLabel，使用 detailLabel
      if (isLastSegment && config.detailLabel) {
        items.push({ href: pathname, label: config.detailLabel });
      } else if (!isLastSegment) {
        // 非最后一个路径段，作为中间节点
        items.push({ href: currentPath, label: config.label });
      } else {
        // 精确匹配且没有 detailLabel
        items.push({ href: pathname, label: config.label });
      }
    } else {
      // 没有精确匹配当前路径，尝试找前缀匹配
      let found = false;
      // 按长度倒序遍历配置键，找最长匹配的前缀
      const sortedKeys = Object.keys(BREADCRUMB_CONFIG).sort((a, b) => b.length - a.length);
      for (const key of sortedKeys) {
        if (currentPath.startsWith(key + '/') || currentPath === key) {
          const parentConfig = BREADCRUMB_CONFIG[key];
          if (parentConfig?.detailLabel) {
            items.push({ href: currentPath, label: parentConfig.detailLabel });
            found = true;
            break;
          }
        }
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
