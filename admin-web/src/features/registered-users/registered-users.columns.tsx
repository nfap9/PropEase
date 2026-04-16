
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Power, PowerOff, Trash2 } from 'lucide-react';
import { StatusBadge } from '@apartment-ultra/shared-ui/components/ui';
import { TableActions } from '@/components/common/table-actions';
import { formatDateTime } from '@/utils/date';
import { ORG_STATUS_CONFIG } from '@/utils/status';
import type { AdminRegisteredUser } from '@/api/admin-client';
import { adminMessages } from '@/i18n';

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
    { accessorKey: 'phone', header: adminMessages.registeredUsers.columns.phone, size: 140, minSize: 120 },
    { accessorKey: 'full_name', header: adminMessages.registeredUsers.columns.name, size: 140, minSize: 100 },
    {
      accessorKey: 'is_active',
      header: adminMessages.registeredUsers.columns.status,
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const config = row.original.is_active ? ORG_STATUS_CONFIG.active : ORG_STATUS_CONFIG.inactive;
        return <StatusBadge variant={config.variant}>{config.label}</StatusBadge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: adminMessages.registeredUsers.columns.createdAt,
      size: 180,
      minSize: 150,
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      header: adminMessages.registeredUsers.columns.actions,
      size: 180,
      minSize: 160,
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
