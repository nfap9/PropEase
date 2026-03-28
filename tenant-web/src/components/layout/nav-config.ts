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
import { tenantMessages } from '@/lib/i18n';
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
    label: tenantMessages.layout.nav.home,
    icon: Home,
    requiresOrganization: true,
    requireAnyPermission: true,
    id: 'dashboard',
  },
  {
    href: '/notifications',
    label: tenantMessages.layout.nav.notifications,
    icon: Bell,
    requiresOrganization: true,
    requireAnyPermission: true,
    id: 'notifications',
  },
  {
    href: '/apartments',
    label: tenantMessages.layout.nav.apartments,
    icon: Building2,
    requiresOrganization: true,
    permission: PERMISSIONS.APARTMENT_VIEW,
    id: 'apartments',
  },
  {
    href: '/rooms',
    label: tenantMessages.layout.nav.rooms,
    icon: DoorOpen,
    requiresOrganization: true,
    permission: PERMISSIONS.ROOM_VIEW,
    id: 'rooms',
  },
  {
    href: '/tenants',
    label: tenantMessages.layout.nav.tenants,
    icon: Users,
    requiresOrganization: true,
    permission: PERMISSIONS.TENANT_VIEW,
    id: 'tenants',
  },
  {
    href: '/leases',
    label: tenantMessages.layout.nav.leases,
    icon: FileText,
    requiresOrganization: true,
    permission: PERMISSIONS.LEASE_VIEW,
    id: 'leases',
  },
  {
    href: '/utilities',
    label: tenantMessages.layout.nav.utilities,
    icon: Zap,
    requiresOrganization: true,
    permission: PERMISSIONS.UTILITY_VIEW,
    exact: true,
    id: 'utilities',
  },
  {
    href: '/utilities/history',
    label: tenantMessages.layout.nav.utilityHistory,
    icon: History,
    requiresOrganization: true,
    permission: PERMISSIONS.UTILITY_VIEW,
    id: 'utilities-history',
  },
  {
    href: '/bills',
    label: tenantMessages.layout.nav.bills,
    icon: Receipt,
    requiresOrganization: true,
    permission: PERMISSIONS.BILL_VIEW,
    id: 'bills',
  },
  {
    href: '/fee-configs',
    label: tenantMessages.layout.nav.feeConfigs,
    icon: DollarSign,
    requiresOrganization: true,
    permission: PERMISSIONS.SETTINGS_VIEW,
    id: 'fee-configs',
  },
  {
    href: '/reports',
    label: tenantMessages.layout.nav.reports,
    icon: BarChart3,
    requiresOrganization: true,
    permission: PERMISSIONS.REPORT_VIEW,
    id: 'reports',
  },
];

/** 设置菜单项 */
export const SETTINGS_ITEMS: NavItem[] = [
  { href: '/settings/team', label: tenantMessages.settings.nav.team, icon: Users, permission: PERMISSIONS.MEMBER_VIEW, id: 'team' },
  {
    href: '/settings/subscription',
    label: tenantMessages.settings.nav.subscription,
    icon: CreditCard,
    requiresOrganization: true,
    requireAnyPermission: true,
    id: 'subscription',
  },
  {
    href: '/settings/notifications',
    label: tenantMessages.settings.nav.notifications,
    icon: MessageSquareMore,
    requiresOrganization: true,
    permission: PERMISSIONS.SETTINGS_VIEW,
    id: 'notifications',
  },
  {
    href: '/settings/permissions',
    label: tenantMessages.settings.nav.permissions,
    icon: Shield,
    permission: PERMISSIONS.SETTINGS_VIEW,
    id: 'permissions',
  },
];

/** 服务 code 到展示名的映射 */
export const PLAN_CODE_LABEL: Record<string, string> = {
  free: tenantMessages.layout.plans.free,
  pro: tenantMessages.layout.plans.pro,
  enterprise: tenantMessages.layout.plans.enterprise,
};
