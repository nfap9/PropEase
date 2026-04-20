import type { UseFormReturn } from 'react-hook-form';
import { Button, Input, DatePicker, Select, Modal } from 'antd';
import type { Bill, PaymentMethod } from '@/types';
import { PAYMENT_METHOD_LABELS, BILLS, type PaymentFormData } from '@/schemas/bills';
import { getBillPaymentSummary } from '@/utils/bills';
import { tenantI18n, tenantMessages } from '@/i18n';

export function BillPaymentDialog({
  open,
  onOpenChange,
  selectedBill,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBill: Bill | null;
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  isPending: boolean;
}) {
  const paymentSummary = getBillPaymentSummary(selectedBill);

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.paymentTitle}
      footer={null}
    >
      <p className="text-sm text-muted-foreground mb-4">
        {tenantI18n.t('bills.dialogs.paymentSummary', {
          total: paymentSummary.totalAmount.toLocaleString(),
          paid: paymentSummary.paidAmount.toLocaleString(),
          pending: paymentSummary.pendingAmount.toLocaleString(),
        })}
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <span className="text-sm font-medium">
            {tenantMessages.bills.dialogs.amount} <span aria-hidden="true">*</span>
          </span>
          <Input
            aria-required
            type="number"
            step="0.01"
            {...form.register('amount', { valueAsNumber: true })}
            data-testid={BILLS.AMOUNT_INPUT}
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">
              {tenantMessages.bills.dialogs.paymentDate} <span aria-hidden="true">*</span>
            </span>
            <DatePicker
              className="w-full"
              onChange={(_, dateString) => form.setValue('payment_date', dateString as string)}
              data-testid={BILLS.PAYMENT_DATE_INPUT}
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">
              {tenantMessages.bills.dialogs.paymentMethod} <span aria-hidden="true">*</span>
            </span>
            <Select
              value={form.watch('payment_method')}
              onChange={(value: PaymentMethod) => form.setValue('payment_method', value)}
              className="w-full"
              data-testid={BILLS.PAYMENT_METHOD_SELECT}
              options={Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => ({ value: key, label }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium">{tenantMessages.bills.dialogs.reference}</span>
          <Input placeholder="请输入交易号或参考号" {...form.register('reference')} />
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium">{tenantMessages.bills.dialogs.notesLabel}</span>
          <Input placeholder="请输入备注" {...form.register('notes')} />
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="default" onClick={() => onOpenChange(false)}>
            {tenantMessages.common.cancel}
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending} data-testid={BILLS.CONFIRM_PAYMENT_BUTTON}>
            {isPending ? tenantMessages.bills.dialogs.processing : tenantMessages.bills.dialogs.confirmPayment}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
