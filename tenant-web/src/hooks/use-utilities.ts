import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apartmentsApi, roomsApi } from '@/api/apartments';
import { utilitiesApi } from '@/api/utilities';
import { leasesApi } from '@/api/leases';
import { billsApi } from '@/api/bills';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { formatDate } from '@/utils/date';
import type { Bill, UtilityReading } from '@/types';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { getBillingDeadline, getUsage } from '@/utils/utilities';

export function useUtilitiesData() {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const { data: apartments = [] } = useQuery({
    queryKey: ['apartments'],
    queryFn: () => apartmentsApi.list(),
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ['allRooms'],
    queryFn: () => roomsApi.listAll(apartments.map((a) => a.id)),
    enabled: apartments.length > 0,
  });

  const { data: activeLeases = [] } = useQuery({
    queryKey: ['leases', true],
    queryFn: () => leasesApi.list(true),
  });

  const { data: monthUtilities = [], isLoading: monthUtilitiesLoading } = useQuery({
    queryKey: ['utilities', 'period', currentYear, currentMonth],
    queryFn: () =>
      utilitiesApi.list({
        period_year: currentYear,
        period_month: currentMonth,
      }),
  });

  const { data: latestPreviousReadings = {} } = useQuery({
    queryKey: ['utilities', 'latest-before', currentYear, currentMonth],
    queryFn: () => utilitiesApi.getLatestBefore(currentYear, currentMonth),
  });

  const { data: currentMonthBills = [] } = useQuery({
    queryKey: ['bills', currentYear, currentMonth],
    queryFn: () => billsApi.list({ year: currentYear, month: currentMonth }),
  });

  const { data: roomsMissingInitial = [] } = useQuery({
    queryKey: ['utilities', 'rooms-missing-initial'],
    queryFn: () => utilitiesApi.getRoomsMissingInitial(),
  });

  const apartmentRooms = useMemo(() => {
    return apartments
      .map((apt) => ({
        apartment: apt,
        rooms: allRooms.filter((r) => r.apartment_id === apt.id && r.status === 'occupied'),
      }))
      .filter((group) => group.rooms.length > 0);
  }, [apartments, allRooms]);

  const activeLeaseRoomIds = useMemo(() => new Set(activeLeases.map((l) => l.room_id)), [activeLeases]);

  const monthRoomsNeedInputCount = useMemo(() => {
    return allRooms.filter((r) => r.status === 'occupied' && activeLeaseRoomIds.has(r.id)).length;
  }, [activeLeaseRoomIds, allRooms]);

  const monthRoomsRecordedCount = useMemo(() => {
    const needRoomIds = new Set(
      allRooms.filter((r) => r.status === 'occupied' && activeLeaseRoomIds.has(r.id)).map((r) => r.id)
    );
    const recordedRoomIds = new Set(monthUtilities.map((u) => u.room_id));
    let cnt = 0;
    needRoomIds.forEach((id) => {
      if (recordedRoomIds.has(id)) cnt += 1;
    });
    return cnt;
  }, [activeLeaseRoomIds, monthUtilities, allRooms]);

  const monthRoomsMissingCount = Math.max(0, monthRoomsNeedInputCount - monthRoomsRecordedCount);

  const pendingUtilityBills = useMemo(() => {
    if (!activeLeases.length) return [];

    const todayTime = today.getTime();
    const currentReadingByRoom = new Map<string, UtilityReading>();
    const latestPreviousReadingByRoom = new Map<string, UtilityReading>();
    const billByLease = new Map<string, Bill>();

    for (const reading of monthUtilities) {
      currentReadingByRoom.set(reading.room_id, reading);
    }

    for (const reading of Object.values(latestPreviousReadings)) {
      latestPreviousReadingByRoom.set(reading.room_id, reading);
    }

    for (const bill of currentMonthBills) {
      billByLease.set(bill.lease_id, bill);
    }

    return activeLeases
      .filter((lease) => lease.room != null)
      .map((lease) => {
        const currentReading = currentReadingByRoom.get(lease.room_id) ?? null;
        const previousReading = latestPreviousReadingByRoom.get(lease.room_id) ?? null;
        const currentBill = billByLease.get(lease.id) ?? null;
        const deadlineDate = getBillingDeadline(lease.start_date, currentYear, currentMonth);
        const waterPrevious = currentReading?.water_previous ?? previousReading?.water_reading ?? null;
        const electricityPrevious =
          currentReading?.electricity_previous ?? previousReading?.electricity_reading ?? null;
        const waterCurrent = currentReading?.water_reading ?? null;
        const electricityCurrent = currentReading?.electricity_reading ?? null;
        const waterUsage = getUsage(waterCurrent, waterPrevious);
        const electricityUsage = getUsage(electricityCurrent, electricityPrevious);
        const computedWaterFee =
          waterUsage != null ? waterUsage * Number(lease.water_rate ?? 0) : null;
        const computedElectricityFee =
          electricityUsage != null ? electricityUsage * Number(lease.electricity_rate ?? 0) : null;
        const waterFee = currentBill ? Number(currentBill.water_amount ?? 0) : computedWaterFee;
        const electricityFee = currentBill
          ? Number(currentBill.electricity_amount ?? 0)
          : computedElectricityFee;
        const totalUtilityFee =
          waterFee != null || electricityFee != null ? Number(waterFee ?? 0) + Number(electricityFee ?? 0) : null;

        let status: 'pending_input' | 'input_overdue' | 'ready_to_bill' | 'billed' = 'pending_input';
        if (currentBill) {
          status = 'billed';
        } else if (currentReading) {
          status = 'ready_to_bill';
        } else if (todayTime > deadlineDate.getTime()) {
          status = 'input_overdue';
        }

        return {
          leaseId: lease.id,
          apartmentId: lease.room?.apartment_id ?? null,
          apartmentName: lease.room?.apartment?.name ?? '-',
          roomId: lease.room_id,
          roomNumber: lease.room?.room_number ?? '-',
          tenantName: lease.tenant?.name ?? '-',
          periodLabel: `${currentYear}年${currentMonth}月`,
          waterPrevious,
          electricityPrevious,
          waterCurrent,
          electricityCurrent,
          waterUsage,
          electricityUsage,
          waterFee,
          electricityFee,
          totalUtilityFee,
          deadline: formatDate(deadlineDate),
          status,
          currentReading:
            currentReading && lease.room
              ? {
                  ...currentReading,
                  room: currentReading.room ?? lease.room,
                }
              : currentReading,
        } satisfies PendingUtilityBillRow;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [activeLeases, latestPreviousReadings, currentMonth, currentMonthBills, currentYear, monthUtilities, today]);

  const createMutation = useCreateUtility({ queryClient });
  const updateMutation = useUpdateUtility({ queryClient });
  const batchImportMutation = useBatchImportUtility({ queryClient });

  return {
    apartments,
    allRooms,
    activeLeases,
    monthUtilities,
    latestPreviousReadings,
    currentMonthBills,
    roomsMissingInitial,
    pendingUtilityBills,
    monthRoomsNeedInputCount,
    monthRoomsRecordedCount,
    monthRoomsMissingCount,
    apartmentRooms,
    monthUtilitiesLoading,
    createMutation,
    updateMutation,
    batchImportMutation,
  };
}

interface UseCreateUtilityOptions {
  queryClient: ReturnType<typeof useQueryClient>;
}

function useCreateUtility({ queryClient }: UseCreateUtilityOptions) {
  return useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.create>[0]) =>
      utilitiesApi.create(filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('水电读数录入成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '录入失败，请重试')),
  });
}

interface UseUpdateUtilityOptions {
  queryClient: ReturnType<typeof useQueryClient>;
}

function useUpdateUtility({ queryClient }: UseUpdateUtilityOptions) {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof utilitiesApi.update>[1] }) =>
      utilitiesApi.update(id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('水电读数更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });
}

interface UseBatchImportUtilityOptions {
  queryClient: ReturnType<typeof useQueryClient>;
}

function useBatchImportUtility({ queryClient }: UseBatchImportUtilityOptions) {
  return useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.batchCreate>[0]) => utilitiesApi.batchCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('批量导入成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '批量导入失败，请重试')),
  });
}
