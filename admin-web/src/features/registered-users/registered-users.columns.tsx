'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Power, PowerOff, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions } from '@/components/common/table-actions';
import { formatDateTime } from '@/lib/date-utils';
import { ORG_STATUS_CONFIG } from '@/lib/status-config';
import type { AdminRegisteredUser } from '@/lib/api/admin-client';

interface CreateRegisteredUsersColumnsOptions {
  onView: (userId: string) => void;
  onEnable: (userId: string) => void;
  onDisable: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export function createRegisteredUsersColumns({
  onView,
  onEnable,
  onDisable,
  onDelete,
}: CreateRegisteredUsersColumnsOptions): ColumnDef<AdminRegisteredUser>[] {
  return [
    { accessorKey: 'phone', header: '手机号' },
    { accessorKey: 'full_name', header: '姓名' },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => {
        const config = row.original.is_active ? ORG_STATUS_CONFIG.active : ORG_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: '注册时间',
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <TableActions
            actions={[
              {
                icon: Eye,
                label: '详情',
                onClick: () => onView(user.id),
              },
              ...(user.is_active
                ? [
                    {
                      icon: PowerOff,
                      label: '停用',
                      variant: 'destructive' as const,
                      onClick: () => onDisable(user.id),
                    },
                  ]
                : [
                    {
                      icon: Power,
                      label: '启用',
                      onClick: () => onEnable(user.id),
                    },
                  ]),
              {
                icon: Trash2,
                label: '删除',
                variant: 'destructive',
                onClick: () => onDelete(user.id),
              },
            ]}
          />
        );
      },
    },
  ];
}
