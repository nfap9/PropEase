import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Building2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Input, Form } from 'antd';
import { useAuth } from '@/contexts/auth';
import { organizationsApi } from '@/api/organizations';
import { getErrorMessage } from '@propease/web-shared';
import { DEFAULT_ORGANIZATION_HOME_PATH } from '@/utils/auth-redirect';

const { TextArea } = Input;

function buildOrganizationSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'org'
  );
}

export default function CreateOrganizationPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, setOrganization, refreshOrganizations } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/tenant/login', { replace: true });
      return;
    }

    setIsCheckingAuth(false);
  }, [isAuthenticated, isLoading, navigate]);

  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; notes?: string }) =>
      organizationsApi.create({
        name: data.name.trim(),
        slug: buildOrganizationSlug(data.name.trim()),
        notes: data.notes?.trim(),
      }),
    onSuccess: async (createdOrganization) => {
      await refreshOrganizations(createdOrganization.id);
      setOrganization(createdOrganization);
      toast.success('团队创建成功');
      navigate(DEFAULT_ORGANIZATION_HOME_PATH, { replace: true });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '创建团队失败，请重试'));
    },
  });

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg" styles={{ body: { padding: 24 } }}>
        <div className="space-y-4">
          <Button
            type="text"
            size="small"
            onClick={() => navigate('/organizations')}
            className="gap-2 mb-4"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            返回
          </Button>
          <div className="space-y-1 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold">创建新团队</h3>
            <p className="text-gray-500">创建新团队来管理你的公寓</p>
          </div>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createOrgMutation.mutate(values)}
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
          <Button type="primary" htmlType="submit" block loading={createOrgMutation.isPending}>
            {createOrgMutation.isPending ? '创建中...' : '创建团队'}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
