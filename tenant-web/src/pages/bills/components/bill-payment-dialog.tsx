import { useEffect, useMemo } from 'react';
import { Form, Input, DatePicker, Select, Button, Modal } from 'antd';
import dayjs from 'dayjs';
import type { Bill } from '@/types';
import { PAYMENT_METHOD_LABELS, BILLS, type PaymentFormData } from '@/schemas/bills';
import { getBillPaymentSummary } from '@/utils/bills';
import { tenantI18n, tenantMessages } from '@/i18n';

interface BillPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBill: Bill | null;
  onSubmit: (data: PaymentFormData) => void;
  isPending: boolean;
}

export function BillPaymentDialog({ open, onOpenChange, selectedBill, onSubmit, isPending }: BillPaymentDialogProps) {
  const [form] = Form.useForm<PaymentFormData>();

  // 根据 selectedBill 计算待付金额
  const pendingAmount = useMemo(
    () => (selectedBill ? selectedBill.total_amount - selectedBill.paid_amount : 0),
    [selectedBill]
  );

  // 当 selectedBill 变化时，重置表单
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        amount: pendingAmount,
        payment_date: undefined,
        payment_method: 'wechat',
        reference: '',
        notes: '',
      });
    }
  }, [open, pendingAmount, form]);

  const summary = getBillPaymentSummary(selectedBill);

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={tenantMessages.bills.dialogs.paymentTitle}
      footer={null}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {tenantI18n.t('bills.dialogs.paymentSummary', {
          total: summary.totalAmount.toLocaleString(),
          paid: summary.paidAmount.toLocaleString(),
          pending: summary.pendingAmount.toLocaleString(),
        })}
      </p>

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>
          onSubmit({
            ...values,
            payment_date: values.payment_date
              ? (values.payment_date as unknown as dayjs.Dayjs).format('YYYY-MM-DD')
              : '',
          })
        }
        requiredMark="optional"
      >
        <Form.Item
          name="amount"
          label={tenantMessages.bills.dialogs.amount}
          rules={[{ required: true, message: '请输入金额' }]}
        >
          <Input type="number" step="0.01" data-testid={BILLS.AMOUNT_INPUT} placeholder="请输入金额" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="payment_date"
            label={tenantMessages.bills.dialogs.paymentDate}
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker className="w-full" data-testid={BILLS.PAYMENT_DATE_INPUT} />
          </Form.Item>

          <Form.Item
            name="payment_method"
            label={tenantMessages.bills.dialogs.paymentMethod}
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select data-testid={BILLS.PAYMENT_METHOD_SELECT} options={PAYMENT_METHOD_OPTIONS} />
          </Form.Item>
        </div>

        <Form.Item name="reference" label={tenantMessages.bills.dialogs.reference}>
          <Input placeholder="请输入交易号或参考号" />
        </Form.Item>

        <Form.Item name="notes" label={tenantMessages.bills.dialogs.notesLabel}>
          <Input placeholder="请输入备注" />
        </Form.Item>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onOpenChange(false)}>{tenantMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" loading={isPending} data-testid={BILLS.CONFIRM_PAYMENT_BUTTON}>
            {isPending ? tenantMessages.bills.dialogs.processing : tenantMessages.bills.dialogs.confirmPayment}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => ({
  value: key,
  label,
}));
