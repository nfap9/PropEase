import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { ORG_STATUS_CONFIG, BOOLEAN_YES_NO_CONFIG } from '@/utils/status';
import { adminApiEndpoints } from '@/api/admin-client';
import { getErrorMessage } from '@/utils/error';
import { ArrowLeft, Power, PowerOff } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { formatDateTime } from '@/utils/date';
import { adminMessages } from '@/i18n';

export default function AdminOrganizationDetailPage() {
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
      <div className="mx-auto max-w-2xl">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/organizations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">团队详情</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{org.name}</span>
            <Badge
              variant={
                org.is_active
                  ? ORG_STATUS_CONFIG.active.variant
                  : ORG_STATUS_CONFIG.inactive.variant
              }
            >
              {org.is_active ? ORG_STATUS_CONFIG.active.label : ORG_STATUS_CONFIG.inactive.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">短标识</span>
              <span>{org.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">服务</span>
              <span className="text-muted-foreground">{adminMessages.organizations.serviceHint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">个人团队</span>
              <Badge
                variant={
                  org.is_personal
                    ? BOOLEAN_YES_NO_CONFIG.yes.variant
                    : BOOLEAN_YES_NO_CONFIG.no.variant
                }
              >
                {org.is_personal ? BOOLEAN_YES_NO_CONFIG.yes.label : BOOLEAN_YES_NO_CONFIG.no.label}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建时间</span>
              <span>{formatDateTime(org.created_at)}</span>
            </div>
          </div>
          <div className="pt-4">
            {org.is_active ? (
              <Button
                variant="destructive"
                onClick={() => setActiveMutation.mutate(false)}
                disabled={setActiveMutation.isPending}
              >
                <PowerOff className="mr-2 h-4 w-4" />
                停用团队
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setActiveMutation.mutate(true)}
                disabled={setActiveMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                启用团队
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground">
        {adminMessages.organizations.subscriptionHint}
      </p>
    </div>
  );
}
