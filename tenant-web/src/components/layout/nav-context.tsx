/**
 * 导航 Context
 *
 * 提供当前激活的导航项等信息
 */
import { createContext, useContext } from 'react';
import type { NavItem } from './nav-config';

interface NavContextType {
  currentItem: NavItem | null;
  parentItem: NavItem | null;
  currentSection: string | null;
  collapsed: boolean;
}

const NavContext = createContext<NavContextType>({
  currentItem: null,
  parentItem: null,
  currentSection: null,
  collapsed: false,
});

export function useNavContext() {
  return useContext(NavContext);
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  return <NavContext.Provider value={{ currentItem: null, parentItem: null, currentSection: null, collapsed: false }}>{children}</NavContext.Provider>;
}
