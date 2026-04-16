import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { NAV_SECTIONS, getRouteMeta, findNavItem, type NavSection, type NavItem } from './nav-config-v2';
import { useAuth } from '@/contexts/auth';
import { usePermissions } from '@/hooks/use-permissions';
import { canAccessRule } from '@/utils/permission-access';

interface NavContextValue {
  /** 所有分区 */
  sections: NavSection[];
  /** 当前路由所属的分区 */
  currentSection: NavSection | null;
  /** 当前路由对应的导航项 */
  currentItem: NavItem | null;
  /** 当前项的父级项（用于面包屑） */
  parentItem: NavItem | null;
  /** 过滤后的可见分区（根据权限） */
  visibleSections: NavSection[];
  /** 过滤后的可见导航项 */
  visibleItems: NavItem[];
}

const NavContext = createContext<NavContextValue | null>(null);

interface NavProviderProps {
  children: React.ReactNode;
}

/**
 * 导航上下文 Provider
 *
 * 提供：
 * - 当前路由对应的导航项和分区
 * - 根据权限过滤后的可见导航项
 */
export function NavProvider({ children }: NavProviderProps) {
  const pathname = useLocation().pathname;
  const { organization } = useAuth();
  const { permissions, hasPermission, isSuperAdmin } = usePermissions();

  const value = useMemo(() => {
    // 获取当前路由的元数据
    const routeMeta = getRouteMeta(pathname);

    // 找到当前项
    let currentItem: NavItem | null = null;
    if (routeMeta?.sectionItemId) {
      currentItem = findNavItem(routeMeta.sectionItemId) || null;
    }

    // 确定当前分区
    let currentSection: NavSection | null = null;
    if (currentItem) {
      currentSection = NAV_SECTIONS.find((s) => s.items.some((i) => i.id === currentItem!.id)) || null;
    }

    // 确定父级项（只在同分区内查找）
    let parentItem: NavItem | null = null;
    if (currentSection && currentItem) {
      // 对于详情页，父级是列表页
      // 例如 /apartments/:id 的父级是 /apartments
      const parentHref = currentItem.href.replace(/\/:[^/]+$/, '');
      if (parentHref !== currentItem.href) {
        parentItem = currentSection.items.find((i) => i.href === parentHref) || null;
      }
    }

    // 根据权限过滤分区和项
    const visibleSections = NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canAccessRule(item, {
          organization,
          permissions,
          isSuperAdmin,
          hasPermission,
        })
      ),
    })).filter((section) => section.items.length > 0);

    // 合并所有可见项
    const visibleItems = visibleSections.flatMap((s) => s.items);

    return {
      sections: NAV_SECTIONS,
      currentSection,
      currentItem,
      parentItem,
      visibleSections,
      visibleItems,
    };
  }, [pathname, organization, permissions, hasPermission, isSuperAdmin]);

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

/**
 * 使用导航上下文
 */
export function useNavContext(): NavContextValue {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNavContext must be used within NavProvider');
  }
  return context;
}
