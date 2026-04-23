import type { PaymentMethod } from '@/types';

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
