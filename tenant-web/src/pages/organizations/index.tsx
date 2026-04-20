import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Input } from 'antd';
import { useAuth } from '@/contexts/auth';
import { organizationsApi } from '@/api/organizations';
import { getErrorMessage } from '@/utils/error';
import {
  DEFAULT_ORGANIZATION_HOME_PATH,
} from '@/utils/auth-redirect';
import { Organization } from '@/types';
import { Label } from '@/components/common/label';

const { TextArea } = Input;

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
  const navigate = useNavigate();
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

  const handleSelectOrganization = (org: Organization) => {
    setOrganization(org);
    toast.success('团队切换成功');
    navigate(DEFAULT_ORGANIZATION_HOME_PATH, { replace: true });
  };

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    );
  }

  // Empty state: show creation form when user has 0 organizations
  if (organizations.length === 0) {
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
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <TextArea
                id="notes"
                {...form.register('notes')}
                placeholder="备注信息（选填）"
                rows={3}
              />
            </div>
            <Button type="primary" htmlType="submit" block loading={createOrgMutation.isPending}>
              {createOrgMutation.isPending ? '创建中...' : '创建第一个团队'}
            </Button>
          </form>
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
          <Button variant="outlined" size="small" onClick={() => navigate('/organizations/new')} className="gap-2">
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
                    <Building2
                      className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
                    />
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
