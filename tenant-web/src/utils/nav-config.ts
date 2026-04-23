import type { NavItem } from '@/types';
import { SIDEBAR_NAV_CONFIG } from '@/constants/nav-config';

/** 根据当前路径查找匹配的一级导航项 */
export function findNavItemByPath(path: string): NavItem | undefined {
  for (const section of SIDEBAR_NAV_CONFIG) {
    for (const item of section.items) {
      if (item.href === path || path.startsWith(item.href + '/')) {
        return item;
      }
    }
  }
  return undefined;
}
