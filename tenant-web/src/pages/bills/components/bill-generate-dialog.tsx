import type { UseFormReturn } from 'react-hook-form';
import { Button, Input, DatePicker, Select, Modal } from 'antd';
import type { GenerateBillsFormData } from '@/schemas/bills';
import { tenantMessages } from '@/i18n';

export function BillGenerateDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<GenerateBillsFormData>;
  onSubmit: (data: GenerateBillsFormData) => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.generateTitle}
      footer={null}
    >
      <p className="text-sm text-muted-foreground mb-4">{tenantMessages.bills.dialogs.generateDescription}</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">{tenantMessages.bills.dialogs.billYear}</span>
            <Input
              type="number"
              min={2020}
              max={2100}
              {...form.register('bill_year', { valueAsNumber: true })}
            />
            {form.formState.errors.bill_year && (
              <p className="text-sm text-destructive">{form.formState.errors.bill_year.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">{tenantMessages.bills.dialogs.billMonthLabel}</span>
            <Select
              value={String(form.watch('bill_month'))}
              onChange={(value) => form.setValue('bill_month', Number(value))}
              className="w-full"
              options={Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} 月` }))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium">{tenantMessages.bills.dialogs.dueDateLabel}</span>
          <DatePicker
            className="w-full"
            onChange={(_, dateString) => form.setValue('due_date', dateString as string)}
          />
          {form.formState.errors.due_date && (
            <p className="text-sm text-destructive">{form.formState.errors.due_date.message}</p>
          )}
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="default" onClick={() => onOpenChange(false)}>
            {tenantMessages.common.cancel}
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending}>
            {isPending ? tenantMessages.bills.dialogs.generating : tenantMessages.bills.dialogs.generate}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
