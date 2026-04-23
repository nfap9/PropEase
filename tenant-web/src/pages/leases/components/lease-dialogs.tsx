import { Info } from 'lucide-react';
import { Alert, Button, Input, DatePicker, Modal, Form, InputNumber, Space } from 'antd';
import type { Lease } from '@/types';
import { LEASES } from '@/constants/leases';
import type { LeaseEditFormData } from '@/schemas/leases';

export function LeaseEditDialog({
  open,
  onOpenChange,
  selectedLease,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLease: Lease | null;
  onSubmit: (data: LeaseEditFormData) => void;
  isPending: boolean;
}) {
  const [form] = Form.useForm<LeaseEditFormData>();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="编辑租约"
      footer={
        <Space>
          <Button onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="primary" loading={isPending} onClick={handleSubmit}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </Space>
      }
    >
      <Alert
        className="mb-4 border-blue-200 bg-blue-50 text-blue-800"
        icon={<Info className="h-4 w-4" />}
        message="提示"
        description="已出账单不受影响；后续生成的账单将按新的租约信息计算。"
        type="info"
        showIcon
      />
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{
          room_id: selectedLease?.room_id ?? '',
          tenant_id: selectedLease?.tenant_id ?? '',
          start_date: selectedLease?.start_date ?? '',
          end_date: selectedLease?.end_date ?? '',
          monthly_rent: selectedLease?.monthly_rent ?? 0,
          deposit: selectedLease?.deposit ?? 0,
          water_rate: selectedLease?.water_rate ?? 0,
          electricity_rate: selectedLease?.electricity_rate ?? 0,
          notes: selectedLease?.notes ?? '',
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="房间">
            <Input
              value={
                selectedLease?.room
                  ? `${selectedLease.room.apartment?.name || ''} - ${selectedLease.room.room_number}`
                  : ''
              }
              disabled
            />
          </Form.Item>
          <Form.Item label="租客">
            <Input value={selectedLease?.tenant?.name || ''} disabled />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="start_date"
            label="开始日期"
            required
            rules={[{ required: true, message: '请选择开始日期' }]}
          >
            <DatePicker className="w-full" data-testid={LEASES.START_DATE_INPUT} />
          </Form.Item>
          <Form.Item name="end_date" label="结束日期">
            <DatePicker className="w-full" data-testid={LEASES.END_DATE_INPUT} />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="monthly_rent"
            label="月租 (元)"
            required
            rules={[{ required: true, message: '请输入月租' }]}
          >
            <InputNumber min={0} step={0.01} data-testid={LEASES.MONTHLY_RENT_INPUT} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deposit" label="押金 (元)">
            <InputNumber min={0} step={0.01} data-testid={LEASES.DEPOSIT_INPUT} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="备注">
          <Input.TextArea data-testid={LEASES.NOTES_INPUT} rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function LeaseTerminateDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  lease,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  lease?: Lease | null;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="确认终止租约"
      onOk={onConfirm}
      okText={isPending ? '处理中...' : '确认终止'}
      okButtonProps={{ loading: isPending }}
    >
      <p>确定要终止此租约吗？终止后房间将变为空置状态。</p>
    </Modal>
  );
}

export function LeaseDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="确认删除"
      onOk={onConfirm}
      okText={isPending ? '删除中...' : '删除'}
      okButtonProps={{ danger: true, loading: isPending }}
    >
      <p>确定要删除此租约吗？此操作不可撤销。</p>
    </Modal>
  );
}
