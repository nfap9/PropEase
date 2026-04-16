/**
 * Billing 模块类型定义
 */

import type { BillingOrder, BillingOrderStatus, BillingOrderType } from '@apartment-ultra/api-contract';

/** 订单状态选项 */
export const BILLING_ORDER_STATUS_OPTIONS: { value: BillingOrderStatus; label: string }[] = [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'cancelled', label: '已取消' },
  { value: 'expired', label: '已过期' },
];

/** 订单类型选项 */
export const BILLING_ORDER_TYPE_OPTIONS: { value: BillingOrderType; label: string }[] = [
  { value: 'subscription', label: '订阅订单' },
  { value: 'usage', label: '用量订单' },
];

/** 格式化订单金额 */
export function formatOrderAmount(order: BillingOrder): string {
  return `¥${order.amount.toFixed(2)}`;
}

/** 格式化订单状态 */
export function getOrderStatusLabel(status: BillingOrderStatus): string {
  return BILLING_ORDER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

/** 格式化订单类型 */
export function getOrderTypeLabel(type: BillingOrderType): string {
  return BILLING_ORDER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
