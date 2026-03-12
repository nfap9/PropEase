/**
 * 共享状态配置 - 统一各类状态的标签、变体、图标
 */
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
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  pending: { label: '待支付', variant: 'warning', icon: Clock },
  partial: { label: '部分支付', variant: 'warning', icon: DollarSign },
  paid: { label: '已支付', variant: 'success', icon: CheckCircle },
  overdue: { label: '已逾期', variant: 'destructive', icon: AlertCircle },
};

/** 房间状态 */
export const ROOM_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  available: { label: '空置', variant: 'success' },
  occupied: { label: '已租', variant: 'info' },
  maintenance: { label: '维修中', variant: 'warning' },
};

/** 租约状态（is_active） */
export const LEASE_STATUS_CONFIG = {
  active: { label: '生效中', variant: 'success' as BadgeVariant },
  inactive: { label: '已终止', variant: 'secondary' as BadgeVariant },
};

/** 组织/用户启用状态 */
export const ORG_STATUS_CONFIG = {
  active: { label: '启用', variant: 'success' as BadgeVariant },
  inactive: { label: '停用', variant: 'secondary' as BadgeVariant },
};

/** 是/否（如个人团队、自动续费、启用） */
export const BOOLEAN_YES_NO_CONFIG = {
  yes: { label: '是', variant: 'secondary' as BadgeVariant },
  no: { label: '否', variant: 'outline' as BadgeVariant },
};

/** 订阅状态 */
export const SUBSCRIPTION_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> =
  {
    active: { label: '生效中', variant: 'success' },
    expired: { label: '已过期', variant: 'secondary' },
    cancelled: { label: '已取消', variant: 'destructive' },
    trial: { label: '试用', variant: 'info' },
  };

/** 订单支付状态 */
export const ORDER_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  paid: { label: '已支付', variant: 'success' },
  pending: { label: '待支付', variant: 'warning' },
  failed: { label: '支付失败', variant: 'destructive' },
  cancelled: { label: '已取消', variant: 'secondary' },
  expired: { label: '已过期', variant: 'secondary' },
};
