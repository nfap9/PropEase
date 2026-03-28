import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import {
  adminApiEndpoints,
  type ServiceProduct,
  type StorefrontConfig,
  type StorefrontConfigCreate,
  type StorefrontConfigUpdate,
  type StorefrontItemCreate,
  type StorefrontItemUpdate,
} from '@/lib/api/admin-client';
import { getErrorMessage } from '@/lib/utils/error';
import type { StorefrontForm } from './storefront.schemas';
import { adminMessages } from '@/lib/i18n';

interface UseStorefrontDataOptions {
  selectedStorefrontForItems: StorefrontConfig | null;
  onStorefrontCreated: () => void;
  onStorefrontUpdated: () => void;
  onStorefrontDeleted: () => void;
  onItemCreated: () => void;
  onItemUpdated: () => void;
  onItemDeleted: () => void;
}

export function useStorefrontData({
  selectedStorefrontForItems,
  onStorefrontCreated,
  onStorefrontUpdated,
  onStorefrontDeleted,
  onItemCreated,
  onItemUpdated,
  onItemDeleted,
}: UseStorefrontDataOptions) {
  const queryClient = useQueryClient();

  const storefrontsQuery = useQuery({
    queryKey: ['admin', 'storefronts'],
    queryFn: async () => {
      const response = await adminApiEndpoints.listStorefronts({ is_active: undefined });
      return (response.data ?? []) as StorefrontConfig[];
    },
  });

  const serviceProductsQuery = useQuery({
    queryKey: ['admin', 'service-products'],
    queryFn: async () => {
      const response = await adminApiEndpoints.listServiceProducts({ is_active: true });
      return (response.data ?? []) as ServiceProduct[];
    },
  });

  const storefrontDetailQuery = useQuery({
    queryKey: ['admin', 'storefronts', selectedStorefrontForItems?.id],
    queryFn: async () => {
      if (!selectedStorefrontForItems) {
        return null;
      }
      const response = await adminApiEndpoints.getStorefront(selectedStorefrontForItems.id);
      return response.data as StorefrontConfig;
    },
    enabled: Boolean(selectedStorefrontForItems),
  });

  const invalidateStorefrontList = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'storefronts'] });
  };

  const invalidateStorefrontDetail = () => {
    queryClient.invalidateQueries({
      queryKey: ['admin', 'storefronts', selectedStorefrontForItems?.id],
    });
  };

  const createStorefrontMutation = useMutation({
    mutationFn: (data: StorefrontForm) => adminApiEndpoints.createStorefront(data as StorefrontConfigCreate),
    onSuccess: () => {
      invalidateStorefrontList();
      onStorefrontCreated();
      appToast.success(adminMessages.storefront.toast.created);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateStorefrontMutation = useMutation({
    mutationFn: ({ storefrontId, data }: { storefrontId: string; data: StorefrontConfigUpdate }) =>
      adminApiEndpoints.updateStorefront(storefrontId, data),
    onSuccess: () => {
      invalidateStorefrontList();
      onStorefrontUpdated();
      appToast.success(adminMessages.storefront.toast.updated);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteStorefrontMutation = useMutation({
    mutationFn: (storefrontId: string) => adminApiEndpoints.deleteStorefront(storefrontId),
    onSuccess: () => {
      invalidateStorefrontList();
      onStorefrontDeleted();
      appToast.success(adminMessages.storefront.toast.deleted);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ storefrontId, data }: { storefrontId: string; data: StorefrontItemCreate }) =>
      adminApiEndpoints.addStorefrontItem(storefrontId, data),
    onSuccess: () => {
      invalidateStorefrontDetail();
      onItemCreated();
      appToast.success(adminMessages.storefront.toast.itemCreated);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '添加失败，请重试')),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      storefrontId,
      itemId,
      data,
    }: {
      storefrontId: string;
      itemId: string;
      data: StorefrontItemUpdate;
    }) => adminApiEndpoints.updateStorefrontItem(storefrontId, itemId, data),
    onSuccess: () => {
      invalidateStorefrontDetail();
      onItemUpdated();
      appToast.success(adminMessages.storefront.toast.itemUpdated);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ storefrontId, itemId }: { storefrontId: string; itemId: string }) =>
      adminApiEndpoints.deleteStorefrontItem(storefrontId, itemId),
    onSuccess: () => {
      invalidateStorefrontDetail();
      onItemDeleted();
      appToast.success(adminMessages.storefront.toast.itemDeleted);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  return {
    storefronts: storefrontsQuery.data,
    storefrontsLoading: storefrontsQuery.isLoading,
    serviceProducts: serviceProductsQuery.data,
    storefrontDetail: storefrontDetailQuery.data,
    createStorefrontMutation,
    updateStorefrontMutation,
    deleteStorefrontMutation,
    addItemMutation,
    updateItemMutation,
    deleteItemMutation,
  };
}
