import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Modal, Form } from 'antd';
import { TenantCreateSchema, type TenantFormData } from '@apartment-ultra/api-contract';
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
  const form = useForm<TenantFormData>({
    resolver: zodResolver(TenantCreateSchema),
    defaultValues: {
      name: '',
      phone: '',
      id_card: '',
      emergency_contact: '',
      emergency_phone: '',
      notes: '',
    },
  });

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name ?? '',
        phone: initialData?.phone ?? '',
        id_card: initialData?.id_card ?? '',
        emergency_contact: initialData?.emergency_contact ?? '',
        emergency_phone: initialData?.emergency_phone ?? '',
        notes: initialData?.notes ?? '',
      });
    }
  }, [open, initialData, form]);

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
        layout="vertical"
        onFinish={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="姓名"
            required
            validateStatus={form.formState.errors.name ? 'error' : ''}
            help={form.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <Input placeholder="请输入租客姓名" {...field} data-testid={TENANTS.NAME_INPUT} />
              )}
            />
          </Form.Item>
          <Form.Item
            label="联系电话"
            required
            validateStatus={form.formState.errors.phone ? 'error' : ''}
            help={form.formState.errors.phone?.message}
          >
            <Controller
              name="phone"
              control={form.control}
              render={({ field }) => (
                <Input placeholder="请输入联系电话" {...field} data-testid={TENANTS.PHONE_INPUT} />
              )}
            />
          </Form.Item>
        </div>
        <Form.Item
          label="身份证号"
          validateStatus={form.formState.errors.id_card ? 'error' : ''}
          help={form.formState.errors.id_card?.message}
        >
          <Input
            placeholder="请输入身份证号"
            {...form.register('id_card')}
            data-testid={TENANTS.ID_CARD_INPUT}
          />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="紧急联系人"
            validateStatus={form.formState.errors.emergency_contact ? 'error' : ''}
            help={form.formState.errors.emergency_contact?.message}
          >
            <Input
              placeholder="请输入紧急联系人"
              {...form.register('emergency_contact')}
              data-testid={TENANTS.EMERGENCY_CONTACT_INPUT}
            />
          </Form.Item>
          <Form.Item
            label="紧急联系电话"
            validateStatus={form.formState.errors.emergency_phone ? 'error' : ''}
            help={form.formState.errors.emergency_phone?.message}
          >
            <Input
              placeholder="请输入紧急联系电话"
              {...form.register('emergency_phone')}
              data-testid={TENANTS.EMERGENCY_PHONE_INPUT}
            />
          </Form.Item>
        </div>
        <Form.Item
          label="备注"
          validateStatus={form.formState.errors.notes ? 'error' : ''}
          help={form.formState.errors.notes?.message}
        >
          <Input placeholder="请输入备注" {...form.register('notes')} data-testid={TENANTS.NOTES_INPUT} />
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
