
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal, Button, Input, message } from 'antd';
import { Label } from '@/components/common/label';
import { tenantsApi } from '@/api';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { Tenant } from '@/types';

const tenantSchema = z.object({
  name: z.string().min(1, '请输入租客姓名'),
  phone: z.string().min(1, '请输入联系电话'),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;

export interface CreateTenantDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (tenant: Tenant) => void;
}

/**
 * 创建租客对话框组件
 *
 * 独立的租客创建功能，可与其他组件组合使用
 */
export function CreateTenantDialog({ orgId, open, onOpenChange, onSuccess }: CreateTenantDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      phone: '',
      id_card: '',
      emergency_contact: '',
      emergency_phone: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: (data: TenantFormData) => tenantsApi.create(filterEmptyStrings(data)),
    onSuccess: (newTenant: Tenant) => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      onOpenChange(false);
      form.reset();
      toast.success('租客创建成功');
      onSuccess?.(newTenant);
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const handleSubmit = (data: TenantFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="新增租客"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={createMutation.isPending} onClick={form.handleSubmit(handleSubmit)}>
          {createMutation.isPending ? '创建中...' : '创建'}
        </Button>,
      ]}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name" required>
              姓名
            </Label>
            <Input id="tenant-name" placeholder="请输入租客姓名" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-phone" required>
              联系电话
            </Label>
            <Input id="tenant-phone" placeholder="请输入联系电话" {...form.register('phone')} />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant-id_card">身份证号</Label>
          <Input id="tenant-id_card" placeholder="请输入身份证号" {...form.register('id_card')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-emergency_contact">紧急联系人</Label>
            <Input id="tenant-emergency_contact" placeholder="请输入紧急联系人" {...form.register('emergency_contact')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-emergency_phone">紧急联系电话</Label>
            <Input id="tenant-emergency_phone" placeholder="请输入紧急联系电话" {...form.register('emergency_phone')} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant-notes">备注</Label>
          <Input id="tenant-notes" placeholder="请输入备注" {...form.register('notes')} />
        </div>
      </form>
    </Modal>
  );
}
