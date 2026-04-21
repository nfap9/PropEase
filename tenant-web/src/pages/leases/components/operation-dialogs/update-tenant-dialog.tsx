import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { updateTenantSchema, type UpdateTenantFormData } from '@/schemas/lease-operations';
import { useUpdateTenant } from '@/hooks/use-lease-operations';
import { tenantsApi } from '@/api/tenants';
import { Modal, Button, Select, Form } from 'antd';

interface UpdateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function UpdateTenantDialog({ open, onOpenChange, orgId, leaseId }: UpdateTenantDialogProps) {
  const form = useForm<UpdateTenantFormData>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: { newTenantId: '' },
  });

  const updateTenant = useUpdateTenant(leaseId);

  const { data: tenants } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(),
    enabled: open,
  });

  const onSubmit = (data: UpdateTenantFormData) => {
    updateTenant.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="编辑租客"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={updateTenant.isPending} onClick={form.handleSubmit(onSubmit)}>
          {updateTenant.isPending ? '提交中...' : '确认更换'}
        </Button>,
      ]}
    >
      <p className="mb-4 text-sm text-gray-600">将租约的租客更换为其他已存在的租客</p>
      <Form
        layout="vertical"
        onFinish={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <Form.Item
          label="新租客"
          name="newTenantId"
          required
          validateStatus={form.formState.errors.newTenantId ? 'error' : ''}
          help={form.formState.errors.newTenantId?.message}
        >
          <Controller
            name="newTenantId"
            control={form.control}
            render={({ field }) => (
              <Select
                onChange={field.onChange}
                value={field.value}
                placeholder="选择新租客"
                className="w-full"
              >
                {tenants?.map((tenant) => (
                  <Select.Option key={tenant.id} value={tenant.id}>
                    {tenant.name} {tenant.phone && `(${tenant.phone})`}
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
