import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { NAV_SECTIONS, getRouteMeta, findNavItem, type NavSection, type NavItem } from './nav-config-v2';

interface NavContextValue {
  sections: NavSection[];
  currentSection: NavSection | null;
  currentItem: NavItem | null;
  parentItem: NavItem | null;
  visibleSections: NavSection[];
  visibleItems: NavItem[];
}

const NavContext = createContext<NavContextValue | null>(null);

interface NavProviderProps {
  children: React.ReactNode;
}

/**
 * 导航上下文 Provider
 */
export function NavProvider({ children }: NavProviderProps) {
  const pathname = useLocation().pathname;

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

    // 确定父级项（详情页）
    let parentItem: NavItem | null = null;
    if (currentSection && currentItem) {
      const parentHref = currentItem.href.replace(/\/:[^/]+$/, '');
      if (parentHref !== currentItem.href) {
        parentItem = currentSection.items.find((i) => i.href === parentHref) || null;
      }
    }

    // 可见分区（admin-web 目前没有权限过滤，保持全部）
    const visibleSections = NAV_SECTIONS;
    const visibleItems = visibleSections.flatMap((s) => s.items);

    return {
      sections: NAV_SECTIONS,
      currentSection,
      currentItem,
      parentItem,
      visibleSections,
      visibleItems,
    };
  }, [pathname]);

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
