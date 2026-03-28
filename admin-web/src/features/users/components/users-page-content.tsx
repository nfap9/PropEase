'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@/components/common/data-table';
import type { AdminUser } from '@/lib/api/admin-client';
import { createAdminUsersColumns } from '../users.columns';
import { useAdminUsersData } from '../users.hooks';
import { toCreateUserPayload, toResetPasswordPayload, toUpdateUserPayload } from '../users.utils';
import {
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
  ResetPasswordDialog,
} from './user-dialogs';

export function UsersPageContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const { users, usersLoading, roles, createMutation, updateMutation, resetMutation, deleteMutation } =
    useAdminUsersData({
      onCreateSuccess: () => setIsCreateOpen(false),
      onUpdateSuccess: () => {
        setIsEditOpen(false);
        setSelectedUser(null);
      },
      onResetSuccess: () => {
        setIsResetOpen(false);
        setSelectedUser(null);
      },
      onDeleteSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedUser(null);
      },
    });

  const columns = useMemo(
    () =>
      createAdminUsersColumns({
        onEdit: (user) => {
          setSelectedUser(user);
          setIsEditOpen(true);
        },
        onResetPassword: (user) => {
          setSelectedUser(user);
          setIsResetOpen(true);
        },
        onDelete: (user) => {
          setSelectedUser(user);
          setIsDeleteOpen(true);
        },
      }),
    []
  );

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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="admin-users-heading">
          运营账号
        </h2>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="admin-users-create-btn">
          <Plus className="mr-2 h-4 w-4" />
          新建账号
        </Button>
      </div>

      <DataTable columns={columns} data={users ?? []} testid="admin-users-list" />

      <CreateUserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        roles={roles}
        onSubmit={(data) => createMutation.mutate(toCreateUserPayload(data))}
        isPending={createMutation.isPending}
      />

      <EditUserDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        user={selectedUser}
        roles={roles}
        onSubmit={(data) => {
          if (!selectedUser) {
            return;
          }

          updateMutation.mutate({
            id: selectedUser.id,
            data: toUpdateUserPayload(data),
          });
        }}
        isPending={updateMutation.isPending}
      />

      <ResetPasswordDialog
        open={isResetOpen}
        onOpenChange={setIsResetOpen}
        user={selectedUser}
        onSubmit={(data) => {
          if (!selectedUser) {
            return;
          }

          resetMutation.mutate({
            id: selectedUser.id,
            data: toResetPasswordPayload(data.new_password),
          });
        }}
        isPending={resetMutation.isPending}
      />

      <DeleteUserDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        user={selectedUser}
        onConfirm={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
