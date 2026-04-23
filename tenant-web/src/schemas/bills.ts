import type { PaymentMethod } from '@/types';
import { tenantMessages } from '@/i18n';

export const BILLS = {
  HEADING: 'bills-heading',
  GENERATE_BUTTON: 'bills-generate-btn',
  STATUS_FILTER: 'bills-status-filter',
  EXPORT_BUTTON: 'bills-export-btn',
  DETAIL_DIALOG: 'bills-detail-dialog',
  PAYMENT_DIALOG: 'bills-payment-dialog',
  GENERATE_DIALOG: 'bills-generate-dialog',
  AMOUNT_INPUT: 'bills-amount-input',
  PAYMENT_DATE_INPUT: 'bills-payment-date-input',
  PAYMENT_METHOD_SELECT: 'bills-payment-method-select',
  CONFIRM_PAYMENT_BUTTON: 'bills-confirm-payment-btn',
  CANCEL_BUTTON: 'bills-cancel-btn',
  LIST: 'bills-list',
  PAY_BUTTON: 'bills-pay-btn',
  SHARE_BUTTON: 'bills-share-btn',
} as const;

export interface PaymentFormData {
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface GenerateBillsFormData {
  bill_year: number;
  bill_month: number;
  due_date: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: tenantMessages.bills.paymentMethods.cash,
  wechat: tenantMessages.bills.paymentMethods.wechat,
  alipay: tenantMessages.bills.paymentMethods.alipay,
  bank_transfer: tenantMessages.bills.paymentMethods.bankTransfer,
  other: tenantMessages.bills.paymentMethods.other,
};

export function getDefaultGenerateValues(): GenerateBillsFormData {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const dueDate = new Date(year, now.getMonth(), 15);

  return {
    bill_year: year,
    bill_month: month,
    due_date: dueDate.toISOString().split('T')[0],
  };
}

export function getDefaultPaymentValues(amount = 0): PaymentFormData {
  return {
    amount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'wechat',
    reference: '',
    notes: '',
  };
}
