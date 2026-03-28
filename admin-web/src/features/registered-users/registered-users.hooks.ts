import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminApiEndpoints,
  type AdminPlan,
  type AdminRegisteredUser,
  type AdminRegisteredUserDetail,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import type { FilterActive, GiftSubscriptionForm } from './registered-users.schemas';
import {
  buildGiftSubscriptionPayload,
  getGiftEligiblePlans,
  getRegisteredUsersActiveParam,
} from './registered-users.utils';

interface UseRegisteredUsersDataOptions {
  activeFilter: FilterActive;
  searchSubmitted: string;
  detailUserId: string | null;
  isGiftOpen: boolean;
  onUserDisabled: () => void;
  onUserDeleted: (deletedUserId: string) => void;
  onGiftSuccess: () => void;
}

export function useRegisteredUsersData({
  activeFilter,
  searchSubmitted,
  detailUserId,
  isGiftOpen,
  onUserDisabled,
  onUserDeleted,
  onGiftSuccess,
}: UseRegisteredUsersDataOptions) {
  const queryClient = useQueryClient();
  const isActiveParam = getRegisteredUsersActiveParam(activeFilter);

  const usersQuery = useQuery({
    queryKey: ['admin', 'registered-users', isActiveParam, searchSubmitted],
    queryFn: async () => {
      const response = await adminApiEndpoints.listRegisteredUsers({
        limit: 500,
        is_active: isActiveParam,
        search: searchSubmitted || undefined,
      });
      return (response.data ?? []) as AdminRegisteredUser[];
    },
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'registered-users', 'detail', detailUserId],
    queryFn: async () => {
      if (!detailUserId) {
        return null;
      }

      const response = await adminApiEndpoints.getRegisteredUser(detailUserId);
      return (response.data ?? null) as AdminRegisteredUserDetail | null;
    },
    enabled: Boolean(detailUserId),
  });

  const plansQuery = useQuery({
    queryKey: ['admin', 'plans', 'gift-options'],
    queryFn: async () => {
      const response = await adminApiEndpoints.listPlans({ active_only: true });
      return getGiftEligiblePlans((response.data ?? []) as AdminPlan[]);
    },
    enabled: isGiftOpen,
  });

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'registered-users'] });
  };

  const invalidateDetail = () => {
    if (detailUserId) {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'registered-users', 'detail', detailUserId],
      });
    }
  };

  const setActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApiEndpoints.setRegisteredUserActive(id, { is_active }),
    onSuccess: () => {
      invalidateUsers();
      invalidateDetail();
      onUserDisabled();
      toast.success('已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '操作失败，请重试')),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteRegisteredUser(id),
    onSuccess: (_, deletedUserId) => {
      invalidateUsers();
      onUserDeleted(deletedUserId);
      toast.success('已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const giftSubscriptionMutation = useMutation({
    mutationFn: (values: GiftSubscriptionForm) =>
      adminApiEndpoints.giftSubscription(buildGiftSubscriptionPayload(values, plansQuery.data ?? [])),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      invalidateDetail();
      onGiftSuccess();
      toast.success('赠送已生效，订阅有效期已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '赠送失败，请重试')),
  });

  return {
    users: usersQuery.data,
    usersLoading: usersQuery.isLoading,
    detail: detailQuery.data,
    detailLoading: detailQuery.isLoading,
    plans: plansQuery.data ?? [],
    plansLoading: plansQuery.isLoading,
    setActiveMutation,
    deleteUserMutation,
    giftSubscriptionMutation,
  };
}
