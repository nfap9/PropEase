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
  /** 分组名称（用于菜单内部分组） */
  group?: string;
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

/** 工作台导航项（公寓管理相关） */
const WORKSPACE_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    href: '/workspace/dashboard',
    label: '首页',
    icon: Home,
    requiresOrganization: true,
    requireAnyPermission: true,
  },
  {
    id: 'notifications',
    href: '/workspace/notifications',
    label: '通知',
    icon: Bell,
    requiresOrganization: true,
    requireAnyPermission: true,
  },
  {
    id: 'apartments',
    href: '/workspace/apartments',
    label: '公寓管理',
    icon: Building2,
    requiresOrganization: true,
    permission: PERMISSIONS.APARTMENT_VIEW,
  },
  {
    id: 'rooms',
    href: '/workspace/rooms',
    label: '全部房间',
    icon: DoorOpen,
    requiresOrganization: true,
    permission: PERMISSIONS.ROOM_VIEW,
  },
  {
    id: 'tenants',
    href: '/workspace/tenants',
    label: '租客管理',
    icon: Users,
    requiresOrganization: true,
    permission: PERMISSIONS.TENANT_VIEW,
  },
  {
    id: 'leases',
    href: '/workspace/leases',
    label: '租约管理',
    icon: FileText,
    requiresOrganization: true,
    permission: PERMISSIONS.LEASE_VIEW,
  },
  {
    id: 'utilities',
    href: '/workspace/utilities',
    label: '水电记录',
    icon: Zap,
    requiresOrganization: true,
    permission: PERMISSIONS.UTILITY_VIEW,
  },
  {
    id: 'bills',
    href: '/workspace/bills',
    label: '账单管理',
    icon: Receipt,
    requiresOrganization: true,
    permission: PERMISSIONS.BILL_VIEW,
  },
  {
    id: 'reports',
    href: '/workspace/reports',
    label: '经营分析',
    icon: BarChart3,
    requiresOrganization: true,
    permission: PERMISSIONS.REPORT_VIEW,
  },
  {
    id: 'team',
    href: '/workspace/team',
    label: '团队信息',
    icon: Users,
    permission: PERMISSIONS.MEMBER_VIEW,
    group: '团队设置',
  },
  {
    id: 'team-members',
    href: '/workspace/team/members',
    label: '团队成员',
    icon: Users,
    permission: PERMISSIONS.MEMBER_VIEW,
    group: '团队设置',
  },
  {
    id: 'permissions',
    href: '/workspace/permissions',
    label: '功能分配',
    icon: Shield,
    permission: PERMISSIONS.SETTINGS_VIEW,
    group: '团队设置',
  },
];

/** 工作台导航分区 */
export const WORKSPACE_SECTION: NavSection = {
  id: 'workspace',
  label: '工作台',
  items: WORKSPACE_NAV_ITEMS,
};

/** 所有导航分区 */
export const NAV_SECTIONS: NavSection[] = [WORKSPACE_SECTION];

/** 路由元数据映射 */
export const ROUTE_META: Record<string, RouteMeta> = {
  '/workspace/dashboard': { sectionItemId: 'dashboard' },
  '/workspace/notifications': { sectionItemId: 'notifications' },
  '/workspace/team': { sectionItemId: 'team' },
  '/workspace/team/members': { sectionItemId: 'team-members' },
  '/workspace/permissions': { sectionItemId: 'permissions' },
  '/workspace/apartments': { sectionItemId: 'apartments' },
  '/workspace/apartments/new': { sectionItemId: 'apartments' },
  '/workspace/apartments/:id': { sectionItemId: 'apartments', detailLabel: '公寓详情' },
  '/workspace/rooms': { sectionItemId: 'rooms' },
  '/workspace/tenants': { sectionItemId: 'tenants' },
  '/workspace/tenants/:id': { sectionItemId: 'tenants', detailLabel: '租客详情' },
  '/workspace/leases': { sectionItemId: 'leases' },
  '/workspace/leases/:id': { sectionItemId: 'leases', detailLabel: '租约详情' },
  '/workspace/bills': { sectionItemId: 'bills' },
  '/workspace/utilities': { sectionItemId: 'utilities' },
  '/workspace/utilities/history': { sectionItemId: 'utilities', detailLabel: '历史记录' },
  '/workspace/reports': { sectionItemId: 'reports' },
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
