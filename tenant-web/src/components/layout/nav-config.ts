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
  History,
  DollarSign,
  MessageSquareMore,
} from 'lucide-react';
import { PERMISSIONS } from '@/hooks/use-permissions';
import type { AccessRule } from '@/lib/permission-access';

export interface NavItem extends AccessRule {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  id: string;
}

/** 主导航项 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: '首页',
    icon: Home,
    requiresOrganization: true,
    requireAnyPermission: true,
    id: 'dashboard',
  },
  {
    href: '/notifications',
    label: '通知',
    icon: Bell,
    requiresOrganization: true,
    requireAnyPermission: true,
    id: 'notifications',
  },
  {
    href: '/apartments',
    label: '公寓管理',
    icon: Building2,
    requiresOrganization: true,
    permission: PERMISSIONS.APARTMENT_VIEW,
    id: 'apartments',
  },
  {
    href: '/rooms',
    label: '全部房间',
    icon: DoorOpen,
    requiresOrganization: true,
    permission: PERMISSIONS.ROOM_VIEW,
    id: 'rooms',
  },
  {
    href: '/tenants',
    label: '租客管理',
    icon: Users,
    requiresOrganization: true,
    permission: PERMISSIONS.TENANT_VIEW,
    id: 'tenants',
  },
  {
    href: '/leases',
    label: '租约管理',
    icon: FileText,
    requiresOrganization: true,
    permission: PERMISSIONS.LEASE_VIEW,
    id: 'leases',
  },
  {
    href: '/utilities',
    label: '水电录入',
    icon: Zap,
    requiresOrganization: true,
    permission: PERMISSIONS.UTILITY_VIEW,
    exact: true,
    id: 'utilities',
  },
  {
    href: '/utilities/history',
    label: '历史水电记录',
    icon: History,
    requiresOrganization: true,
    permission: PERMISSIONS.UTILITY_VIEW,
    id: 'utilities-history',
  },
  {
    href: '/bills',
    label: '账单管理',
    icon: Receipt,
    requiresOrganization: true,
    permission: PERMISSIONS.BILL_VIEW,
    id: 'bills',
  },
  {
    href: '/fee-configs',
    label: '费用配置',
    icon: DollarSign,
    requiresOrganization: true,
    permission: PERMISSIONS.SETTINGS_VIEW,
    id: 'fee-configs',
  },
  {
    href: '/reports',
    label: '经营分析',
    icon: BarChart3,
    requiresOrganization: true,
    permission: PERMISSIONS.REPORT_VIEW,
    id: 'reports',
  },
];

/** 设置菜单项 */
export const SETTINGS_ITEMS: NavItem[] = [
  { href: '/settings/team', label: '团队管理', icon: Users, permission: PERMISSIONS.MEMBER_VIEW, id: 'team' },
  {
    href: '/settings/subscription',
    label: '服务购买',
    icon: CreditCard,
    requiresOrganization: true,
    requireAnyPermission: true,
    id: 'subscription',
  },
  {
    href: '/settings/notifications',
    label: '消息触达',
    icon: MessageSquareMore,
    requiresOrganization: true,
    permission: PERMISSIONS.SETTINGS_VIEW,
    id: 'notifications',
  },
  {
    href: '/settings/permissions',
    label: '功能分配',
    icon: Shield,
    permission: PERMISSIONS.SETTINGS_VIEW,
    id: 'permissions',
  },
];

/** 服务 code 到展示名的映射 */
export const PLAN_CODE_LABEL: Record<string, string> = {
  free: '免费版',
  pro: '专业版',
  enterprise: '企业版',
};
