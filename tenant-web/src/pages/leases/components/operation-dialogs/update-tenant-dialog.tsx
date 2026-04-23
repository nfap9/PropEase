import { useQuery } from '@tanstack/react-query';
import { useUpdateTenant } from '@/hooks/use-lease-operations';
import { tenantsApi } from '@/api/tenants';
import { Modal, Button, Select, Form } from 'antd';
import type { UpdateTenantFormData } from '@/schemas/lease-operations';

interface UpdateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function UpdateTenantDialog({ open, onOpenChange, orgId, leaseId }: UpdateTenantDialogProps) {
  const [form] = Form.useForm();
  const updateTenant = useUpdateTenant(leaseId);

  const { data: tenants } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(),
    enabled: open,
  });

  const onSubmit = (values: Record<string, unknown>) => {
    updateTenant.mutate(values as unknown as UpdateTenantFormData, {
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
      title="编辑租客"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>取消</Button>,
        <Button key="submit" type="primary" loading={updateTenant.isPending} onClick={() => form.submit()}>
          {updateTenant.isPending ? '提交中...' : '确认更换'}
        </Button>,
      ]}
    >
      <p className="mb-4 text-sm text-gray-600">将租约的租客更换为其他已存在的租客</p>
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{ newTenantId: '' }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="newTenantId"
          label="新租客"
          rules={[{ required: true, message: '请选择新租客' }]}
        >
          <Select placeholder="选择新租客" className="w-full">
            {tenants?.map((tenant) => (
              <Select.Option key={tenant.id} value={tenant.id}>
                {tenant.name} {tenant.phone && `(${tenant.phone})`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
