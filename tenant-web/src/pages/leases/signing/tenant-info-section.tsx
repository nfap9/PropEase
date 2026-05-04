import { forwardRef, useImperativeHandle } from 'react';
import { Form, Input, Button } from 'antd';
import { Search } from 'lucide-react';

export interface TenantInfoSectionRef {
  validate: () => Promise<void>;
  getValues: () => {
    tenant_name: string;
    tenant_phone: string;
    tenant_id_card?: string;
    tenant_emergency_contact?: string;
    tenant_emergency_phone?: string;
    tenant_notes?: string;
  };
}

interface TenantInfoSectionProps {
  onSearchTenant: () => void;
}

export const TenantInfoSection = forwardRef<TenantInfoSectionRef, TenantInfoSectionProps>(function TenantInfoSection(
  { onSearchTenant },
  ref
) {
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    validate: async () => {
      await form.validateFields(['tenant_name', 'tenant_phone']);
    },
    getValues: () => form.getFieldsValue(),
  }));

  return (
    <Form form={form} layout="vertical">
      <Button onClick={onSearchTenant} className="mb-4">
        <Search className="h-4 w-4 mr-2" />
        选择已有租客
      </Button>
      <Form.Item
        label="租客姓名"
        name="tenant_name"
        rules={[{ required: true, message: '请输入租客姓名' }]}
      >
        <Input placeholder="请输入租客姓名" />
      </Form.Item>
      <Form.Item
        label="联系电话"
        name="tenant_phone"
        rules={[{ required: true, message: '请输入联系电话' }]}
      >
        <Input placeholder="请输入联系电话" />
      </Form.Item>
      <Form.Item label="身份证号" name="tenant_id_card">
        <Input placeholder="请输入身份证号" />
      </Form.Item>
      <Form.Item label="紧急联系人" name="tenant_emergency_contact">
        <Input placeholder="请输入紧急联系人" />
      </Form.Item>
      <Form.Item label="紧急联系电话" name="tenant_emergency_phone">
        <Input placeholder="请输入紧急联系电话" />
      </Form.Item>
      <Form.Item label="备注" name="tenant_notes">
        <Input.TextArea placeholder="备注信息" rows={2} />
      </Form.Item>
    </Form>
  );
});
