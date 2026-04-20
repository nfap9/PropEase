import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApiEndpoints, type AdminUser } from '@/api/admin-client';
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

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: AdminUserCreate) => adminApiEndpoints.createUser(data),
    onSuccess: () => {
      invalidateUsers();
      onCreateSuccess();
      toast.success(adminMessages.users.toast.created);
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUserUpdate }) => adminApiEndpoints.updateUser(id, data),
    onSuccess: () => {
      invalidateUsers();
      onUpdateSuccess();
      toast.success(adminMessages.users.toast.updated);
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminPasswordReset }) =>
      adminApiEndpoints.resetUserPassword(id, data),
    onSuccess: () => {
      invalidateUsers();
      onResetSuccess();
      toast.success(adminMessages.users.toast.resetPassword);
    },
    onError: (error) => toast.error(getErrorMessage(error, '重置失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteUser(id),
    onSuccess: () => {
      invalidateUsers();
      onDeleteSuccess();
      toast.success(adminMessages.users.toast.deleted);
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  return {
    users: usersQuery.data,
    usersLoading: usersQuery.isLoading,
    createMutation,
    updateMutation,
    resetMutation,
    deleteMutation,
  };
}
