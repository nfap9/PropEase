import {
  LayoutDashboard,
  Users,
  UserCircle,
  Shield,
  Building2,
  CreditCard,
  Palette,
  DollarSign,
  Settings,
} from 'lucide-react';
import { adminMessages } from '@/constants/messages';

/** 导航项 */
export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** 详情页标签 */
  detailLabel?: string;
}

/** 导航分区 */
export interface NavSection {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认展开状态 */
  defaultOpen?: boolean;
  items: NavItem[];
}

/** 路由元数据 */
export interface RouteMeta {
  /** 所属分区的 item id */
  sectionItemId?: string;
  /** 详情页标签 */
  detailLabel?: string;
}

/** 导航配置 */
export interface NavConfig {
  sections: NavSection[];
  routeMeta: Record<string, RouteMeta>;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    href: '/',
    label: adminMessages.layout.nav.dashboard,
    icon: LayoutDashboard,
  },
  {
    id: 'brand',
    href: '/brand',
    label: adminMessages.layout.nav.brand,
    icon: Palette,
  },
  {
    id: 'users',
    href: '/users',
    label: adminMessages.layout.nav.users,
    icon: Users,
  },
  {
    id: 'registered-users',
    href: '/registered-users',
    label: adminMessages.layout.nav.registeredUsers,
    icon: UserCircle,
  },
  {
    id: 'organizations',
    href: '/organizations',
    label: adminMessages.layout.nav.organizations,
    icon: Building2,
  },
];

const BILLING_NAV_ITEMS: NavItem[] = [
  {
    id: 'billing-plans',
    href: '/billing/plans',
    label: adminMessages.layout.nav.servicePricing,
    icon: DollarSign,
  },
  {
    id: 'billing-orders',
    href: '/billing/orders',
    label: adminMessages.layout.nav.billingOrders,
    icon: CreditCard,
  },
];

/** 主导航分区 */
export const MAIN_SECTION: NavSection = {
  id: 'main',
  label: '导航菜单',
  items: MAIN_NAV_ITEMS,
};

/** 计费管理分区 */
export const BILLING_SECTION: NavSection = {
  id: 'billing',
  label: adminMessages.layout.nav.billingManagement,
  icon: DollarSign,
  collapsible: true,
  defaultOpen: false,
  items: BILLING_NAV_ITEMS,
};

/** 所有导航分区 */
export const NAV_SECTIONS: NavSection[] = [MAIN_SECTION, BILLING_SECTION];

/** 路由元数据映射 */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/': { sectionItemId: 'dashboard' },
  '/brand': { sectionItemId: 'brand' },
  '/users': { sectionItemId: 'users' },
  '/registered-users': { sectionItemId: 'registered-users' },
  '/organizations': { sectionItemId: 'organizations' },
  '/organizations/:id': { sectionItemId: 'organizations', detailLabel: '团队详情' },
  '/billing': { sectionItemId: 'billing-plans' },
  '/billing/plans': { sectionItemId: 'billing-plans' },
  '/billing/orders': { sectionItemId: 'billing-orders' },
  '/setup': { sectionItemId: undefined },
};

/** 获取路由元数据 */
export function getRouteMeta(pathname: string): RouteMeta | undefined {
  // 精确匹配
  if (ROUTE_META[pathname]) {
    return ROUTE_META[pathname];
  }

  // 尝试前缀匹配（处理 :id 等动态路由）
  const sortedKeys = Object.keys(ROUTE_META).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (key.includes(':')) {
      const pattern = key.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathname)) {
        return ROUTE_META[key];
      }
    }
  }

  return undefined;
}

/** 查找导航项 by id */
export function findNavItem(id: string): NavItem | undefined {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((item) => item.id === id);
    if (item) return item;
  }
  return undefined;
}

/** 查找导航项 by href */
export function findNavItemByHref(href: string): NavItem | undefined {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((item) => item.href === href);
    if (item) return item;
  }
  return undefined;
}
