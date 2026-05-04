import { forwardRef, useImperativeHandle } from 'react';
import { Form } from 'antd';
import { User, Phone, IdCard, AlertCircle, Search, UserCheck2 } from 'lucide-react';
import { Button, Input } from 'antd';
import { Label } from '@/components/common/label';

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

  const errors = form.getFieldsError();

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">填写租客信息</h3>
            <p className="text-sm text-gray-500">录入或选择已有租客</p>
          </div>
        </div>
        <Button
          onClick={onSearchTenant}
          className="rounded-xl gap-2 border-amber-200 text-amber-700"
        >
          <Search className="h-4 w-4" />
          选择已有租客
        </Button>
      </div>

      {/* Existing tenant hint */}
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-200/70 bg-amber-50/30 p-4">
        <UserCheck2 className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-900">快速录入</p>
          <p className="text-xs text-gray-500 mt-0.5">
            点击上方「选择已有租客」可快速从系统中填充租客信息，或直接填写下方表单录入新租客。
          </p>
        </div>
      </div>

      {/* Primary Info Card */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 pb-2 border-b border-gray-200/40">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-700 text-xs font-bold">1</span>
          基本信息
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant_name" className="flex items-center gap-1.5 text-sm font-medium">
              <User className="h-3.5 w-3.5 text-gray-400" />
              租客姓名 <span className="text-red-500">*</span>
            </Label>
            <Form.Item
              name="tenant_name"
              rules={[{ required: true, message: '请输入租客姓名' }]}
              style={{ marginBottom: 0 }}
            >
              <Input id="tenant_name" placeholder="请输入租客姓名" className="rounded-xl h-11" />
            </Form.Item>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_phone" className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              联系电话 <span className="text-red-500">*</span>
            </Label>
            <Form.Item
              name="tenant_phone"
              rules={[{ required: true, message: '请输入联系电话' }]}
              style={{ marginBottom: 0 }}
            >
              <Input id="tenant_phone" placeholder="请输入联系电话" className="rounded-xl h-11" />
            </Form.Item>
          </div>
        </div>
      </div>

      {/* Secondary Info Card */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 pb-2 border-b border-gray-200/40">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-200 text-gray-600 text-xs font-bold">2</span>
          补充信息（选填）
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant_id_card" className="flex items-center gap-1.5 text-sm font-medium">
              <IdCard className="h-3.5 w-3.5 text-gray-400" />
              身份证号
            </Label>
            <Form.Item name="tenant_id_card" style={{ marginBottom: 0 }}>
              <Input id="tenant_id_card" placeholder="请输入身份证号" className="rounded-xl h-11" />
            </Form.Item>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_notes" className="text-sm font-medium">
              备注
            </Label>
            <Form.Item name="tenant_notes" style={{ marginBottom: 0 }}>
              <Input id="tenant_notes" placeholder="租客相关备注" className="rounded-xl h-11" />
            </Form.Item>
          </div>
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 pb-2 border-b border-gray-200/40">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gray-200 text-gray-600 text-xs font-bold">3</span>
          紧急联系人（选填）
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenant_emergency_contact" className="text-sm font-medium">
              紧急联系人
            </Label>
            <Form.Item name="tenant_emergency_contact" style={{ marginBottom: 0 }}>
              <Input id="tenant_emergency_contact" placeholder="请输入紧急联系人姓名" className="rounded-xl h-11" />
            </Form.Item>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant_emergency_phone" className="text-sm font-medium">
              紧急联系电话
            </Label>
            <Form.Item name="tenant_emergency_phone" style={{ marginBottom: 0 }}>
              <Input id="tenant_emergency_phone" placeholder="请输入紧急联系电话" className="rounded-xl h-11" />
            </Form.Item>
          </div>
        </div>
      </div>
    </div>
  );
});
