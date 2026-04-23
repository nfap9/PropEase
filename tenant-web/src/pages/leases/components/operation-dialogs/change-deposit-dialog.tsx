import { useChangeDeposit } from '@/hooks/use-lease-operations';
import { Modal, Button, Input, Form, InputNumber } from 'antd';
import type { ChangeDepositFormData } from '@/schemas/lease-operations';

interface ChangeDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentDeposit: number;
}

export function ChangeDepositDialog({ open, onOpenChange, orgId, leaseId, currentDeposit }: ChangeDepositDialogProps) {
  const [form] = Form.useForm();
  const changeDeposit = useChangeDeposit(leaseId);

  const onSubmit = (values: Record<string, unknown>) => {
    changeDeposit.mutate(values as unknown as ChangeDepositFormData, {
      onSuccess: () => {
        onOpenChange(false);
        form.resetFields();
      },
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="押金变更"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>取消</Button>,
        <Button key="submit" type="primary" loading={changeDeposit.isPending} onClick={() => form.submit()}>
          {changeDeposit.isPending ? '提交中...' : '确认变更'}
        </Button>,
      ]}
    >
      <p className="mb-4 text-sm text-gray-600">当前押金：¥{currentDeposit.toLocaleString()}</p>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{ newDeposit: currentDeposit, reason: '' }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="newDeposit"
          label="新押金 (元)"
          rules={[{ required: true, message: '请输入新押金' }, { type: 'number', min: 0, message: '押金不能为负' }]}
        >
          <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="reason" label="原因备注">
          <Input placeholder="可选" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
