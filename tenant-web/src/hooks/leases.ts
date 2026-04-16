import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { apartmentsApi, leasesApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { filterEmptyStrings } from '@/utils/form';
import type { LeaseEditFormData } from '@/schemas/leases';

interface UseLeasesDataOptions {
  orgId?: string;
  onUpdateSuccess: () => void;
  onTerminateSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function useLeasesData({ orgId, onUpdateSuccess, onTerminateSuccess, onDeleteSuccess }: UseLeasesDataOptions) {
  const queryClient = useQueryClient();

  const apartmentsQuery = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: Boolean(orgId),
  });

  const leasesQuery = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(orgId!),
    enabled: Boolean(orgId),
  });

  const invalidateLeases = () => {
    queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LeaseEditFormData }) =>
      leasesApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      invalidateLeases();
      onUpdateSuccess();
      appToast.success('租约更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const terminateMutation = useMutation({
    mutationFn: (id: string) => leasesApi.terminate(orgId!, id),
    onSuccess: () => {
      invalidateLeases();
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      onTerminateSuccess();
      appToast.success('租约已终止');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '终止失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leasesApi.delete(orgId!, id),
    onSuccess: () => {
      invalidateLeases();
      onDeleteSuccess();
      appToast.success('租约删除成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  return {
    apartments: apartmentsQuery.data,
    leases: leasesQuery.data,
    leasesLoading: leasesQuery.isLoading,
    updateMutation,
    terminateMutation,
    deleteMutation,
  };
}
