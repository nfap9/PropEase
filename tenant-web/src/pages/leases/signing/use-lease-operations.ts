import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leasesApi } from '@/api/leases';
import { getErrorMessage } from '@propease/web-shared';
import type {
  ChangeRoomFormData,
  RenewFormData,
  UpdateTenantFormData,
  ChangeRentFormData,
  ChangeUtilityRatesFormData,
  ChangeDepositFormData,
  UpdateFeeItemsFormData,
  SettleLeaseFormData,
} from '@/types';

export function useLeaseDetail(leaseId: string) {
  return useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(leaseId),
    enabled: Boolean(leaseId),
  });
}

export function useLeaseChangeLogs(leaseId: string) {
  return useQuery({
    queryKey: ['lease-change-logs', leaseId],
    queryFn: () => leasesApi.getChangeLogs(leaseId),
    enabled: Boolean(leaseId),
  });
}

export function useChangeRoom(leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeRoomFormData) =>
      leasesApi.changeRoom(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('换房成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '换房失败')),
  });
}

export function useRenew(leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RenewFormData) =>
      leasesApi.renew(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      toast.success('续约成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '续约失败')),
  });
}

export function useUpdateTenant(leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantFormData) =>
      leasesApi.updateTenant(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      toast.success('租客更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新租客失败')),
  });
}

export function useChangeRent(leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeRentFormData) =>
      leasesApi.changeRent(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      toast.success('房租变更成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '变更房租失败')),
  });
}

export function useChangeUtilityRates(leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeUtilityRatesFormData) =>
      leasesApi.changeUtilityRates(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      toast.success('水电单价变更成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '变更水电单价失败')),
  });
}

export function useChangeDeposit(leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeDepositFormData) =>
      leasesApi.changeDeposit(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      toast.success('押金变更成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '变更押金失败')),
  });
}

export function useUpdateFeeItems(leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFeeItemsFormData) =>
      leasesApi.updateFeeItems(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      toast.success('费用项目更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新费用项目失败')),
  });
}

export function useSettleLease(leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SettleLeaseFormData) =>
      leasesApi.settleLease(leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('退租结算成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '退租结算失败')),
  });
}
