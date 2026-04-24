import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, Button, Select, Form } from 'antd';
import { tenantsApi } from '@/api/tenants';
import type { Tenant } from '@/types';

interface UpdateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  onSubmit: (newTenantId: string) => void;
  isPending: boolean;
}

export function UpdateTenantDialog({
  open,
  onOpenChange,
  orgId,
  onSubmit,
  isPending,
}: UpdateTenantDialogProps) {
  const [form] = Form.useForm<{ newTenantId: string }>();

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(),
    enabled: open,
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.setFieldsValue({ newTenantId: '' });
    }
  }, [open, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values.newTenantId);
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
        <Button
          key="submit"
          type="primary"
          loading={isPending}
          onClick={handleSubmit}
        >
          {isPending ? '提交中...' : '确认更换'}
        </Button>,
      ]}
    >
      <p className="mb-4 text-sm text-gray-600">
        将租约的租客更换为其他已存在的租客
      </p>
      <Form form={form} layout="vertical" className="space-y-4">
        <Form.Item
          name="newTenantId"
          label="新租客"
          rules={[{ required: true, message: '请选择新租客' }]}
        >
          <Select placeholder="选择新租客" className="w-full">
            {tenants.map((tenant: Tenant) => (
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
