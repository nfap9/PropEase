'use client';

import { Plus } from 'lucide-react';
import { useManagedItem } from '@apartment-ultra/shared-ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ListPageLayout } from '@apartment-ultra/shared-ui/components/ui';
import { PageToolbar } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@/components/common/data-table';
import type { AdminUser } from '@/lib/api/admin-client';
import { createAdminUsersColumns } from '../users.columns';
import { useAdminUsersData } from '../users.hooks';
import { toCreateUserPayload, toResetPasswordPayload, toUpdateUserPayload } from '../users.utils';
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
    <ListPageLayout
      title=""
      titleTestId="admin-users-heading"
      maxWidth="6xl"
      actions={
        <PageToolbar>
          <Button onClick={() => dialogState.openAction('create')} data-testid="admin-users-create-btn">
            <Plus className="mr-2 h-4 w-4" />
            新建账号
          </Button>
        </PageToolbar>
      }
    >
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
    </ListPageLayout>
  );
}
