import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal, Button, Input, Form } from 'antd';
import { tenantsApi } from '@/api/tenants';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import type { Tenant } from '@/types';

export interface CreateTenantDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (tenant: Tenant) => void;
}

export function CreateTenantDialog({ orgId, open, onOpenChange, onSuccess }: CreateTenantDialogProps) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => tenantsApi.create(filterEmptyStrings(data)),
    onSuccess: (newTenant: Tenant) => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      onOpenChange(false);
      form.resetFields();
      toast.success('租客创建成功');
      onSuccess?.(newTenant);
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      createMutation.mutate(values);
    });
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title="新增租客"
      footer={[
        <Button key="cancel" onClick={() => onOpenChange(false)}>取消</Button>,
        <Button key="submit" type="primary" loading={createMutation.isPending} onClick={handleSubmit}>
          {createMutation.isPending ? '创建中...' : '创建'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{
          name: '',
          phone: '',
          id_card: '',
          emergency_contact: '',
          emergency_phone: '',
          notes: '',
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入租客姓名' }]}
          >
            <Input placeholder="请输入租客姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </div>
        <Form.Item
          name="id_card"
          label="身份证号"
        >
          <Input placeholder="请输入身份证号" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="emergency_contact" label="紧急联系人">
            <Input placeholder="请输入紧急联系人" />
          </Form.Item>
          <Form.Item name="emergency_phone" label="紧急联系电话">
            <Input placeholder="请输入紧急联系电话" />
          </Form.Item>
        </div>
        <Form.Item name="notes" label="备注">
          <Input placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
