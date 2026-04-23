import { useEffect } from 'react';
import { Button, Input, Modal, Form } from 'antd';
import { TenantCreate, type TenantFormData } from '@apartment-ultra/api-contract';
import type { Tenant } from '@/types';

const TENANTS = {
  NAME_INPUT: 'tenants-name-input',
  PHONE_INPUT: 'tenants-phone-input',
  ID_CARD_INPUT: 'tenants-id-card-input',
  EMERGENCY_CONTACT_INPUT: 'tenants-emergency-contact-input',
  EMERGENCY_PHONE_INPUT: 'tenants-emergency-phone-input',
  NOTES_INPUT: 'tenants-notes-input',
  CANCEL_BUTTON: 'tenants-cancel-btn',
  CONFIRM_BUTTON: 'tenants-confirm-btn',
} as const;

interface TenantFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData?: Tenant | null;
  onSubmit: (data: TenantFormData) => void;
  isPending: boolean;
  testId?: string;
}

export function TenantFormModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSubmit,
  isPending,
  testId,
}: TenantFormModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initialData?.name ?? '',
        phone: initialData?.phone ?? '',
        id_card: initialData?.id_card ?? '',
        emergency_contact: initialData?.emergency_contact ?? '',
        emergency_phone: initialData?.emergency_phone ?? '',
        notes: initialData?.notes ?? '',
      });
    }
  }, [open, initialData, form]);

  const handleFinish = (values: TenantFormData) => {
    onSubmit(values);
  };

  const title = mode === 'create' ? '新增租客' : '编辑租客';
  const submitText = mode === 'create' ? (isPending ? '创建中...' : '创建') : (isPending ? '保存中...' : '保存');

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      data-testid={testId}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="姓名"
            required
            rules={[{ required: true, message: '请输入租客姓名' }]}
          >
            <Input placeholder="请输入租客姓名" data-testid={TENANTS.NAME_INPUT} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            required
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" data-testid={TENANTS.PHONE_INPUT} />
          </Form.Item>
        </div>
        <Form.Item
          name="id_card"
          label="身份证号"
        >
          <Input placeholder="请输入身份证号" data-testid={TENANTS.ID_CARD_INPUT} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="emergency_contact"
            label="紧急联系人"
          >
            <Input placeholder="请输入紧急联系人" data-testid={TENANTS.EMERGENCY_CONTACT_INPUT} />
          </Form.Item>
          <Form.Item
            name="emergency_phone"
            label="紧急联系电话"
          >
            <Input placeholder="请输入紧急联系电话" data-testid={TENANTS.EMERGENCY_PHONE_INPUT} />
          </Form.Item>
        </div>
        <Form.Item
          name="notes"
          label="备注"
        >
          <Input placeholder="请输入备注" data-testid={TENANTS.NOTES_INPUT} />
        </Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)} data-testid={TENANTS.CANCEL_BUTTON}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending} data-testid={TENANTS.CONFIRM_BUTTON}>
            {submitText}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export type { TenantFormData };
