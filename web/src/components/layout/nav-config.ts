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
} from 'lucide-react';
import { PERMISSIONS } from '@/hooks/use-permissions';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string | null;
  exact?: boolean;
  id: string;
}

/** 主导航项 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: '首页', icon: Home, permission: null, id: 'dashboard' },
  { href: '/notifications', label: '通知', icon: Bell, permission: null, id: 'notifications' },
  {
    href: '/apartments',
    label: '公寓管理',
    icon: Building2,
    permission: PERMISSIONS.APARTMENT_VIEW,
    id: 'apartments',
  },
  { href: '/rooms', label: '全部房间', icon: DoorOpen, permission: PERMISSIONS.ROOM_VIEW, id: 'rooms' },
  { href: '/tenants', label: '租客管理', icon: Users, permission: PERMISSIONS.TENANT_VIEW, id: 'tenants' },
  { href: '/leases', label: '租约管理', icon: FileText, permission: PERMISSIONS.LEASE_VIEW, id: 'leases' },
  {
    href: '/utilities',
    label: '水电录入',
    icon: Zap,
    permission: PERMISSIONS.UTILITY_VIEW,
    exact: true,
    id: 'utilities',
  },
  {
    href: '/utilities/history',
    label: '历史水电记录',
    icon: History,
    permission: PERMISSIONS.UTILITY_VIEW,
    id: 'utilities-history',
  },
  { href: '/bills', label: '账单管理', icon: Receipt, permission: PERMISSIONS.BILL_VIEW, id: 'bills' },
  { href: '/reports', label: '经营分析', icon: BarChart3, permission: PERMISSIONS.REPORT_VIEW, id: 'reports' },
];

/** 设置菜单项 */
export const SETTINGS_ITEMS: NavItem[] = [
  { href: '/settings/team', label: '团队管理', icon: Users, permission: PERMISSIONS.MEMBER_VIEW, id: 'team' },
  { href: '/settings/subscription', label: '套餐购买', icon: CreditCard, permission: null, id: 'subscription' },
  {
    href: '/settings/permissions',
    label: '权限管理',
    icon: Shield,
    permission: PERMISSIONS.SETTINGS_VIEW,
    id: 'permissions',
  },
];

/** 套餐 code 到展示名的映射 */
export const PLAN_CODE_LABEL: Record<string, string> = {
  free: '免费版',
  pro: '专业版',
  enterprise: '企业版',
};
