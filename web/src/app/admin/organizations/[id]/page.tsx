'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApiEndpoints } from '@/lib/api/admin-client';
import { ArrowLeft, Power, PowerOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
    mutationFn: (is_active: boolean) =>
      adminApiEndpoints.setOrganizationActive(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organization', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      toast.success('已更新');
    },
    onError: () => toast.error('操作失败，请重试'),
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
          <Link href="/admin/organizations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">组织详情</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{org.name}</span>
            {org.is_active ? (
              <Badge variant="default">启用</Badge>
            ) : (
              <Badge variant="secondary">停用</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span>{org.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">套餐</span>
              <span>{org.plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">个人团队</span>
              <span>{org.is_personal ? '是' : '否'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建时间</span>
              <span>{new Date(org.created_at).toLocaleString('zh-CN')}</span>
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
                停用组织
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setActiveMutation.mutate(true)}
                disabled={setActiveMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                启用组织
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground">
        订阅信息可在「订阅管理」中按组织筛选查看。
      </p>
    </div>
  );
}
