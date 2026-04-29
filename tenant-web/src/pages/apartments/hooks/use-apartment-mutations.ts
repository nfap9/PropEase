import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apartmentsApi } from '@/api/apartments';
import { useAuth } from '@/contexts/auth';
import { getErrorMessage } from '@apartment-ultra/web-shared';
import { filterEmptyStrings } from '@/utils/form';
import type { ApartmentFormData } from '@/pages/apartments/components';

export function useApartmentMutations() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApartmentFormData }) =>
      apartmentsApi.update(id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      toast.success('公寓更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apartmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      toast.success('公寓删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const updateApartment = useCallback(
    (id: string, data: ApartmentFormData, onSuccess?: () => void) => {
      updateMutation.mutate({ id, data }, { onSuccess });
    },
    [updateMutation],
  );

  const deleteApartment = useCallback(
    (id: string, onSuccess?: () => void) => {
      deleteMutation.mutate(id, { onSuccess });
    },
    [deleteMutation],
  );

  return {
    updateApartment,
    deleteApartment,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
