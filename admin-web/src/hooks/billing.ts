
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminApiEndpoints,
  type BillingOrderListParams,
  type AdminPlanCreate,
  type AdminPlanUpdate,
  type AdminPlanPricingCreate,
} from '@/api/admin-client';
import { getErrorMessage } from '@apartment-ultra/web-shared';

/**
 * 套餐管理 Hooks
 */
export function usePlans(params?: { active_only?: boolean }) {
  const query = useQuery({
    queryKey: ['admin', 'billing', 'plans', params],
    queryFn: async () => {
      const response = await adminApiEndpoints.listPlans(params);
      return response.data;
    },
  });

  return {
    plans: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  };
}

export function usePlan(id: string) {
  const query = useQuery({
    queryKey: ['admin', 'billing', 'plan', id],
    queryFn: async () => {
      const response = await adminApiEndpoints.getPlan(id);
      return response.data;
    },
    enabled: !!id,
  });

  return {
    plan: query.data,
    loading: query.isLoading,
    error: query.error,
  };
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminPlanCreate) => adminApiEndpoints.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'plans'] });
      toast.success('套餐创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminPlanUpdate }) =>
      adminApiEndpoints.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'plans'] });
      toast.success('套餐更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'plans'] });
      toast.success('套餐删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });
}

export function useUpdatePlanPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, pricing }: { planId: string; pricing: AdminPlanPricingCreate[] }) =>
      adminApiEndpoints.updatePlanPricing(planId, pricing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'plans'] });
      toast.success('价格设置已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });
}

/**
 * 订单列表 Hooks
 */
export function useBillingOrders(params?: BillingOrderListParams) {
  const query = useQuery({
    queryKey: ['admin', 'billing', 'orders', params],
    queryFn: async () => {
      const response = await adminApiEndpoints.listBillingOrders(params);
      return response.data;
    },
  });

  return {
    orders: query.data?.orders ?? [],
    total: query.data?.total ?? 0,
    loading: query.isLoading,
    error: query.error,
  };
}

export function useBillingOrder(id: string) {
  const query = useQuery({
    queryKey: ['admin', 'billing', 'order', id],
    queryFn: async () => {
      const response = await adminApiEndpoints.getBillingOrder(id);
      return response.data;
    },
    enabled: !!id,
  });

  return {
    order: query.data,
    loading: query.isLoading,
    error: query.error,
  };
}


