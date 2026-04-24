import type { PendingUtilityBillRow } from '@/types/utilities';

export function useMonthStats(bills: PendingUtilityBillRow[]) {
  return {
    readyToBillCount: bills.filter((b) => b.status === 'ready_to_bill').length,
    overdueCount: bills.filter((b) => b.status === 'input_overdue').length,
  };
}
