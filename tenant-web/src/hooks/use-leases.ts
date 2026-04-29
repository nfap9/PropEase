import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apartmentsApi } from '@/api/apartments';
import { leasesApi } from '@/api/leases';
import { getErrorMessage } from '@apartment-ultra/web-shared';
import { filterEmptyStrings } from '@/utils/form';
import type { LeaseEditFormData, LeaseFiltersState } from '@/types';
import type { Lease } from '@/types';

/**
 * 从 Lease 对象构建表单初始值
 * 纯函数，职责清晰：只做数据转换，不涉及 API 调用或状态管理
 */
export function buildLeaseEditFormValues(lease: Lease): Partial<LeaseEditFormData> {
  return {
    room_id: lease.room_id ?? '',
    tenant_id: lease.tenant_id ?? '',
    start_date: lease.start_date ?? '',
    end_date: lease.end_date ?? '',
    monthly_rent: lease.monthly_rent ?? 0,
    deposit: lease.deposit ?? 0,
    water_rate: lease.water_rate ?? 0,
    electricity_rate: lease.electricity_rate ?? 0,
    notes: lease.notes ?? '',
  };
}

/** 从 Lease 对象提取用于展示的信息（房间、租客名称） */
export function getLeaseDisplayInfo(lease: Lease) {
  return {
    roomDisplay: lease.room
      ? `${lease.room.apartment?.name || ''} - ${lease.room.room_number}`
      : '',
    tenantDisplay: lease.tenant?.name || '',
  };
}

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

export function filterLeases(leases: Lease[] | undefined, filters: LeaseFiltersState) {
  if (!leases) {
    return [];
  }

  return leases.filter((lease) => {
    if (filters.apartmentId && lease.room?.apartment_id !== filters.apartmentId) {
      return false;
    }

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const roomNumber = lease.room?.room_number?.toLowerCase() ?? '';
      const tenantName = lease.tenant?.name?.toLowerCase() ?? '';
      const tenantPhone = lease.tenant?.phone ?? '';
      const tenantIdCard = lease.tenant?.id_card ?? '';
      const matchesKeyword =
        roomNumber.includes(keyword) ||
        tenantName.includes(keyword) ||
        tenantPhone.includes(keyword) ||
        tenantIdCard.includes(keyword);

      if (!matchesKeyword) {
        return false;
      }
    }

    if (filters.startDateFrom) {
      const startDate = lease.start_date.slice(0, 10);
      if (startDate < filters.startDateFrom) {
        return false;
      }
    }

    if (filters.startDateTo) {
      const startDate = lease.start_date.slice(0, 10);
      if (startDate > filters.startDateTo) {
        return false;
      }
    }

    const endDate = lease.end_date ? lease.end_date.slice(0, 10) : null;
    if (filters.endDateFrom) {
      if (!endDate || endDate < filters.endDateFrom) {
        return false;
      }
    }

    if (filters.endDateTo) {
      if (!endDate || endDate > filters.endDateTo) {
        return false;
      }
    }

    return true;
  });
}
