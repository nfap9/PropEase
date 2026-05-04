/**
 * BillGenerateDialog - 生成账单弹窗
 *
 * 复合组件（Compound Component）：同时包含触发按钮和弹窗。
 * 内部管理自己的 open/close 状态和表单提交逻辑。
 *
 * - useBillMutations.generateBills：提交生成请求
 * - 弹窗关闭时自动重置表单
 */
import { Button, DatePicker, Form, InputNumber, Modal, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { tenantMessages } from '@/i18n';
import type { GenerateBillsFormData } from '@/types';
import { useGenerateMutation } from '../hooks/use-generate-mutation';

interface BillGenerateDialogProps {
  onSuccess?: () => void;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} 月`,
}));

export function BillGenerateDialog({ onSuccess }: BillGenerateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm();
  const { generateBills, isGenerating } = useGenerateMutation();

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  // 关闭时重置表单，避免下次打开展现旧数据
  const handleClose = useCallback(() => {
    setIsOpen(false);
    form.resetFields();
  }, [form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      generateBills(values, () => {
        handleClose();
        onSuccess?.();
      });
    });
  };

  return (
    <>
      <Button type="primary" onClick={handleOpen} data-testid="bills-generate-button">
        {tenantMessages.bills.list.generate}
      </Button>
      <Modal
        open={isOpen}
        onCancel={handleClose}
        title={tenantMessages.bills.dialogs.generateTitle}
        footer={
          <Space>
            <Button onClick={handleClose}>{tenantMessages.common.cancel}</Button>
            <Button type="primary" htmlType="submit" loading={isGenerating} onClick={handleSubmit}>
              {isGenerating ? tenantMessages.bills.dialogs.generating : tenantMessages.bills.dialogs.generate}
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
    </>
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
