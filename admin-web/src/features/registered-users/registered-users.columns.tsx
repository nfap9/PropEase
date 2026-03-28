'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Power, PowerOff, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions } from '@/components/common/table-actions';
import { formatDateTime } from '@/lib/date-utils';
import { ORG_STATUS_CONFIG } from '@/lib/status-config';
import type { AdminRegisteredUser } from '@/lib/api/admin-client';
import { adminMessages } from '@/lib/i18n';

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
    { accessorKey: 'phone', header: adminMessages.registeredUsers.columns.phone },
    { accessorKey: 'full_name', header: adminMessages.registeredUsers.columns.name },
    {
      accessorKey: 'is_active',
      header: adminMessages.registeredUsers.columns.status,
      cell: ({ row }) => {
        const config = row.original.is_active ? ORG_STATUS_CONFIG.active : ORG_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: adminMessages.registeredUsers.columns.createdAt,
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      header: adminMessages.registeredUsers.columns.actions,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <TableActions
            actions={[
              {
                icon: Eye,
                label: adminMessages.registeredUsers.actions.detail,
                onClick: () => onView(user.id),
              },
              ...(user.is_active
                ? [
                    {
                      icon: PowerOff,
                      label: adminMessages.registeredUsers.actions.disable,
                      variant: 'destructive' as const,
                      onClick: () => onDisable(user.id),
                    },
                  ]
                : [
                    {
                      icon: Power,
                      label: adminMessages.registeredUsers.actions.enable,
                      onClick: () => onEnable(user.id),
                    },
                  ]),
              {
                icon: Trash2,
                label: adminMessages.registeredUsers.actions.delete,
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
