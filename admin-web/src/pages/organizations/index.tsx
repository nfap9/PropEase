
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Table, Dropdown, Tag, Button } from 'antd';
import type { TableProps } from 'antd';
import { Select } from 'antd';
import { Skeleton } from 'antd';
import { ORG_STATUS_CONFIG, BOOLEAN_YES_NO_CONFIG } from '@/utils/status';
import {
  adminApiEndpoints,
  AdminOrganization,
} from '@/api/admin-client';
import { getErrorMessage } from '@/utils/error';
import { formatDateTime } from '@/utils/date';
import { Eye, Power, PowerOff, MoreHorizontal } from 'lucide-react';
import { adminMessages } from '@/i18n';

type FilterActive = 'all' | 'active' | 'inactive';

export default function AdminOrganizationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
      toast.success(adminMessages.organizations.toast.updated);
    },
    onError: (error) => toast.error(getErrorMessage(error, '操作失败，请重试')),
  });

  const columns = [
    {
      title: adminMessages.organizations.columns.name,
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, org: AdminOrganization) => (
        <Link
          to={`/organizations/${org.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {name}
        </Link>
      ),
    },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', width: 150 },
    { title: adminMessages.organizations.columns.service, dataIndex: 'plan', key: 'plan', width: 140 },
    {
      title: adminMessages.organizations.columns.personal,
      dataIndex: 'is_personal',
      key: 'is_personal',
      width: 100,
      render: (is_personal: boolean) => {
        const config = is_personal
          ? BOOLEAN_YES_NO_CONFIG.yes
          : BOOLEAN_YES_NO_CONFIG.no;
        return <Tag color={config.variant === 'success' ? 'success' : config.variant === 'warning' ? 'warning' : config.variant === 'destructive' ? 'error' : 'default'}>{config.label}</Tag>;
      },
    },
    {
      title: adminMessages.organizations.columns.status,
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active: boolean) => {
        const config = is_active
          ? ORG_STATUS_CONFIG.active
          : ORG_STATUS_CONFIG.inactive;
        return <Tag color={config.variant === 'success' ? 'success' : config.variant === 'warning' ? 'warning' : config.variant === 'destructive' ? 'error' : 'default'}>{config.label}</Tag>;
      },
    },
    {
      title: adminMessages.organizations.columns.createdAt,
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (created_at: string) => formatDateTime(created_at),
    },
    {
      title: adminMessages.organizations.columns.actions,
      key: 'actions',
      width: 80,
      render: (_: unknown, org: AdminOrganization) => {
        const menuItems = [
          {
            key: 'detail',
            icon: <Eye className="h-4 w-4" />,
            label: adminMessages.organizations.actions.detail,
            onClick: () => navigate(`/organizations/${org.id}`),
          },
          org.is_active ? {
            key: 'disable',
            icon: <PowerOff className="h-4 w-4" />,
            label: adminMessages.organizations.actions.disable,
            danger: true,
            onClick: () => setActiveMutation.mutate({ id: org.id, is_active: false }),
          } : {
            key: 'enable',
            icon: <Power className="h-4 w-4" />,
            label: adminMessages.organizations.actions.enable,
            onClick: () => setActiveMutation.mutate({ id: org.id, is_active: true }),
          },
        ];

        return (
          <Dropdown
            menu={{
              items: menuItems.filter(Boolean),
            }}
            trigger={['click']}
          >
            <Button type="text" size="small">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  const tableProps: TableProps = {
    dataSource: organizations ?? [],
    columns,
    rowKey: (record: AdminOrganization) => record.id,
    pagination: false,
    scroll: { x: 'max-content' },
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-page">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-page">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">状态</span>
          <Select value={activeFilter} onChange={(v) => setActiveFilter(v as FilterActive)} style={{ width: 120 }}>
            <Select.Option value="all">{adminMessages.organizations.filters.all}</Select.Option>
            <Select.Option value="active">{adminMessages.organizations.filters.active}</Select.Option>
            <Select.Option value="inactive">{adminMessages.organizations.filters.inactive}</Select.Option>
          </Select>
        </div>
      </div>
      <Table {...tableProps} data-testid="admin-organizations-list" />
    </div>
  );
}
