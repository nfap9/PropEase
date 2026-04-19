
import { Plus } from 'lucide-react';
import { useManagedItem } from '@apartment-ultra/shared-ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@apartment-ultra/shared-ui/components/ui';
import type { AdminUser } from '@/api/admin-client';
import { createAdminUsersColumns } from '@/components/users/columns';
import { useAdminUsersData } from '@/hooks/users';
import { toCreateUserPayload, toResetPasswordPayload, toUpdateUserPayload } from '@/utils/users';
import { CreateUserDialog, DeleteUserDialog, EditUserDialog, ResetPasswordDialog } from './user-dialogs';

type UserDialogAction = 'create' | 'edit' | 'reset' | 'delete';

export function UsersPageContent() {
  const dialogState = useManagedItem<AdminUser, UserDialogAction>();

  const { users, usersLoading, roles, createMutation, updateMutation, resetMutation, deleteMutation } =
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

  if (usersLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center gap-2 sm:justify-end mb-4">
        <Button onClick={() => dialogState.openAction('create')} data-testid="admin-users-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建账号
        </Button>
      </div>

      <DataTable columns={columns} data={users ?? []} testid="admin-users-list" useCard={false} />

      <CreateUserDialog
        {...dialogState.dialogProps('create')}
        roles={roles}
        onSubmit={(data) => createMutation.mutate(toCreateUserPayload(data))}
        isPending={createMutation.isPending}
      />

      <EditUserDialog
        {...dialogState.dialogProps('edit')}
        user={dialogState.selectedItem}
        roles={roles}
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
