'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions } from '@/components/common/table-actions';
import { formatDateTime } from '@/lib/date-utils';
import { ORG_STATUS_CONFIG } from '@/lib/status-config';
import type { AdminUser } from '@/lib/api/admin-client';

interface CreateAdminUsersColumnsOptions {
  onEdit: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

export function createAdminUsersColumns({
  onEdit,
  onResetPassword,
  onDelete,
}: CreateAdminUsersColumnsOptions): ColumnDef<AdminUser>[] {
  return [
    { accessorKey: 'username', header: '用户名' },
    { accessorKey: 'name', header: '姓名' },
    {
      accessorKey: 'email',
      header: '邮箱',
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      accessorKey: 'role_name',
      header: '角色',
      cell: ({ row }) => row.original.role_name ?? '—',
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => {
        const config = row.original.is_active ? ORG_STATUS_CONFIG.active : ORG_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'last_login_at',
      header: '最后登录',
      cell: ({ row }) => (row.original.last_login_at ? formatDateTime(row.original.last_login_at) : '—'),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <TableActions
          actions={[
            { icon: Pencil, label: '编辑', onClick: () => onEdit(row.original) },
            { icon: KeyRound, label: '重置密码', onClick: () => onResetPassword(row.original) },
            {
              icon: Trash2,
              label: '删除',
              variant: 'destructive',
              onClick: () => onDelete(row.original),
              show: !row.original.is_system,
            },
          ]}
        />
      ),
    },
  ];
}
