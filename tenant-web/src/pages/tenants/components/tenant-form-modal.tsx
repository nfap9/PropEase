import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal } from 'antd';
import { Label } from '@/components/common/label';
import type { Tenant } from '@/types';

const tenantSchema = z.object({
  name: z.string().min(1, '请输入租客姓名'),
  phone: z.string().min(1, '请输入联系电话'),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

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
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      phone: initialData?.phone ?? '',
      id_card: initialData?.id_card ?? '',
      emergency_contact: initialData?.emergency_contact ?? '',
      emergency_phone: initialData?.emergency_phone ?? '',
      notes: initialData?.notes ?? '',
    },
  });

  // Reset form when modal opens with new data
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" required>
              姓名
            </Label>
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <Input id="name" placeholder="请输入租客姓名" {...field} data-testid={TENANTS.NAME_INPUT} />
              )}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" required>
              联系电话
            </Label>
            <Controller
              name="phone"
              control={form.control}
              render={({ field }) => (
                <Input id="phone" placeholder="请输入联系电话" {...field} data-testid={TENANTS.PHONE_INPUT} />
              )}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id_card">身份证号</Label>
            <Input id="id_card" placeholder="请输入身份证号" {...form.register('id_card')} data-testid={TENANTS.ID_CARD_INPUT} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact">紧急联系人</Label>
            <Input
              id="emergency_contact"
              placeholder="请输入紧急联系人"
              {...form.register('emergency_contact')}
              data-testid={TENANTS.EMERGENCY_CONTACT_INPUT}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_phone">紧急联系电话</Label>
            <Input
              id="emergency_phone"
              placeholder="请输入紧急联系电话"
              {...form.register('emergency_phone')}
              data-testid={TENANTS.EMERGENCY_PHONE_INPUT}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">备注</Label>
          <Input id="notes" placeholder="请输入备注" {...form.register('notes')} data-testid={TENANTS.NOTES_INPUT} />
        </div>
        <div className="flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)} data-testid={TENANTS.CANCEL_BUTTON}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending} data-testid={TENANTS.CONFIRM_BUTTON}>
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export type { TenantFormData };
