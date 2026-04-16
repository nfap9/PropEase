import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavContext } from '@/components/layout/nav-context';
import { getRouteMeta } from '@/components/layout/nav-config-v2';

export interface BreadcrumbItem {
  href: string;
  label: string;
}

/**
 * 自动面包屑 Hook
 */
export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = useLocation().pathname;
  const { currentItem, parentItem, currentSection } = useNavContext();

  return useMemo(() => {
    // 首页
    if (pathname === '/') {
      return [{ href: '/', label: '工作台' }];
    }

    const items: BreadcrumbItem[] = [];

    // 添加父级（如果存在）
    if (parentItem) {
      items.push({ href: parentItem.href, label: parentItem.label });
    }

    // 确定当前项的标签
    let currentLabel = currentItem?.label || '';

    // 检查是否有路由级别的 detailLabel 覆盖
    const routeMeta = getRouteMeta(pathname);
    if (routeMeta?.detailLabel) {
      currentLabel = routeMeta.detailLabel;
    } else if (currentItem?.detailLabel) {
      currentLabel = currentItem.detailLabel;
    }

    // 添加当前项
    if (currentLabel) {
      items.push({ href: pathname, label: currentLabel });
    }

    return items;
  }, [pathname, currentItem, parentItem, currentSection]);
}
