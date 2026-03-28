import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminApiEndpoints,
  type AdminPlan,
  type AdminPlanCreate,
  type AdminPlanPricingCreate,
  type AdminPlanUpdate,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';

interface UsePlansDataOptions {
  onCreateSuccess: () => void;
  onUpdateSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function usePlansData({
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: UsePlansDataOptions) {
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
      toast.success('服务创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminPlanUpdate }) =>
      adminApiEndpoints.updatePlan(id, data),
    onSuccess: () => {
      invalidatePlans();
      onUpdateSuccess();
      toast.success('服务已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ planId, pricing }: { planId: string; pricing: AdminPlanPricingCreate[] }) =>
      adminApiEndpoints.updatePlanPricing(planId, pricing),
    onSuccess: () => {
      invalidatePlans();
      toast.success('周期定价已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新定价失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deletePlan(id),
    onSuccess: () => {
      invalidatePlans();
      onDeleteSuccess();
      toast.success('服务已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
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
