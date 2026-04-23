import type { Bill } from '@apartment-ultra/api-contract';
import type { BillFeeItem } from '@apartment-ultra/api-contract';

export interface BillShareData {
  organizationName: string;
  monthLabel: string;
  roomLabel: string;
  tenantName: string;
  statusLabel: string;
  dueDate: string;
  totalAmount: string;
  paidAmount: string;
  unpaidAmount: string;
  notes: string | null;
  breakdown: Array<{ label: string; value: string }>;
}
