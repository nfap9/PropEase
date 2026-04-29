import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Tag, Card } from 'antd';
import { Skeleton } from 'antd';
import { ORG_STATUS_CONFIG, BOOLEAN_YES_NO_CONFIG } from '@/utils/status';
import { adminApiEndpoints } from '@/api/admin-client';
import { getErrorMessage } from '@apartment-ultra/web-shared';
import { ArrowLeft, Power, PowerOff } from 'lucide-react';
import { formatDateTime } from '@/utils/date';
import { adminMessages } from '@/i18n';

export function OrganizationDetailView() {
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: org, isLoading } = useQuery({
    queryKey: ['admin', 'organization', id],
    queryFn: async () => {
      const res = await adminApiEndpoints.getOrganization(id);
      return res.data;
    },
    enabled: !!id,
  });

  const setActiveMutation = useMutation({
    mutationFn: (is_active: boolean) => adminApiEndpoints.setOrganizationActive(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      toast.success('已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '操作失败，请重试')),
  });

  if (isLoading || !org) {
    return (
      <div className="mx-auto max-w-2xl space-y-page">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-page">
      <div className="flex items-center gap-2">
        <Link to="/organizations">
          <Button type="text">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-xl font-semibold">团队详情</h2>
      </div>

      <Card styles={{ body: { padding: '16px 24px' } }}>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold">{org.name}</span>
          <Tag color={org.is_active ? 'success' : 'default'}>
            {org.is_active ? ORG_STATUS_CONFIG.active.label : ORG_STATUS_CONFIG.inactive.label}
          </Tag>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">短标识</span>
              <span>{org.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">服务</span>
              <span className="text-gray-500">{adminMessages.organizations.serviceHint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">个人团队</span>
              <Tag color={org.is_personal ? 'success' : 'default'}>
                {org.is_personal ? BOOLEAN_YES_NO_CONFIG.yes.label : BOOLEAN_YES_NO_CONFIG.no.label}
              </Tag>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">创建时间</span>
              <span>{formatDateTime(org.created_at)}</span>
            </div>
          </div>
          <div className="pt-4">
            {org.is_active ? (
              <Button
                danger
                onClick={() => setActiveMutation.mutate(false)}
                disabled={setActiveMutation.isPending}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                停用团队
              </Button>
            ) : (
              <Button
                onClick={() => setActiveMutation.mutate(true)}
                disabled={setActiveMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                启用团队
              </Button>
            )}
          </div>
        </div>
      </Card>

      <p className="text-sm text-gray-500">
        {adminMessages.organizations.subscriptionHint}
      </p>
    </div>
  );
}
