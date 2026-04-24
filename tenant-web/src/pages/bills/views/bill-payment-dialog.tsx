/**
 * BillPaymentDialog - 收款弹窗
 *
 * selectedBill 和 onClose 由父组件（index.tsx）通过 useBillPaymentDialog 管理，
 * 因为需要从列表行和详情弹窗两处触发打开。
 *
 * 每次弹窗打开时，根据 selectedBill 重置表单默认值（待收金额）。
 */
import { useEffect, useMemo, useCallback } from 'react';
import { Form, Input, DatePicker, Select, Button, Modal, InputNumber } from 'antd';
import dayjs from 'dayjs';
import type { Bill, PaymentFormData } from '@/types';
import { PAYMENT_METHOD_LABELS, BILLS } from '@/constants/bills';
import { getBillPaymentSummary } from '@/utils/bills';
import { tenantI18n, tenantMessages } from '@/i18n';
import { usePaymentMutation } from '../hooks/use-payment-mutation';

interface BillPaymentDialogProps {
  selectedBill: Bill | null;
  onClose: () => void;
}

export function BillPaymentDialog({ selectedBill, onClose }: BillPaymentDialogProps) {
  const [form] = Form.useForm<PaymentFormData>();
  const { recordPayment, isRecordingPayment } = usePaymentMutation();

  // selectedBill !== null 表示弹窗打开
  const open = selectedBill !== null;

  // 待收金额 = 总金额 - 已收金额
  const pendingAmount = useMemo(
    () => (selectedBill ? selectedBill.total_amount - selectedBill.paid_amount : 0),
    [selectedBill]
  );

  // 每次弹窗打开时，重置表单为默认值
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

  const handleSubmit = useCallback(
    (values: PaymentFormData) => {
      if (!selectedBill) return;
      recordPayment(selectedBill.id, {
        ...values,
        payment_date: values.payment_date
          ? (values.payment_date as unknown as dayjs.Dayjs).format('YYYY-MM-DD')
          : '',
      });
    },
    [selectedBill, recordPayment],
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
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
        onFinish={handleSubmit}
        requiredMark="optional"
      >
        <Form.Item
          name="amount"
          label={tenantMessages.bills.dialogs.amount}
          rules={[{ required: true, message: '请输入金额' }]}
        >
          <InputNumber step={0.01} data-testid={BILLS.AMOUNT_INPUT} placeholder="请输入金额" style={{ width: '100%' }} />
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
          <Button onClick={onClose}>{tenantMessages.common.cancel}</Button>
          <Button type="primary" htmlType="submit" loading={isRecordingPayment} data-testid={BILLS.CONFIRM_PAYMENT_BUTTON}>
            {isRecordingPayment ? tenantMessages.bills.dialogs.processing : tenantMessages.bills.dialogs.confirmPayment}
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
