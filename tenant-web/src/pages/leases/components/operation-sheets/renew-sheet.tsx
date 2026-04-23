import { useRenew } from '@/hooks/use-lease-operations';
import { Button, Drawer, Input, DatePicker, Form } from 'antd';
import type { RenewFormData } from '@/types';

interface RenewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentEndDate?: string | null;
}

export function RenewSheet({ open, onOpenChange, orgId, leaseId, currentEndDate }: RenewSheetProps) {
  const [form] = Form.useForm();
  const renew = useRenew(leaseId);

  const onSubmit = (values: Record<string, unknown>) => {
    renew.mutate(values as unknown as RenewFormData, {
      onSuccess: () => {
        onOpenChange(false);
        form.resetFields();
      },
    });
  };

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="续约"
      width={400}
      footer={
        <div className="flex gap-3">
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={renew.isPending} onClick={() => form.submit()}>
            {renew.isPending ? '提交中...' : '确认续约'}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-gray-600">当前结束日期：{currentEndDate ? new Date(currentEndDate).toLocaleDateString() : '长期'}</p>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{ newEndDate: null, reason: '' }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="newEndDate"
          label="新结束日期"
          rules={[{ required: true, message: '请选择新结束日期' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>
        <Form.Item name="reason" label="原因备注">
          <Input placeholder="可选" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
