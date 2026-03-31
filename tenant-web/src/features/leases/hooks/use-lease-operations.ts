import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { leasesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import type {
  ChangeRoomFormData,
  RenewFormData,
  UpdateTenantFormData,
  ChangeRentFormData,
  ChangeUtilityRatesFormData,
  ChangeDepositFormData,
  UpdateFeeItemsFormData,
  SettleLeaseFormData,
} from '../schemas/lease-operations.schemas';

export function useLeaseDetail(orgId: string, leaseId: string) {
  return useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(orgId, leaseId),
    enabled: Boolean(orgId) && Boolean(leaseId),
  });
}

export function useLeaseChangeLogs(orgId: string, leaseId: string) {
  return useQuery({
    queryKey: ['lease-change-logs', leaseId],
    queryFn: () => leasesApi.getChangeLogs(orgId, leaseId),
    enabled: Boolean(orgId) && Boolean(leaseId),
  });
}

export function useChangeRoom(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeRoomFormData) =>
      leasesApi.changeRoom(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      appToast.success('换房成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '换房失败')),
  });
}

export function useRenew(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RenewFormData) =>
      leasesApi.renew(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('续约成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '续约失败')),
  });
}

export function useUpdateTenant(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantFormData) =>
      leasesApi.updateTenant(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('租客更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新租客失败')),
  });
}

export function useChangeRent(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeRentFormData) =>
      leasesApi.changeRent(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('房租变更成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '变更房租失败')),
  });
}

export function useChangeUtilityRates(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeUtilityRatesFormData) =>
      leasesApi.changeUtilityRates(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('水电单价变更成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '变更水电单价失败')),
  });
}

export function useChangeDeposit(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeDepositFormData) =>
      leasesApi.changeDeposit(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('押金变更成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '变更押金失败')),
  });
}

export function useUpdateFeeItems(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFeeItemsFormData) =>
      leasesApi.updateFeeItems(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('费用项目更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新费用项目失败')),
  });
}

export function useSettleLease(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SettleLeaseFormData) =>
      leasesApi.settleLease(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      appToast.success('退租结算成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '退租结算失败')),
  });
}
