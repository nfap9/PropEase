import type { UtilityReading } from '@/types';

export type UtilityBillStatus = 'pending_input' | 'input_overdue' | 'ready_to_bill' | 'billed';

export interface PendingUtilityBillRow {
  leaseId: string;
  apartmentId: string | null;
  apartmentName: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  periodLabel: string;
  waterPrevious: number | null;
  electricityPrevious: number | null;
  waterCurrent: number | null;
  electricityCurrent: number | null;
  waterUsage: number | null;
  electricityUsage: number | null;
  waterFee: number | null;
  electricityFee: number | null;
  totalUtilityFee: number | null;
  deadline: string;
  status: UtilityBillStatus;
  currentReading: UtilityReading | null;
}

export type { UtilityReading };
