import { useEffect } from 'react';
import { Info } from 'lucide-react';
import { Alert, Button, Input, DatePicker, Modal, Form, InputNumber, Space } from 'antd';
import { LEASES } from '@/constants/leases';
import type { LeaseEditFormData } from '@/types';

interface LeaseEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 表单初始值，由调用方从 selectedLease 计算后传入 */
  initialValues: Partial<LeaseEditFormData>;
  /** 房间展示文本（用于只读显示） */
  roomDisplay: string;
  /** 租客展示文本（用于只读显示） */
  tenantDisplay: string;
  onSubmit: (data: LeaseEditFormData) => void;
  isPending: boolean;
}

export function LeaseEditDialog({
  open,
  onOpenChange,
  initialValues,
  roomDisplay,
  tenantDisplay,
  onSubmit,
  isPending,
}: LeaseEditDialogProps) {
  const [form] = Form.useForm<LeaseEditFormData>();

  // open 变化时同步表单值，避免 initialValue 只在初始化生效的问题
  useEffect(() => {
    if (open) {
      form.setFieldsValue(initialValues);
    }
  }, [open, initialValues, form]);

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
      <Form form={form} layout="vertical" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="房间">
            <Input value={roomDisplay} disabled />
          </Form.Item>
          <Form.Item label="租客">
            <Input value={tenantDisplay} disabled />
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
            <InputNumber
              min={0}
              step={0.01}
              data-testid={LEASES.MONTHLY_RENT_INPUT}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="deposit" label="押金 (元)">
            <InputNumber
              min={0}
              step={0.01}
              data-testid={LEASES.DEPOSIT_INPUT}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="water_rate" label="水费单价 (元/吨)">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="electricity_rate" label="电费单价 (元/度)">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="备注">
          <Input.TextArea data-testid={LEASES.NOTES_INPUT} rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ============== Terminate & Delete Dialog（已是纯 UI，无需改动） ==============

interface LeaseTerminateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function LeaseTerminateDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: LeaseTerminateDialogProps) {
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

interface LeaseDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function LeaseDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: LeaseDeleteDialogProps) {
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
