import { Button, DatePicker, Form, InputNumber, Modal, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { tenantMessages } from '@/i18n';
import type { GenerateBillsFormData } from '@/types';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} 月`,
}));

interface BillGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GenerateBillsFormData) => void;
  isPending: boolean;
}

export function BillGenerateDialog({ open, onOpenChange, onSubmit, isPending }: BillGenerateDialogProps) {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.generateTitle}
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>{tenantMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" loading={isPending} onClick={handleSubmit}>
            {isPending ? tenantMessages.bills.dialogs.generating : tenantMessages.bills.dialogs.generate}
          </Button>
        </Space>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {tenantMessages.bills.dialogs.generateDescription}
      </p>

      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={getDefaultGenerateValues()}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="bill_year"
            label={tenantMessages.bills.dialogs.billYear}
            rules={[{ required: true, message: '请输入年份' }]}
          >
            <InputNumber min={2020} max={2100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="bill_month"
            label={tenantMessages.bills.dialogs.billMonthLabel}
            rules={[{ required: true, message: '请选择月份' }]}
          >
            <Select options={MONTH_OPTIONS} className="w-full" />
          </Form.Item>
        </div>
        <Form.Item
          name="due_date"
          label={tenantMessages.bills.dialogs.dueDateLabel}
          rules={[{ required: true, message: '请选择截止日期' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function getDefaultGenerateValues() {
  const now = new Date();
  return {
    bill_year: now.getFullYear(),
    bill_month: now.getMonth() + 1,
    due_date: null as dayjs.Dayjs | null,
  };
}
