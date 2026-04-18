import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminApiEndpoints,
  type AdminPlan,
  type AdminRegisteredUser,
  type AdminRegisteredUserDetail,
} from '@/api/admin-client';
import { getErrorMessage } from '@/utils/error';
import type { FilterActive, GiftSubscriptionForm } from '@/schemas/registered-users';
import {
  buildGiftSubscriptionPayload,
  getGiftEligiblePlans,
  getRegisteredUsersActiveParam,
} from '@/utils/registered-users';
import { adminMessages } from '@/i18n';

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
      toast.success(adminMessages.registeredUsers.toast.updated);
    },
    onError: (error) => toast.error(getErrorMessage(error, adminMessages.registeredUsers.errors.action)),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteRegisteredUser(id),
    onSuccess: (_, deletedUserId) => {
      invalidateUsers();
      onUserDeleted(deletedUserId);
      toast.success(adminMessages.registeredUsers.toast.deleted);
    },
    onError: (error) => toast.error(getErrorMessage(error, adminMessages.registeredUsers.errors.delete)),
  });

  const giftSubscriptionMutation = useMutation({
    mutationFn: (values: GiftSubscriptionForm) =>
      adminApiEndpoints.giftSubscription(buildGiftSubscriptionPayload(values, plansQuery.data ?? [])),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      invalidateDetail();
      onGiftSuccess();
      toast.success(adminMessages.registeredUsers.toast.gifted);
    },
    onError: (error) => toast.error(getErrorMessage(error, adminMessages.registeredUsers.errors.gift)),
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
