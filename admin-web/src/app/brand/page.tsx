'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
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
      appToast.success(adminMessages.brand.toast.saved);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '保存失败，请重试')),
  });

  if (isLoading && !config && !isError) {
    return (
      <div className="mx-auto max-w-xl">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-4 text-xl font-semibold" data-testid="admin-brand-heading">{adminMessages.brand.heading}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{adminMessages.brand.title}</CardTitle>
          <CardDescription>{adminMessages.brand.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="app_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.brand.fields.appName}</FormLabel>
                    <FormControl>
                      <Input placeholder={adminMessages.brand.placeholders.appName} data-testid="admin-brand-name-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="app_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.brand.fields.appDescription}</FormLabel>
                    <FormControl>
                      <Input placeholder={adminMessages.brand.placeholders.appDescription} data-testid="admin-brand-description-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="login_subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.brand.fields.loginSubtitle}</FormLabel>
                    <FormControl>
                      <Input placeholder={adminMessages.brand.placeholders.loginSubtitle} data-testid="admin-brand-login-subtitle-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="register_subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.brand.fields.registerSubtitle}</FormLabel>
                    <FormControl>
                      <Input placeholder={adminMessages.brand.placeholders.registerSubtitle} data-testid="admin-brand-register-subtitle-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{adminMessages.brand.fields.logoUrl}</FormLabel>
                    <FormControl>
                      <Input placeholder={adminMessages.brand.placeholders.url} type="url" data-testid="admin-brand-logo-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="favicon_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon URL（可选）</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." type="url" data-testid="admin-brand-favicon-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" data-testid="admin-brand-save-btn" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
