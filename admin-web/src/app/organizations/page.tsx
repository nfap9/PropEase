'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { ORG_STATUS_CONFIG, BOOLEAN_YES_NO_CONFIG } from '@/lib/status-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { adminApiEndpoints, AdminOrganization } from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { formatDateTime } from '@/lib/date-utils';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Power, PowerOff } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';

type FilterActive = 'all' | 'active' | 'inactive';

export default function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterActive>('all');

  const isActiveParam = activeFilter === 'all' ? undefined : activeFilter === 'active';

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['admin', 'organizations', isActiveParam],
    queryFn: async () => {
      const res = await adminApiEndpoints.listOrganizations({
        limit: 200,
        is_active: isActiveParam,
      });
      return (res.data ?? []) as AdminOrganization[];
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApiEndpoints.setOrganizationActive(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      toast.success('已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '操作失败，请重试')),
  });

  const columns: ColumnDef<AdminOrganization>[] = [
    {
      accessorKey: 'name',
      header: '团队名称',
      cell: ({ row }) => (
        <Link
          href={`/organizations/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'plan', header: '服务' },
    {
      accessorKey: 'is_personal',
      header: '个人团队',
      cell: ({ row }) => {
        const config = row.original.is_personal
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => {
        const config = row.original.is_active
          ? ORG_STATUS_CONFIG.active
          : ORG_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: '创建时间',
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const org = row.original;
        return (
          <TableActions
            actions={[
              {
                icon: Eye,
                label: '详情',
                onClick: () => router.push(`/organizations/${org.id}`),
              },
              ...(org.is_active
                ? [
                    {
                      icon: PowerOff,
                      label: '停用',
                      variant: 'destructive' as const,
                      onClick: () =>
                        setActiveMutation.mutate({
                          id: org.id,
                          is_active: false,
                        }),
                    },
                  ]
                : [
                    {
                      icon: Power,
                      label: '启用',
                      onClick: () =>
                        setActiveMutation.mutate({
                          id: org.id,
                          is_active: true,
                        }),
                    },
                  ]),
            ]}
          />
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="admin-organizations-heading">团队管理</h2>
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterActive)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={organizations ?? []} testid="admin-organizations-list" />
    </div>
  );
}
