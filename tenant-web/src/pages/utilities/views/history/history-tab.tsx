/**
 * HistoryTab - 历史记录 Tab（自包含视图）
 *
 * 内部管理：
 * - 数据获取：apartments、leases、utilities、bills
 * - 筛选状态：apartment、lease 选择
 * - EditUtilityDialog 弹窗状态
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { HistoryFilters } from './history-filters';
import { HistoryTable } from './history-table';
import { EditUtilityDialog } from '../edit-utility-dialog';
import { apartmentsApi } from '@/api/apartments';
import { billsApi } from '@/api/bills';
import { leasesApi } from '@/api/leases';
import { utilitiesApi } from '@/api/utilities';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@apartment-ultra/web-shared';
import { useAuth } from '@/contexts/auth';
import type { UtilityReading } from '@/types';

function getMonthsInLeasePeriod(startDate: string, endDate: string | null): { year: number; month: number }[] {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  if (end < start) return [];
  const months: { year: number; month: number }[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endMonth) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

interface LeaseMonthRow {
  year: number;
  month: number;
  label: string;
  reading: UtilityReading | null;
  waterFee: number;
  electricityFee: number;
}

export function HistoryTab() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<UtilityReading | null>(null);

  // 数据获取
  const { data: apartments = [] } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId,
  });

  const { data: activeLeases = [], isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', orgId, true],
    queryFn: () => leasesApi.list(true),
    enabled: !!orgId,
  });

  // 根据选中公寓过滤租约
  const leasesInApartment = useMemo(() => {
    if (!selectedApartmentId) return [];
    return activeLeases
      .filter((lease) => lease.room?.apartment_id === selectedApartmentId)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }, [activeLeases, selectedApartmentId]);

  // 自动选择第一个租约
  useEffect(() => {
    if (!selectedApartmentId) {
      setSelectedLeaseId(null);
      return;
    }
    if (leasesInApartment.length > 0 && !selectedLeaseId) {
      setSelectedLeaseId(leasesInApartment[0]?.id ?? null);
    }
  }, [selectedApartmentId, leasesInApartment, selectedLeaseId]);

  const selectedLease = useMemo(
    () => activeLeases.find((lease) => lease.id === selectedLeaseId) ?? null,
    [activeLeases, selectedLeaseId]
  );

  const { data: leaseUtilities = [], isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities', orgId, selectedLease?.room_id],
    queryFn: () => utilitiesApi.list({ room_id: selectedLease!.room_id }),
    enabled: !!selectedLease?.room_id,
  });

  const { data: leaseBills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills', orgId, selectedLeaseId],
    queryFn: () => billsApi.list({ lease_id: selectedLeaseId! }),
    enabled: !!selectedLeaseId,
  });

  // 构建月份行数据
  const leaseMonthRows = useMemo((): LeaseMonthRow[] => {
    if (!selectedLease) return [];

    const months = getMonthsInLeasePeriod(selectedLease.start_date, selectedLease.end_date);
    const readingByPeriod = new Map<string, UtilityReading>();
    const billByPeriod = new Map<string, { water_amount: number; electricity_amount: number }>();

    for (const reading of leaseUtilities) {
      readingByPeriod.set(`${reading.period_year}-${reading.period_month}`, reading);
    }

    for (const bill of leaseBills) {
      billByPeriod.set(`${bill.bill_year}-${bill.bill_month}`, {
        water_amount: bill.water_amount ?? 0,
        electricity_amount: bill.electricity_amount ?? 0,
      });
    }

    return months.map(({ year, month }) => {
      const reading = readingByPeriod.get(`${year}-${month}`) ?? null;
      const bill = billByPeriod.get(`${year}-${month}`);
      return {
        year,
        month,
        label: `${year}年${month}月`,
        reading,
        waterFee: bill?.water_amount ?? 0,
        electricityFee: bill?.electricity_amount ?? 0,
      };
    });
  }, [leaseBills, leaseUtilities, selectedLease]);

  // 更新 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof utilitiesApi.update>[1] }) =>
      utilitiesApi.update(id, filterEmptyStrings(data) as Parameters<typeof utilitiesApi.update>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsEditOpen(false);
      setSelectedUtility(null);
      toast.success('水电读数更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const handleEdit = useCallback((reading: UtilityReading) => {
    setSelectedUtility(reading);
    setIsEditOpen(true);
  }, []);

  const handleEditSubmit = useCallback(
    (data: Record<string, unknown>) => {
      if (selectedUtility) {
        updateMutation.mutate({ id: selectedUtility.id, data });
      }
    },
    [selectedUtility, updateMutation],
  );

  return (
    <div className="space-y-4">
      <HistoryFilters
        apartments={apartments}
        leases={activeLeases}
        selectedApartmentId={selectedApartmentId}
        selectedLeaseId={selectedLeaseId}
        onApartmentChange={setSelectedApartmentId}
        onLeaseChange={setSelectedLeaseId}
        loading={leasesLoading}
      />

      {selectedLease && (
        <HistoryTable
          data={leaseMonthRows}
          loading={utilitiesLoading || billsLoading}
          onEdit={handleEdit}
        />
      )}

      {isEditOpen && selectedUtility && (
        <EditUtilityDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={handleEditSubmit}
          isPending={updateMutation.isPending}
          utility={selectedUtility}
        />
      )}
    </div>
  );
}
