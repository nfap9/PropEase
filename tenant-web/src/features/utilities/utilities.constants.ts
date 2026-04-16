export const UTILITIES = {
  HEADING: 'utilities-heading',
  ENTRY_BUTTON: 'utilities-entry-btn',
  LIST: 'utilities-list',
  EXPORT_TEMPLATE_BUTTON: 'utilities-export-template-button',
  IMPORT_BUTTON: 'utilities-import-button',
  OVERVIEW_CARD: 'utilities-overview-card',
  PENDING_BILLS_CARD: 'utilities-pending-bills-card',
  MISSING_INITIAL_CARD: 'utilities-missing-initial-card',
} as const;

export type UtilityBillStatus = 'pending_input' | 'input_overdue' | 'ready_to_bill' | 'billed';

export const UTILITY_BILL_STATUS_CONFIG: Record<
  UtilityBillStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'info' }
> = {
  pending_input: { label: '待录入', variant: 'warning' },
  input_overdue: { label: '录入逾期', variant: 'destructive' },
  ready_to_bill: { label: '待出账', variant: 'info' },
  billed: { label: '已出账', variant: 'success' },
};
