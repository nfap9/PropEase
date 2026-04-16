import {
  Home,
  Building2,
  DoorOpen,
  Users,
  FileText,
  Zap,
  Receipt,
  BarChart3,
  Bell,
  Shield,
  CreditCard,
  MessageSquareMore,
  Settings,
} from 'lucide-react';
import { PERMISSIONS } from '@/hooks/use-permissions';
import type { AccessRule } from '@/utils/permission-access';

/** 导航项 */
export interface NavItem extends AccessRule {
  id: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** 详情页标签（如公寓详情） */
  detailLabel?: string;
}

/** 导航分区 */
export interface NavSection {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** 是否可折叠（用于设置分区） */
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
  /** 路由到分区/项的映射 */
  routeMeta: Record<string, RouteMeta>;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: '首页',
    icon: Home,
    requiresOrganization: true,
    requireAnyPermission: true,
  },
  {
    id: 'notifications',
    href: '/notifications',
    label: '通知',
    icon: Bell,
    requiresOrganization: true,
    requireAnyPermission: true,
  },
  {
    id: 'apartments',
    href: '/apartments',
    label: '公寓管理',
    icon: Building2,
    requiresOrganization: true,
    permission: PERMISSIONS.APARTMENT_VIEW,
  },
  {
    id: 'rooms',
    href: '/rooms',
    label: '全部房间',
    icon: DoorOpen,
    requiresOrganization: true,
    permission: PERMISSIONS.ROOM_VIEW,
  },
  {
    id: 'tenants',
    href: '/tenants',
    label: '租客管理',
    icon: Users,
    requiresOrganization: true,
    permission: PERMISSIONS.TENANT_VIEW,
  },
  {
    id: 'leases',
    href: '/leases',
    label: '租约管理',
    icon: FileText,
    requiresOrganization: true,
    permission: PERMISSIONS.LEASE_VIEW,
  },
  {
    id: 'utilities',
    href: '/utilities',
    label: '水电记录',
    icon: Zap,
    requiresOrganization: true,
    permission: PERMISSIONS.UTILITY_VIEW,
  },
  {
    id: 'bills',
    href: '/bills',
    label: '账单管理',
    icon: Receipt,
    requiresOrganization: true,
    permission: PERMISSIONS.BILL_VIEW,
  },
  {
    id: 'reports',
    href: '/reports',
    label: '经营分析',
    icon: BarChart3,
    requiresOrganization: true,
    permission: PERMISSIONS.REPORT_VIEW,
  },
];

const SETTINGS_NAV_ITEMS: NavItem[] = [
  {
    id: 'settings',
    href: '/settings',
    label: '设置概览',
    icon: Settings,
    requiresOrganization: true,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
  {
    id: 'settings-team',
    href: '/settings/team',
    label: '团队管理',
    icon: Users,
    permission: PERMISSIONS.MEMBER_VIEW,
  },
  {
    id: 'settings-subscription',
    href: '/settings/subscription',
    label: '服务购买',
    icon: CreditCard,
    requiresOrganization: true,
    requireAnyPermission: true,
  },
  {
    id: 'settings-notifications',
    href: '/settings/notifications',
    label: '消息触达',
    icon: MessageSquareMore,
    requiresOrganization: true,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
  {
    id: 'settings-permissions',
    href: '/settings/permissions',
    label: '功能分配',
    icon: Shield,
    permission: PERMISSIONS.SETTINGS_VIEW,
  },
];

/** 主导航分区 */
export const MAIN_SECTION: NavSection = {
  id: 'main',
  label: '导航菜单',
  items: MAIN_NAV_ITEMS,
};

/** 设置导航分区 */
export const SETTINGS_SECTION: NavSection = {
  id: 'settings',
  label: '设置',
  icon: Settings,
  collapsible: true,
  defaultOpen: false,
  items: SETTINGS_NAV_ITEMS,
};

/** 所有导航分区 */
export const NAV_SECTIONS: NavSection[] = [MAIN_SECTION, SETTINGS_SECTION];

/** 路由元数据映射 */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/dashboard': { sectionItemId: 'dashboard' },
  '/notifications': { sectionItemId: 'notifications' },
  '/apartments': { sectionItemId: 'apartments' },
  '/apartments/new': { sectionItemId: 'apartments' },
  '/apartments/:id': { sectionItemId: 'apartments', detailLabel: '公寓详情' },
  '/rooms': { sectionItemId: 'rooms' },
  '/tenants': { sectionItemId: 'tenants' },
  '/tenants/:id': { sectionItemId: 'tenants', detailLabel: '租客详情' },
  '/leases': { sectionItemId: 'leases' },
  '/leases/:id': { sectionItemId: 'leases', detailLabel: '租约详情' },
  '/bills': { sectionItemId: 'bills' },
  '/utilities': { sectionItemId: 'utilities' },
  '/utilities/history': { sectionItemId: 'utilities', detailLabel: '历史记录' },
  '/reports': { sectionItemId: 'reports' },
  '/settings': { sectionItemId: 'settings' },
  '/settings/team': { sectionItemId: 'settings-team' },
  '/settings/notifications': { sectionItemId: 'settings-notifications' },
  '/settings/permissions': { sectionItemId: 'settings-permissions' },
  '/settings/subscription': { sectionItemId: 'settings-subscription' },
  '/settings/subscription/purchase': { sectionItemId: 'settings-subscription', detailLabel: '服务购买' },
  '/settings/subscription/pay': { sectionItemId: 'settings-subscription', detailLabel: '支付' },
  '/settings/subscription/result': { sectionItemId: 'settings-subscription', detailLabel: '支付结果' },
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
    // 跳过精确匹配的 key
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
