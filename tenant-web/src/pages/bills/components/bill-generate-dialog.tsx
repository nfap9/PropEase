import type { UseFormReturn } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Button, Input, DatePicker, Select, Modal, Form, InputNumber, Space } from 'antd';
import type { GenerateBillsFormData } from '@/schemas/bills';
import { tenantMessages } from '@/i18n';
import dayjs from 'dayjs';

interface BillGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<GenerateBillsFormData>;
  onSubmit: (data: GenerateBillsFormData) => void;
  isPending: boolean;
}

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
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>{tenantMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" loading={isPending}>
            {isPending ? tenantMessages.bills.dialogs.generating : tenantMessages.bills.dialogs.generate}
          </Button>
        </Space>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {tenantMessages.bills.dialogs.generateDescription}
      </p>

      <Form layout="vertical" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="bill_year"
            control={form.control}
            render={({ field, fieldState }) => (
              <Form.Item
                label={tenantMessages.bills.dialogs.billYear}
                validateStatus={fieldState.error ? 'error' : ''}
                help={fieldState.error?.message}
              >
                <InputNumber
                  {...field}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val ?? '')}
                  min={2020}
                  max={2100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}
          />

          <Controller
            name="bill_month"
            control={form.control}
            render={({ field }) => (
              <Form.Item label={tenantMessages.bills.dialogs.billMonthLabel}>
                <Select
                  {...field}
                  value={String(field.value)}
                  onChange={(val) => field.onChange(Number(val))}
                  className="w-full"
                  options={MONTH_OPTIONS}
                />
              </Form.Item>
            )}
          />
        </div>

        <Controller
          name="due_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label={tenantMessages.bills.dialogs.dueDateLabel}
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
              />
            </Form.Item>
          )}
        />
      </Form>
    </Modal>
  );
}
