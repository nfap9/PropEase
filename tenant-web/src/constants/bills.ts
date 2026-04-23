import type { PaymentMethod } from '@/types';
import { tenantMessages } from '@/constants/messages';

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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: tenantMessages.bills.paymentMethods.cash,
  wechat: tenantMessages.bills.paymentMethods.wechat,
  alipay: tenantMessages.bills.paymentMethods.alipay,
  bank_transfer: tenantMessages.bills.paymentMethods.bankTransfer,
  other: tenantMessages.bills.paymentMethods.other,
};
