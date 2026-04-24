/**
 * OrganizationsView - 团队选择/创建视图
 *
 * 自包含视图，内部管理：
 * - 创建表单状态
 * - 空状态 vs 列表状态
 */
import { useNavigate } from 'react-router-dom';
import { Building2, Check, Plus } from 'lucide-react';
import { Card, Button, Input, Form } from 'antd';
import { useOrganizationsPage } from '../hooks/use-organizations-page';

const { TextArea } = Input;

export function OrganizationsView() {
  const navigate = useNavigate();
  const {
    isLoading,
    isCheckingAuth,
    organizations,
    organization,
    createOrganization,
    isCreating,
    isEmpty,
    handleSelectOrganization,
  } = useOrganizationsPage();

  const [form] = Form.useForm();

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    );
  }

  // Empty state: show creation form when user has 0 organizations
  if (isEmpty) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-lg" styles={{ body: { padding: 24 } }}>
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-semibold">
                欢迎使用！创建你的第一个团队开始管理公寓
              </h3>
              <p className="text-base text-gray-500">
                创建第一个团队后，你可以在此管理房源、租客、账单等
              </p>
            </div>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => createOrganization(values)}
            className="space-y-4"
            initialValues={{ name: '', notes: '' }}
          >
            <Form.Item
              name="name"
              label="团队名称"
              required
              rules={[{ required: true, message: '请输入团队名称' }]}
            >
              <Input placeholder="请输入团队名称" aria-required />
            </Form.Item>
            <Form.Item name="notes" label="备注">
              <TextArea placeholder="备注信息（选填）" rows={3} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={isCreating}>
              {isCreating ? '创建中...' : '创建第一个团队'}
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  // Organization selection list when user has 1+ organizations
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">我的团队</h1>
          <Button size="small" onClick={() => navigate('/organizations/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            创建新团队
          </Button>
        </div>
        <div className="space-y-3">
          {organizations.map((org) => {
            const isSelected = org.id === organization?.id;
            return (
              <Card
                key={org.id}
                className="cursor-pointer transition-colors hover:border-blue-500"
                styles={{ body: { padding: 16 } }}
                onClick={() => handleSelectOrganization(org)}
              >
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <Building2 className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-lg font-medium">{org.name}</span>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                </div>
                {org.notes && (
                  <div className="pt-0">
                    <p className="text-sm text-gray-500">{org.notes}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
