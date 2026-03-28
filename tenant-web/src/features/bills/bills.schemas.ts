import { z } from 'zod';
import type { PaymentMethod } from '@/types';

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

export const paymentSchema = z.object({
  amount: z.number().min(0.01, '金额必须大于0'),
  payment_date: z.string().min(1, '请选择付款日期'),
  payment_method: z.enum(['cash', 'wechat', 'alipay', 'bank_transfer', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export const generateBillsSchema = z.object({
  bill_year: z.number().min(2020, '年份无效').max(2100, '年份无效'),
  bill_month: z.number().min(1, '请选择月份').max(12, '请选择月份'),
  due_date: z.string().min(1, '请选择到期日'),
});

export type GenerateBillsFormData = z.infer<typeof generateBillsSchema>;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  bank_transfer: '银行转账',
  other: '其他',
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
