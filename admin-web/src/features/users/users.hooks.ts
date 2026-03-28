import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApiEndpoints, type AdminRole, type AdminUser } from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import type { AdminPasswordReset, AdminUserCreate, AdminUserUpdate } from '@/lib/api/admin-client';

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
      toast.success('管理账号创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUserUpdate }) =>
      adminApiEndpoints.updateUser(id, data),
    onSuccess: () => {
      invalidateUsers();
      onUpdateSuccess();
      toast.success('管理账号已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminPasswordReset }) =>
      adminApiEndpoints.resetUserPassword(id, data),
    onSuccess: () => {
      invalidateUsers();
      onResetSuccess();
      toast.success('密码已重置');
    },
    onError: (error) => toast.error(getErrorMessage(error, '重置失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteUser(id),
    onSuccess: () => {
      invalidateUsers();
      onDeleteSuccess();
      toast.success('管理账号已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
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
