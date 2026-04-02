'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Check } from 'lucide-react';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
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
import { DEFAULT_ORGANIZATION_HOME_PATH } from '@/lib/auth/redirect';
import { Organization } from '@/types';

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

export default function OrganizationsPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, organizations, organization, setOrganization, refreshOrganizations } =
    useAuth();
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
      router.replace('/login');
      return;
    }

    setIsCheckingAuth(false);
  }, [isAuthenticated, isLoading, router]);

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
      appToast.success('团队创建成功');
      router.replace(DEFAULT_ORGANIZATION_HOME_PATH);
    },
    onError: (error) => {
      appToast.error(getErrorMessage(error, '创建团队失败，请重试'));
    },
  });

  const handleSelectOrganization = (org: Organization) => {
    setOrganization(org);
    appToast.success('团队切换成功');
    router.replace(DEFAULT_ORGANIZATION_HOME_PATH);
  };

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  // Empty state: show creation form when user has 0 organizations
  if (organizations.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-semibold">
                欢迎使用！创建你的第一个团队开始管理公寓
              </CardTitle>
              <CardDescription className="text-base">
                创建第一个团队后，你可以在此管理房源、租客、账单等
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
                <textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="备注信息（选填）"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createOrgMutation.isPending}>
                {createOrgMutation.isPending ? '创建中...' : '创建第一个团队'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Organization selection list when user has 1+ organizations
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">我的团队</h1>
        </div>
        <div className="space-y-3">
          {organizations.map((org) => {
            const isSelected = org.id === organization?.id;
            return (
              <Card
                key={org.id}
                className="cursor-pointer transition-colors hover:border-primary"
                onClick={() => handleSelectOrganization(org)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <Building2
                      className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </CardHeader>
                {org.notes && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{org.notes}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
