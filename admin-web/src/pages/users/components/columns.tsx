
import type { ColumnDef } from '@tanstack/react-table';
import { KeyRound, Pencil, Trash2 } from 'lucide-react';
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
import type { AdminUser } from '@/api/admin-client';
import { adminMessages } from '@/i18n';
import { MoreHorizontal } from 'lucide-react';

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
    { accessorKey: 'username', header: '用户名', size: 140, minSize: 100 },
    { accessorKey: 'name', header: '姓名', size: 120, minSize: 80 },
    {
      accessorKey: 'email',
      header: '邮箱',
      size: 200,
      minSize: 150,
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      accessorKey: 'role_name',
      header: adminMessages.users.columns.role,
      size: 120,
      minSize: 100,
      cell: ({ row }) => row.original.role_name ?? '—',
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const config = row.original.is_active ? ORG_STATUS_CONFIG.active : ORG_STATUS_CONFIG.inactive;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'last_login_at',
      header: '最后登录',
      size: 180,
      minSize: 150,
      cell: ({ row }) => (row.original.last_login_at ? formatDateTime(row.original.last_login_at) : '—'),
    },
    {
      id: 'actions',
      header: '操作',
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
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <KeyRound className="mr-2 h-4 w-4" />
                重置密码
              </DropdownMenuItem>
              {!user.is_system && (
                <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
