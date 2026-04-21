import type { UseFormReturn } from 'react-hook-form';
import { Button, Input, DatePicker, Select, Modal, Form } from 'antd';
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

      <Form
        layout="vertical"
        onFinish={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label={tenantMessages.bills.dialogs.billYear}
            validateStatus={form.formState.errors.bill_year ? 'error' : ''}
            help={form.formState.errors.bill_year?.message}
          >
            <Input
              type="number"
              min={2020}
              max={2100}
              {...form.register('bill_year', { valueAsNumber: true })}
            />
          </Form.Item>

          <Form.Item label={tenantMessages.bills.dialogs.billMonthLabel}>
            <Select
              value={String(form.watch('bill_month'))}
              onChange={(value) => form.setValue('bill_month', Number(value))}
              className="w-full"
              options={MONTH_OPTIONS}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={tenantMessages.bills.dialogs.dueDateLabel}
          validateStatus={form.formState.errors.due_date ? 'error' : ''}
          help={form.formState.errors.due_date?.message}
        >
          <DatePicker
            className="w-full"
            onChange={(_, dateString) => form.setValue('due_date', dateString as string)}
          />
        </Form.Item>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onOpenChange(false)}>{tenantMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" loading={isPending}>
            {isPending ? tenantMessages.bills.dialogs.generating : tenantMessages.bills.dialogs.generate}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
