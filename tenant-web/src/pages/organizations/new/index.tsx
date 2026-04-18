
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { organizationsApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Textarea } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { DEFAULT_ORGANIZATION_HOME_PATH } from '@/utils/auth-redirect';

const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, '请输入团队名称'),
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
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, setOrganization, refreshOrganizations } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
      navigate('/login', { replace: true });
      return;
    }

    setIsCheckingAuth(false);
  }, [isAuthenticated, isLoading, navigate]);

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
      toast.success('团队创建成功');
      navigate(DEFAULT_ORGANIZATION_HOME_PATH, { replace: true });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '创建团队失败，请重试'));
    },
  });

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/organizations')}
            className="gap-2 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="space-y-1 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-semibold">创建新团队</CardTitle>
            <CardDescription>创建新团队来管理你的公寓</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => createOrgMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="organization-name">
                团队名称 <span aria-hidden="true">*</span>
              </Label>
              <Input
                id="organization-name"
                placeholder="请输入团队名称"
                aria-required
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="备注信息（选填）"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createOrgMutation.isPending}>
              {createOrgMutation.isPending ? '创建中...' : '创建团队'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
