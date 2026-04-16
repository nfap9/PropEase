import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { adminApiEndpoints, type AdminRole, type AdminUser } from '@/api/admin-client';
import { getErrorMessage } from '@/utils/error';
import type { AdminPasswordReset, AdminUserCreate, AdminUserUpdate } from '@/api/admin-client';
import { adminMessages } from '@/i18n';

interface UseAdminUsersDataOptions {
  onCreateSuccess: () => void;
  onUpdateSuccess: () => void;
  onResetSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function useAdminUsersData({
  onCreateSuccess,
  onUpdateSuccess,
  onResetSuccess,
  onDeleteSuccess,
}: UseAdminUsersDataOptions) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await adminApiEndpoints.listUsers({ limit: 200 });
      return (response.data ?? []) as AdminUser[];
    },
  });

  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const response = await adminApiEndpoints.listRoles({ limit: 100 });
      return (response.data ?? []) as AdminRole[];
    },
  });

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: AdminUserCreate) => adminApiEndpoints.createUser(data),
    onSuccess: () => {
      invalidateUsers();
      onCreateSuccess();
      appToast.success(adminMessages.users.toast.created);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUserUpdate }) => adminApiEndpoints.updateUser(id, data),
    onSuccess: () => {
      invalidateUsers();
      onUpdateSuccess();
      appToast.success(adminMessages.users.toast.updated);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminPasswordReset }) =>
      adminApiEndpoints.resetUserPassword(id, data),
    onSuccess: () => {
      invalidateUsers();
      onResetSuccess();
      appToast.success(adminMessages.users.toast.resetPassword);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '重置失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteUser(id),
    onSuccess: () => {
      invalidateUsers();
      onDeleteSuccess();
      appToast.success(adminMessages.users.toast.deleted);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  return {
    users: usersQuery.data,
    usersLoading: usersQuery.isLoading,
    roles: rolesQuery.data,
    createMutation,
    updateMutation,
    resetMutation,
    deleteMutation,
  };
}
