import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import {
  adminApiEndpoints,
  type AdminPlan,
  type AdminPlanCreate,
  type AdminPlanPricingCreate,
  type AdminPlanUpdate,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import { adminMessages } from '@/lib/i18n';

interface UsePlansDataOptions {
  onCreateSuccess: () => void;
  onUpdateSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function usePlansData({ onCreateSuccess, onUpdateSuccess, onDeleteSuccess }: UsePlansDataOptions) {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      const response = await adminApiEndpoints.listPlans({ active_only: false });
      return (response.data ?? []) as AdminPlan[];
    },
  });

  const invalidatePlans = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: AdminPlanCreate) => adminApiEndpoints.createPlan(data),
    onSuccess: () => {
      invalidatePlans();
      onCreateSuccess();
      appToast.success(adminMessages.plans.toast.created);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminPlanUpdate }) => adminApiEndpoints.updatePlan(id, data),
    onSuccess: () => {
      invalidatePlans();
      onUpdateSuccess();
      appToast.success(adminMessages.plans.toast.updated);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ planId, pricing }: { planId: string; pricing: AdminPlanPricingCreate[] }) =>
      adminApiEndpoints.updatePlanPricing(planId, pricing),
    onSuccess: () => {
      invalidatePlans();
      appToast.success(adminMessages.plans.toast.pricingUpdated);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新定价失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deletePlan(id),
    onSuccess: () => {
      invalidatePlans();
      onDeleteSuccess();
      appToast.success(adminMessages.plans.toast.deleted);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  return {
    plans: plansQuery.data,
    plansLoading: plansQuery.isLoading,
    createMutation,
    updateMutation,
    updatePricingMutation,
    deleteMutation,
  };
}
