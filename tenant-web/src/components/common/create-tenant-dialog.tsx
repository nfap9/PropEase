import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Modal, Button, Input, Form } from 'antd';
import { tenantsApi } from '@/api/tenants';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { TenantCreateSchema, type TenantFormData } from '@apartment-ultra/api-contract';
import type { Tenant } from '@/types';

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
      <Form
        layout="vertical"
        onFinish={form.handleSubmit(handleSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="姓名"
            required
            validateStatus={form.formState.errors.name ? 'error' : ''}
            help={form.formState.errors.name?.message}
          >
            <Input placeholder="请输入租客姓名" {...form.register('name')} />
          </Form.Item>
          <Form.Item
            label="联系电话"
            required
            validateStatus={form.formState.errors.phone ? 'error' : ''}
            help={form.formState.errors.phone?.message}
          >
            <Input placeholder="请输入联系电话" {...form.register('phone')} />
          </Form.Item>
        </div>
        <Form.Item
          label="身份证号"
          validateStatus={form.formState.errors.id_card ? 'error' : ''}
          help={form.formState.errors.id_card?.message}
        >
          <Input placeholder="请输入身份证号" {...form.register('id_card')} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="紧急联系人"
            validateStatus={form.formState.errors.emergency_contact ? 'error' : ''}
            help={form.formState.errors.emergency_contact?.message}
          >
            <Input placeholder="请输入紧急联系人" {...form.register('emergency_contact')} />
          </Form.Item>
          <Form.Item
            label="紧急联系电话"
            validateStatus={form.formState.errors.emergency_phone ? 'error' : ''}
            help={form.formState.errors.emergency_phone?.message}
          >
            <Input placeholder="请输入紧急联系电话" {...form.register('emergency_phone')} />
          </Form.Item>
        </div>
        <Form.Item
          label="备注"
          validateStatus={form.formState.errors.notes ? 'error' : ''}
          help={form.formState.errors.notes?.message}
        >
          <Input placeholder="请输入备注" {...form.register('notes')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
