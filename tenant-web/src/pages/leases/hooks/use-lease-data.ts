import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apartmentsApi } from '@/api/apartments';
import { leasesApi } from '@/api/leases';
import { getErrorMessage } from '@propease/web-shared';
import { filterEmptyStrings } from '@/utils/form';
import type { LeaseEditFormData } from '@/types';

export function useLeasesData() {
  const queryClient = useQueryClient();

  const apartmentsQuery = useQuery({
    queryKey: ['apartments'],
    queryFn: () => apartmentsApi.list(),
  });

  const leasesQuery = useQuery({
    queryKey: ['leases'],
    queryFn: () => leasesApi.list(),
  });

  const invalidateLeases = () => {
    queryClient.invalidateQueries({ queryKey: ['leases'] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaseEditFormData }) =>
      leasesApi.update(id, filterEmptyStrings(data)),
    onSuccess: () => {
      invalidateLeases();
      toast.success('租约更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const terminateMutation = useMutation({
    mutationFn: (id: string) => leasesApi.terminate(id),
    onSuccess: () => {
      invalidateLeases();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('租约已终止');
    },
    onError: (error) => toast.error(getErrorMessage(error, '终止失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leasesApi.delete(id),
    onSuccess: () => {
      invalidateLeases();
      toast.success('租约删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const updateLease = useCallback(
    (id: string, data: LeaseEditFormData, onSuccess?: () => void) => {
      updateMutation.mutate({ id, data }, { onSuccess });
    },
    [updateMutation],
  );

  const terminateLease = useCallback(
    (id: string, onSuccess?: () => void) => {
      terminateMutation.mutate(id, { onSuccess });
    },
    [terminateMutation],
  );

  const deleteLease = useCallback(
    (id: string, onSuccess?: () => void) => {
      deleteMutation.mutate(id, { onSuccess });
    },
    [deleteMutation],
  );

  return {
    apartments: apartmentsQuery.data,
    leases: leasesQuery.data,
    leasesLoading: leasesQuery.isLoading,
    updateLease,
    terminateLease,
    deleteLease,
    isUpdating: updateMutation.isPending,
    isTerminating: terminateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
