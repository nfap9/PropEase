import type { LucideIcon } from 'lucide-react';
import { CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info';

/** 账单状态 */
export const BILL_STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant; icon: LucideIcon; color?: string }
> = {
  pending: { label: '待支付', variant: 'warning', icon: Clock, color: 'warning' },
  partial: { label: '部分支付', variant: 'warning', icon: DollarSign, color: 'warning' },
  paid: { label: '已支付', variant: 'success', icon: CheckCircle, color: 'success' },
  overdue: { label: '已逾期', variant: 'destructive', icon: AlertCircle, color: 'error' },
};

/** 房间状态 */
export const ROOM_STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant; borderClass: string; bgClass: string; color?: string }
> = {
  available: { label: '空置', variant: 'success', borderClass: 'border-emerald-300 dark:border-emerald-700', bgClass: 'bg-emerald-500', color: 'success' },
  occupied: { label: '已租', variant: 'info', borderClass: 'border-blue-300 dark:border-blue-700', bgClass: 'bg-blue-500', color: 'processing' },
  maintenance: { label: '维修中', variant: 'warning', borderClass: 'border-amber-300 dark:border-amber-700', bgClass: 'bg-amber-500', color: 'warning' },
};

/** 租约状态（is_active） */
export const LEASE_STATUS_CONFIG = {
  active: { label: '生效中', variant: 'success' as BadgeVariant, color: 'success' },
  inactive: { label: '已终止', variant: 'secondary' as BadgeVariant, color: 'default' },
};

/** 组织/用户启用状态 */
export const ORG_STATUS_CONFIG = {
  active: { label: '启用', variant: 'success' as BadgeVariant, color: 'success' },
  inactive: { label: '停用', variant: 'secondary' as BadgeVariant, color: 'default' },
};

/** 是/否（如个人团队、自动续费、启用） */
export const BOOLEAN_YES_NO_CONFIG = {
  yes: { label: '是', variant: 'secondary' as BadgeVariant, color: 'processing' },
  no: { label: '否', variant: 'outline' as BadgeVariant, color: 'default' },
};

/** 订阅状态 */
export const SUBSCRIPTION_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant; color?: string }> =
  {
    active: { label: '生效中', variant: 'success', color: 'success' },
    expired: { label: '已过期', variant: 'secondary', color: 'default' },
    cancelled: { label: '已取消', variant: 'destructive', color: 'error' },
    trial: { label: '试用', variant: 'info', color: 'processing' },
  };

/** 订单支付状态 */
export const ORDER_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant; color?: string }> = {
  paid: { label: '已支付', variant: 'success', color: 'success' },
  pending: { label: '待支付', variant: 'warning', color: 'warning' },
  failed: { label: '支付失败', variant: 'destructive', color: 'error' },
  cancelled: { label: '已取消', variant: 'secondary', color: 'default' },
  expired: { label: '已过期', variant: 'secondary', color: 'default' },
};
