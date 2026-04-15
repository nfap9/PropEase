'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@/components/common/data-table';
import { TableActions } from '@/components/common/table-actions';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { FilterField } from '@apartment-ultra/shared-ui/components/ui';
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
import { adminMessages } from '@/lib/i18n';

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
      appToast.success(adminMessages.organizations.toast.updated);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '操作失败，请重试')),
  });

  const columns: ColumnDef<AdminOrganization>[] = [
    {
      accessorKey: 'name',
      header: adminMessages.organizations.columns.name,
      size: 200,
      minSize: 150,
      cell: ({ row }) => (
        <Link
          href={`/organizations/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: 'slug', header: 'Slug', size: 150, minSize: 120 },
    { accessorKey: 'plan', header: adminMessages.organizations.columns.service, size: 140, minSize: 100 },
    {
      accessorKey: 'is_personal',
      header: adminMessages.organizations.columns.personal,
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const config = row.original.is_personal
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'is_active',
      header: adminMessages.organizations.columns.status,
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const config = row.original.is_active
          ? ORG_STATUS_CONFIG.active
          : ORG_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: adminMessages.organizations.columns.createdAt,
      size: 180,
      minSize: 150,
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      header: adminMessages.organizations.columns.actions,
      size: 140,
      minSize: 120,
      cell: ({ row }) => {
        const org = row.original;
        return (
          <TableActions
            actions={[
              {
                icon: Eye,
                label: adminMessages.organizations.actions.detail,
                onClick: () => router.push(`/organizations/${org.id}`),
              },
              ...(org.is_active
                ? [
                    {
                      icon: PowerOff,
                      label: adminMessages.organizations.actions.disable,
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
                      label: adminMessages.organizations.actions.enable,
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
      <DataTable
        columns={columns}
        data={organizations ?? []}
        testid="admin-organizations-list"
        useCard={false}
        toolbar={
          <FilterField label="状态">
            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as FilterActive)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={adminMessages.organizations.filters.statusPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{adminMessages.organizations.filters.all}</SelectItem>
                <SelectItem value="active">{adminMessages.organizations.filters.active}</SelectItem>
                <SelectItem value="inactive">{adminMessages.organizations.filters.inactive}</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        }
      />
    </div>
  );
}
