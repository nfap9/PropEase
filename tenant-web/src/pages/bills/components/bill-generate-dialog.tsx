import type { UseFormReturn } from 'react-hook-form';
import { Button, Input, DatePicker, Select, Modal } from 'antd';
import type { GenerateBillsFormData } from '@/schemas/bills';
import { tenantMessages } from '@/i18n';

interface BillGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<GenerateBillsFormData>;
  onSubmit: (data: GenerateBillsFormData) => void;
  isPending: boolean;
}

// ============== 月份选项 ==============
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} 月`,
}));

export function BillGenerateDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
}: BillGenerateDialogProps) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.generateTitle}
      footer={null}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {tenantMessages.bills.dialogs.generateDescription}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label={tenantMessages.bills.dialogs.billYear} error={form.formState.errors.bill_year}>
            <Input
              type="number"
              min={2020}
              max={2100}
              {...form.register('bill_year', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label={tenantMessages.bills.dialogs.billMonthLabel}>
            <Select
              value={String(form.watch('bill_month'))}
              onChange={(value) => form.setValue('bill_month', Number(value))}
              className="w-full"
              options={MONTH_OPTIONS}
            />
          </FormField>
        </div>

        <FormField label={tenantMessages.bills.dialogs.dueDateLabel} error={form.formState.errors.due_date}>
          <DatePicker
            className="w-full"
            onChange={(_, dateString) => form.setValue('due_date', dateString as string)}
          />
        </FormField>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onOpenChange(false)}>{tenantMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" loading={isPending}>
            {isPending ? tenantMessages.bills.dialogs.generating : tenantMessages.bills.dialogs.generate}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============== 表单字段组件 ==============
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: { message?: string };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}
