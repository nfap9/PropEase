import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminApiEndpoints,
  type ServicePricingCreate,
  type ServiceProduct,
  type ServiceProductCreate,
  type ServiceProductUpdate,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';

interface UseServicePricingDataOptions {
  onCreateSuccess: () => void;
  onUpdateSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function useServicePricingData({
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: UseServicePricingDataOptions) {
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ['admin', 'service-products'],
    queryFn: async () => {
      const response = await adminApiEndpoints.listServiceProducts({ is_active: undefined });
      return (response.data ?? []) as ServiceProduct[];
    },
  });

  const invalidateServices = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'service-products'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: ServiceProductCreate) => adminApiEndpoints.createServiceProduct(data),
    onSuccess: () => {
      invalidateServices();
      onCreateSuccess();
      toast.success('服务产品创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceProductUpdate }) =>
      adminApiEndpoints.updateServiceProduct(id, data),
    onSuccess: () => {
      invalidateServices();
      onUpdateSuccess();
      toast.success('服务产品已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, pricing }: { id: string; pricing: ServicePricingCreate[] }) =>
      adminApiEndpoints.updateServiceProductPricing(id, { pricing }),
    onSuccess: () => {
      invalidateServices();
      toast.success('定价已更新');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新定价失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiEndpoints.deleteServiceProduct(id),
    onSuccess: () => {
      invalidateServices();
      onDeleteSuccess();
      toast.success('服务产品已删除');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  return {
    services: servicesQuery.data,
    servicesLoading: servicesQuery.isLoading,
    createMutation,
    updateMutation,
    updatePricingMutation,
    deleteMutation,
  };
}

