import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apartmentsApi, leasesApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { filterEmptyStrings } from '@/utils/form';
import type { LeaseEditFormData } from '@/schemas/leases';

interface UseLeasesDataOptions {
  onUpdateSuccess: () => void;
  onTerminateSuccess: () => void;
  onDeleteSuccess: () => void;
}

export function useLeasesData({ onUpdateSuccess, onTerminateSuccess, onDeleteSuccess }: UseLeasesDataOptions) {
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
      onUpdateSuccess();
      toast.success('租约更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const terminateMutation = useMutation({
    mutationFn: (id: string) => leasesApi.terminate(id),
    onSuccess: () => {
      invalidateLeases();
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      onTerminateSuccess();
      toast.success('租约已终止');
    },
    onError: (error) => toast.error(getErrorMessage(error, '终止失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leasesApi.delete(id),
    onSuccess: () => {
      invalidateLeases();
      onDeleteSuccess();
      toast.success('租约删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
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
