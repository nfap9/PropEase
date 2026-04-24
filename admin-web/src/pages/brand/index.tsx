import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Form, Input, Button, Card, Skeleton } from 'antd';
import { toast } from 'sonner';
import { adminApiEndpoints } from '@/api/admin-client';
import { getErrorMessage } from '@/utils/error';
import { adminMessages } from '@/i18n';

type PlatformConfigForm = {
  app_name: string | undefined;
  app_description: string | undefined;
  logo_url: string | undefined;
  favicon_url: string | undefined;
  login_subtitle: string | undefined;
  register_subtitle: string | undefined;
};

export default function AdminBrandPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const {
    data: config,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin', 'platform-config'],
    queryFn: async () => {
      const res = await adminApiEndpoints.getPlatformConfig();
      return res.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (config && !isError) {
      form.setFieldsValue({
        app_name: config.app_name ?? '公寓管理系统',
        app_description: config.app_description ?? '公寓、租客与账单的一体化管理系统',
        logo_url: config.logo_url ?? '',
        favicon_url: config.favicon_url ?? '',
        login_subtitle: config.login_subtitle ?? '用户登录，管理公寓、租客与账单',
        register_subtitle: config.register_subtitle ?? '创建新账户',
      } as PlatformConfigForm);
    }
  }, [config, isError, form]);

  const updateMutation = useMutation({
    mutationFn: (data: PlatformConfigForm) =>
      adminApiEndpoints.updatePlatformConfig({
        app_name: data.app_name ?? '',
        app_description: data.app_description ?? '',
        logo_url: data.logo_url ?? '',
        favicon_url: data.favicon_url ?? '',
        login_subtitle: data.login_subtitle ?? '',
        register_subtitle: data.register_subtitle ?? '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-config'] });
      queryClient.invalidateQueries({ queryKey: ['config', 'public'] });
      toast.success(adminMessages.brand.toast.saved);
    },
    onError: (error) => toast.error(getErrorMessage(error, '保存失败，请重试')),
  });

  if (isLoading && !config && !isError) {
    return (
      <div className="mx-auto max-w-xl">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-page">
      <h2 className="text-xl font-semibold" data-testid="admin-brand-heading">{adminMessages.brand.heading}</h2>
      <Card styles={{ body: { padding: '24px' } }}>
        <div>
          <h3 className="text-lg font-semibold">{adminMessages.brand.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{adminMessages.brand.description}</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => updateMutation.mutate(values)}
          className="space-y-4"
          requiredMark={false}
        >
          <Form.Item
            name="app_name"
            label={<span className="text-sm font-medium">{adminMessages.brand.fields.appName}</span>}
            rules={[{ required: true, message: '请输入系统名称' }]}
          >
            <Input
              placeholder={adminMessages.brand.placeholders.appName}
              data-testid="admin-brand-name-input"
            />
          </Form.Item>

          <Form.Item
            name="app_description"
            label={<span className="text-sm font-medium">{adminMessages.brand.fields.appDescription}</span>}
          >
            <Input
              placeholder={adminMessages.brand.placeholders.appDescription}
              data-testid="admin-brand-description-input"
            />
          </Form.Item>

          <Form.Item
            name="login_subtitle"
            label={<span className="text-sm font-medium">{adminMessages.brand.fields.loginSubtitle}</span>}
          >
            <Input
              placeholder={adminMessages.brand.placeholders.loginSubtitle}
              data-testid="admin-brand-login-subtitle-input"
            />
          </Form.Item>

          <Form.Item
            name="register_subtitle"
            label={<span className="text-sm font-medium">{adminMessages.brand.fields.registerSubtitle}</span>}
          >
            <Input
              placeholder={adminMessages.brand.placeholders.registerSubtitle}
              data-testid="admin-brand-register-subtitle-input"
            />
          </Form.Item>

          <Form.Item
            name="logo_url"
            label={<span className="text-sm font-medium">{adminMessages.brand.fields.logoUrl}</span>}
          >
            <Input
              placeholder={adminMessages.brand.placeholders.url}
              type="url"
              data-testid="admin-brand-logo-input"
            />
          </Form.Item>

          <Form.Item
            name="favicon_url"
            label={<span className="text-sm font-medium">Favicon URL（可选）</span>}
          >
            <Input
              placeholder="https://..."
              type="url"
              data-testid="admin-brand-favicon-input"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            data-testid="admin-brand-save-btn"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
