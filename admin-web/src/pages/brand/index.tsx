
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Input, Card } from 'antd';
import { Skeleton } from 'antd';
import { adminApiEndpoints } from '@/api/admin-client';
import { getErrorMessage } from '@/utils/error';
import { adminMessages } from '@/i18n';

const schema = z.object({
  app_name: z.string().min(1, '请输入系统名称'),
  app_description: z.string(),
  logo_url: z.string(),
  favicon_url: z.string(),
  login_subtitle: z.string(),
  register_subtitle: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function AdminBrandPage() {
  const queryClient = useQueryClient();
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values:
      config && !isError
        ? {
            app_name: config.app_name ?? '公寓管理系统',
            app_description: config.app_description ?? '公寓、租客与账单的一体化管理系统',
            logo_url: config.logo_url ?? '',
            favicon_url: config.favicon_url ?? '',
            login_subtitle: config.login_subtitle ?? '用户登录，管理公寓、租客与账单',
            register_subtitle: config.register_subtitle ?? '创建新账户',
          }
        : undefined,
    defaultValues: {
      app_name: '公寓管理系统',
      app_description: '公寓、租客与账单的一体化管理系统',
      logo_url: '',
      favicon_url: '',
      login_subtitle: '用户登录，管理公寓、租客与账单',
      register_subtitle: '创建新账户',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      adminApiEndpoints.updatePlatformConfig({
        app_name: data.app_name,
        app_description: data.app_description,
        logo_url: data.logo_url,
        favicon_url: data.favicon_url,
        login_subtitle: data.login_subtitle,
        register_subtitle: data.register_subtitle,
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
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))}
            className="space-y-4"
          >
            <Controller
              control={form.control}
              name="app_name"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.brand.fields.appName}</label>
                  <Input placeholder={adminMessages.brand.placeholders.appName} data-testid="admin-brand-name-input" {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="app_description"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.brand.fields.appDescription}</label>
                  <Input placeholder={adminMessages.brand.placeholders.appDescription} data-testid="admin-brand-description-input" {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="login_subtitle"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.brand.fields.loginSubtitle}</label>
                  <Input placeholder={adminMessages.brand.placeholders.loginSubtitle} data-testid="admin-brand-login-subtitle-input" {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="register_subtitle"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.brand.fields.registerSubtitle}</label>
                  <Input placeholder={adminMessages.brand.placeholders.registerSubtitle} data-testid="admin-brand-register-subtitle-input" {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="logo_url"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{adminMessages.brand.fields.logoUrl}</label>
                  <Input placeholder={adminMessages.brand.placeholders.url} type="url" data-testid="admin-brand-logo-input" {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="favicon_url"
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Favicon URL（可选）</label>
                  <Input placeholder="https://..." type="url" data-testid="admin-brand-favicon-input" {...field} />
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
            <Button htmlType="submit" data-testid="admin-brand-save-btn" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
