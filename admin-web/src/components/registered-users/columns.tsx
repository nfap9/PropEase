
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Power, PowerOff, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { formatDateTime } from '@/utils/date';
import { ORG_STATUS_CONFIG } from '@/utils/status';
import type { AdminRegisteredUser } from '@/api/admin-client';
import { adminMessages } from '@/i18n';
import { MoreHorizontal } from 'lucide-react';

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
        return <Badge variant={config.variant}>{config.label}</Badge>;
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
      size: 80,
      minSize: 60,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(user.id)}>
                <Eye className="mr-2 h-4 w-4" />
                {adminMessages.registeredUsers.actions.detail}
              </DropdownMenuItem>
              {user.is_active ? (
                <DropdownMenuItem onClick={() => onDisable(user.id)} className="text-destructive">
                  <PowerOff className="mr-2 h-4 w-4" />
                  {adminMessages.registeredUsers.actions.disable}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEnable(user.id)}>
                  <Power className="mr-2 h-4 w-4" />
                  {adminMessages.registeredUsers.actions.enable}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDelete(user.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {adminMessages.registeredUsers.actions.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
