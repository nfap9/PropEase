import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteMeta, findNavItem, findNavItemByHref } from '@/components/layout/nav-config-v2';

export interface BreadcrumbItem {
  href: string;
  label: string;
}

/**
 * 自动面包屑 Hook
 */
export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = useLocation().pathname;

  return useMemo(() => {
    // 首页
    if (pathname === '/') {
      return [{ href: '/', label: '工作台' }];
    }

    const routeMeta = getRouteMeta(pathname);
    if (!routeMeta?.sectionItemId) {
      return [];
    }

    const currentItem = findNavItem(routeMeta.sectionItemId);
    if (!currentItem) {
      return [];
    }

    const items: BreadcrumbItem[] = [];

    // 添加父级（如果当前是详情页）
    const parentHref = currentItem.href.replace(/\/:[^/]+$/, '');
    if (parentHref !== currentItem.href) {
      const parentItem = findNavItemByHref(parentHref);
      if (parentItem) {
        items.push({ href: parentItem.href, label: parentItem.label });
      }
    }

    // 确定当前项的标签
    const currentLabel = routeMeta.detailLabel || currentItem.detailLabel || currentItem.label;

    // 添加当前项
    items.push({ href: pathname, label: currentLabel });

    return items;
  }, [pathname]);
}
