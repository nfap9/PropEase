import type { UtilityBillStatus } from './utilities.types';

export function getBillingDay(dateStr: string): number {
  return new Date(dateStr).getDate();
}

export function getBillingDeadline(startDate: string, year: number, month: number): Date {
  const billingDay = getBillingDay(startDate);
  const daysInMonth = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(billingDay, daysInMonth));
}

export function getUsage(
  current: number | null | undefined,
  previous: number | null | undefined
): number | null {
  if (current == null || previous == null) return null;
  return current - previous;
}

export function formatMeterValue(value: number | null | undefined): string {
  return value == null ? '—' : Number(value).toFixed(2);
}

export function formatCurrencyValue(value: number | null | undefined): string {
  return value == null ? '—' : `¥${value.toFixed(2)}`;
}

export type { UtilityBillStatus };
