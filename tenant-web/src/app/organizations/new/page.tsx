'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/context';
import { organizationsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  DEFAULT_ORGANIZATION_HOME_PATH,
  getPostAuthRedirectPath,
  ORGANIZATION_ONBOARDING_PATH,
} from '@/lib/auth/redirect';

const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, '请输入组织名称'),
  notes: z.string().optional(),
});

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

function buildOrganizationSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'org'
  );
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, organizations, organization, setOrganization, refreshOrganizations } =
    useAuth();
  const [isReady, setIsReady] = useState(false);

  const form = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    const targetPath = getPostAuthRedirectPath(organizations, organization);
    if (targetPath !== ORGANIZATION_ONBOARDING_PATH) {
      router.replace(targetPath);
      return;
    }

    setIsReady(true);
  }, [isAuthenticated, isLoading, organization, organizations, router]);

  const createOrgMutation = useMutation({
    mutationFn: async (data: CreateOrganizationFormData) =>
      organizationsApi.create({
        name: data.name.trim(),
        slug: buildOrganizationSlug(data.name.trim()),
        notes: data.notes?.trim(),
      }),
    onSuccess: async (createdOrganization) => {
      await refreshOrganizations(createdOrganization.id);
      setOrganization(createdOrganization);
      toast.success('组织创建成功');
      router.replace(DEFAULT_ORGANIZATION_HOME_PATH);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '创建组织失败，请重试'));
    },
  });

  if (isLoading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">创建第一个组织</CardTitle>
            <CardDescription>
              新账号还没有加入任何组织，请先创建一个组织后开始使用。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => createOrgMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="organization-name">
                组织名称 <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="organization-name"
                placeholder="例如：星河公寓"
                aria-required
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <textarea
                id="notes"
                {...form.register('notes')}
                placeholder="备注信息（选填）"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={createOrgMutation.isPending}>
              {createOrgMutation.isPending ? '创建中...' : '创建组织并进入'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
