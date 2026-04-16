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
import { tenantMessages } from '@/i18n';

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
  '/dashboard': { label: '首页' },
  '/apartments': { label: '公寓管理', detailLabel: '公寓详情' },
  '/apartments/new': { label: '新增公寓' },
  '/rooms': { label: '全部房间' },
  '/tenants': { label: '租客管理' },
  '/tenants/new': { label: '新增租客' },
  '/tenants/[id]': { label: '租客详情' },
  '/leases': { label: '租约管理', detailLabel: '租约详情' },
  '/leases/new': { label: '新增租约' },
  '/bills': { label: '账单管理' },
  '/utilities': { label: '水电记录' },
  '/utilities/history': { label: '历史记录' },
  '/reports': { label: '经营分析' },
  '/organizations': { label: '团队管理' },
  '/organizations/new': { label: '新增团队' },
  '/notifications': { label: '通知' },
  '/settings': { label: tenantMessages.settings.breadcrumb.root },
  '/settings/team': { label: tenantMessages.settings.breadcrumb.team },
  '/settings/permissions': { label: tenantMessages.settings.breadcrumb.permissions },
  '/settings/notifications': { label: tenantMessages.settings.breadcrumb.notifications },
  '/settings/subscription': { label: tenantMessages.settings.breadcrumb.subscription },
  '/settings/subscription/purchase': { label: tenantMessages.settings.breadcrumb.subscriptionPurchase },
  '/settings/subscription/pay': { label: tenantMessages.settings.breadcrumb.subscriptionPay },
  '/settings/subscription/result': { label: tenantMessages.settings.breadcrumb.subscriptionResult },
};

/**
 * 按路径层级构建面包屑
 * 不依赖 ID 正则匹配，而是通过路径前缀匹配
 */
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  const segments = pathname.split('/').filter(Boolean);

  // 首页特殊处理
  if (pathname === '/dashboard') {
    return [{ href: '/dashboard', label: '首页' }];
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
      // 如果没找到且是最后一个路径段，跳过（避免添加无意义的面包屑）
      if (!found && isLastSegment) {
        // 不添加无意义的路径段
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
