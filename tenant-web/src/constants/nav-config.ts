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
  Settings,
  UserCog,
  CreditCard,
} from 'lucide-react';

import type { NavItem } from '@/types';

/** 导航分区 */
export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

/** 侧边栏导航配置 */
export const SIDEBAR_NAV_CONFIG: NavSection[] = [
  {
    id: 'main',
    label: '工作台',
    items: [
      { id: 'dashboard', href: '/workspace/dashboard', label: '首页', icon: Home },
      { id: 'rooms', href: '/workspace/rooms', label: '全部房间', icon: DoorOpen },
      { id: 'notifications', href: '/workspace/notifications', label: '通知', icon: Bell },
    ],
  },
  {
    id: 'property',
    label: '资产',
    items: [
      { id: 'apartments', href: '/workspace/apartments', label: '公寓管理', icon: Building2 },
      { id: 'tenants', href: '/workspace/tenants', label: '租客管理', icon: Users },
      { id: 'leases', href: '/workspace/leases', label: '租约管理', icon: FileText },
    ],
  },
  {
    id: 'finance',
    label: '财务',
    items: [
      { id: 'utilities', href: '/workspace/utilities', label: '水电记录', icon: Zap },
      { id: 'bills', href: '/workspace/bills', label: '账单管理', icon: Receipt },
    ],
  },
  {
    id: 'analytics',
    label: '分析',
    items: [
      { id: 'reports', href: '/workspace/reports', label: '经营分析', icon: BarChart3 },
    ],
  },
  {
    id: 'settings',
    label: '设置',
    items: [
      { id: 'team', href: '/workspace/team', label: '团队管理', icon: UserCog },
      { id: 'permissions', href: '/workspace/permissions', label: '功能分配', icon: Settings },
      { id: 'subscription', href: '/workspace/subscription', label: '订阅管理', icon: CreditCard },
    ],
  },
];

/** 路由元数据 */
export interface RouteMeta {
  sectionItemId?: string;
  detailLabel?: string;
}

/** 获取路由元数据 */
export function getRouteMeta(pathname: string): RouteMeta | undefined {
  return undefined;
}
