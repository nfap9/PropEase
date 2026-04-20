
import { Plus } from 'lucide-react';
import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import { Skeleton } from 'antd';
import type { AdminUser } from '@/api/admin-client';
import { createAdminUsersColumns } from '@/pages/users/components/columns';
import { useAdminUsersData } from '@/hooks/users';
import { toCreateUserPayload, toResetPasswordPayload, toUpdateUserPayload } from '@/utils/users';
import { CreateUserDialog, DeleteUserDialog, EditUserDialog, ResetPasswordDialog } from '@/pages/users/components/user-dialogs';
import { useManagedItem } from '@/hooks';

type UserDialogAction = 'create' | 'edit' | 'reset' | 'delete';

export default function AdminUsersPage() {
  const dialogState = useManagedItem<AdminUser, UserDialogAction>();

  const { users, usersLoading, createMutation, updateMutation, resetMutation, deleteMutation } =
    useAdminUsersData({
      onCreateSuccess: dialogState.close,
      onUpdateSuccess: dialogState.close,
      onResetSuccess: dialogState.close,
      onDeleteSuccess: dialogState.close,
    });

  const columns = createAdminUsersColumns({
    onEdit: (user) => dialogState.openFor('edit', user),
    onResetPassword: (user) => dialogState.openFor('reset', user),
    onDelete: (user) => dialogState.openFor('delete', user),
  });

  const tableProps: TableProps<AdminUser> = {
    dataSource: users ?? [],
    columns,
    rowKey: (record) => record.id,
    pagination: false,
    scroll: { x: 'max-content' },
  };

  if (usersLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-page">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-page">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button onClick={() => dialogState.openAction('create')} data-testid="admin-users-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建账号
        </Button>
      </div>

      <Table {...tableProps} data-testid="admin-users-list" />

      <CreateUserDialog
        {...dialogState.dialogProps('create')}
        onSubmit={(data) => createMutation.mutate(toCreateUserPayload(data))}
        isPending={createMutation.isPending}
      />

      <EditUserDialog
        {...dialogState.dialogProps('edit')}
        user={dialogState.selectedItem}
        onSubmit={(data) => {
          if (!dialogState.selectedItem) {
            return;
          }

          updateMutation.mutate({
            id: dialogState.selectedItem.id,
            data: toUpdateUserPayload(data),
          });
        }}
        isPending={updateMutation.isPending}
      />

      <ResetPasswordDialog
        {...dialogState.dialogProps('reset')}
        user={dialogState.selectedItem}
        onSubmit={(data) => {
          if (!dialogState.selectedItem) {
            return;
          }

          resetMutation.mutate({
            id: dialogState.selectedItem.id,
            data: toResetPasswordPayload(data.new_password),
          });
        }}
        isPending={resetMutation.isPending}
      />

      <DeleteUserDialog
        {...dialogState.dialogProps('delete')}
        user={dialogState.selectedItem}
        onConfirm={() => dialogState.selectedItem && deleteMutation.mutate(dialogState.selectedItem.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
