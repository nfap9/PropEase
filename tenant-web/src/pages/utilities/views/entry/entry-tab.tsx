/**
 * EntryTab - 本月录入 Tab（自包含视图）
 *
 * 内部管理：
 * - 数据获取：apartments、rooms、leases、utilities 等
 * - CreateUtilityDialog 弹窗状态
 * - EditUtilityDialog 弹窗状态
 * - BatchImportDialog 弹窗状态
 * - CreateUtilityDialog 的 preset 状态
 */
import { useCallback, useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from 'antd';
import { Plus, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { RoomMissingInitialReading } from '@/types';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { MonthStatsCard } from './month-stats-card';
import { PendingBillTable } from './pending-bill-table';
import { MissingInitialWarning } from './missing-initial-warning';
import { CreateUtilityDialog } from '../create-utility-dialog';
import { EditUtilityDialog } from '../edit-utility-dialog';
import { BatchImportDialog } from '../batch-import-dialog';
import { ExportTemplateDialog } from '../export-template-dialog';
import { apartmentsApi, roomsApi } from '@/api/apartments';
import { leasesApi } from '@/api/leases';
import { utilitiesApi } from '@/api/utilities';
import { billsApi } from '@/api/bills';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { useLoading } from '@/hooks/use-loading';
import { useAuth } from '@/contexts/auth';

interface EntryTabProps {
  onMissingEntry: (room: RoomMissingInitialReading) => void;
}

export function EntryTab({ onMissingEntry }: EntryTabProps) {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // 数据获取
  const { result: apartmentsResult } = useLoading(() => apartmentsApi.list(), {
    queryKey: ['apartments'],
    auto: true,
  });
  const apartments = apartmentsResult.data ?? [];

  const apartmentIds = useMemo(() => apartments.map((a) => a.id), [apartments]);
  const { result: allRoomsResult } = useLoading(() => roomsApi.listAll(apartmentIds), {
    queryKey: ['allRooms', apartmentIds.join(',')],
    auto: apartmentIds.length > 0,
  });
  const allRooms = allRoomsResult.data ?? [];

  const { result: activeLeasesResult } = useLoading(() => leasesApi.list(true), {
    queryKey: ['leases', 'active'],
    auto: true,
  });
  const activeLeases = activeLeasesResult.data ?? [];

  const { result: monthUtilitiesResult } = useLoading(
    () => utilitiesApi.list({ period_year: currentYear, period_month: currentMonth }),
    { queryKey: ['utilities', 'period', String(currentYear), String(currentMonth)], auto: true }
  );
  const monthUtilities = monthUtilitiesResult.data ?? [];

  const { result: latestPreviousResult } = useLoading(
    () => utilitiesApi.getLatestBefore(currentYear, currentMonth),
    { queryKey: ['utilities', 'latest-before', String(currentYear), String(currentMonth)], auto: true }
  );
  const latestPreviousReadings = latestPreviousResult.data ?? {};

  const { result: roomsMissingResult } = useLoading(() => utilitiesApi.getRoomsMissingInitial(), {
    queryKey: ['utilities', 'rooms-missing-initial'],
    auto: true,
  });
  const roomsMissingInitial = roomsMissingResult.data ?? [];

  const { result: currentMonthBillsResult } = useLoading(
    () => billsApi.list({ year: currentYear, month: currentMonth }),
    { queryKey: ['bills', String(currentYear), String(currentMonth)], auto: true }
  );
  const currentMonthBills = currentMonthBillsResult.data ?? [];

  // 待处理账单计算
  const { pendingUtilityBills, monthRoomsNeedInputCount, monthRoomsRecordedCount } = useMemo(() => {
    if (!activeLeases.length) {
      return { pendingUtilityBills: [], monthRoomsNeedInputCount: 0, monthRoomsRecordedCount: 0 };
    }

    const todayTime = today.getTime();
    const currentReadingByRoom = new Map<string, (typeof monthUtilities)[0]>();
    const latestPreviousReadingByRoom = new Map<string, (typeof monthUtilities)[0]>();
    const billByLease = new Map<string, (typeof currentMonthBills)[0]>();

    for (const reading of monthUtilities) {
      currentReadingByRoom.set(reading.room_id, reading);
    }
    for (const reading of Object.values(latestPreviousReadings)) {
      latestPreviousReadingByRoom.set(reading.room_id, reading);
    }
    for (const bill of currentMonthBills) {
      billByLease.set(bill.lease_id, bill);
    }

    const activeLeaseRoomIds = new Set(activeLeases.map((l) => l.room_id));
    const monthRoomsNeedInputCount = allRooms.filter(
      (r) => r.status === 'occupied' && activeLeaseRoomIds.has(r.id)
    ).length;

    const needRoomIds = new Set(activeLeases.filter((l) => l.room != null).map((l) => l.room_id));
    const recordedRoomIds = new Set(monthUtilities.map((u) => u.room_id));
    const monthRoomsRecordedCount = [...needRoomIds].filter((id) => recordedRoomIds.has(id)).length;

    const pendingUtilityBills = activeLeases
      .filter((lease) => lease.room != null)
      .map((lease) => {
        const currentReading = currentReadingByRoom.get(lease.room_id) ?? null;
        const previousReading = latestPreviousReadingByRoom.get(lease.room_id) ?? null;
        const currentBill = billByLease.get(lease.id) ?? null;
        const deadlineDate = new Date(lease.start_date);
        deadlineDate.setMonth(deadlineDate.getMonth() + 1);
        deadlineDate.setDate(10);
        const waterPrevious = currentReading?.water_previous ?? previousReading?.water_reading ?? null;
        const electricityPrevious = currentReading?.electricity_previous ?? previousReading?.electricity_reading ?? null;
        const waterCurrent = currentReading?.water_reading ?? null;
        const electricityCurrent = currentReading?.electricity_reading ?? null;
        const waterUsage = waterCurrent != null && waterPrevious != null ? waterCurrent - waterPrevious : null;
        const electricityUsage = electricityCurrent != null && electricityPrevious != null ? electricityCurrent - electricityPrevious : null;
        const computedWaterFee = waterUsage != null ? waterUsage * Number(lease.water_rate ?? 0) : null;
        const computedElectricityFee = electricityUsage != null ? electricityUsage * Number(lease.electricity_rate ?? 0) : null;
        const waterFee = currentBill ? Number(currentBill.water_amount ?? 0) : computedWaterFee;
        const electricityFee = currentBill ? Number(currentBill.electricity_amount ?? 0) : computedElectricityFee;
        const totalUtilityFee = waterFee != null || electricityFee != null ? Number(waterFee ?? 0) + Number(electricityFee ?? 0) : null;

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
          deadline: deadlineDate.toLocaleDateString('zh-CN'),
          status,
          currentReading: currentReading && lease.room ? { ...currentReading, room: currentReading.room ?? lease.room } : currentReading,
        } satisfies PendingUtilityBillRow;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return { pendingUtilityBills, monthRoomsNeedInputCount, monthRoomsRecordedCount };
  }, [activeLeases, allRooms, monthUtilities, latestPreviousReadings, currentMonthBills, today]);

  const readyToBillCount = pendingUtilityBills.filter((b) => b.status === 'ready_to_bill').length;
  const overdueCount = pendingUtilityBills.filter((b) => b.status === 'input_overdue').length;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.create>[0]) => utilitiesApi.create(filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('水电读数录入成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '录入失败，请重试')),
  });

  const updateMutation = useMutation({
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

  const batchImportMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.batchCreate>[0]) => utilitiesApi.batchCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      toast.success('批量导入成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '批量导入失败，请重试')),
  });

  // 公寓房间分组
  const apartmentRooms = useMemo(() => {
    return apartments
      .map((apt) => ({
        apartment: apt,
        rooms: allRooms.filter((r) => r.apartment_id === apt.id && r.status === 'occupied'),
      }))
      .filter((group) => group.rooms.length > 0);
  }, [apartments, allRooms]);

  // 弹窗状态
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isExportTemplateOpen, setIsExportTemplateOpen] = useState(false);
  const [editingUtility, setEditingUtility] = useState<PendingUtilityBillRow['currentReading']>(null);

  // Create preset 状态
  const [createPreset, setCreatePreset] = useState<{
    apartmentId: string;
    roomId: string;
    periodYear: number;
    periodMonth: number;
    readingDate: string;
    waterPrevious?: number | null;
    electricityPrevious?: number | null;
  } | null>(null);

  const handleQuickEntry = useCallback((record: PendingUtilityBillRow) => {
    setCreatePreset({
      apartmentId: record.apartmentId ?? '',
      roomId: record.roomId,
      periodYear: currentYear,
      periodMonth: currentMonth,
      readingDate: today.toISOString().split('T')[0],
      waterPrevious: record.waterPrevious,
      electricityPrevious: record.electricityPrevious,
    });
    setIsCreateOpen(true);
  }, [currentYear, currentMonth, today]);

  const handleQuickUpdate = useCallback((record: PendingUtilityBillRow) => {
    setEditingUtility(record.currentReading);
  }, []);

  const handleAdd = useCallback(() => {
    setCreatePreset(null);
    setIsCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(
    (data: Record<string, unknown>) => {
      createMutation.mutate(data, { onSuccess: () => setIsCreateOpen(false) });
    },
    [createMutation],
  );

  const handleEditSubmit = useCallback(
    (data: Record<string, unknown>) => {
      if (editingUtility) {
        updateMutation.mutate({ id: editingUtility.id, data }, { onSuccess: () => setEditingUtility(null) });
      }
    },
    [editingUtility, updateMutation],
  );

  const handleBatchImport = useCallback(
    (data: Parameters<typeof utilitiesApi.batchCreate>[0]) => {
      batchImportMutation.mutate(data, { onSuccess: () => setIsBatchImportOpen(false) });
    },
    [batchImportMutation],
  );

  return (
    <>
      <div className="space-y-4">
        <MonthStatsCard
          recordedCount={monthRoomsRecordedCount ?? 0}
          totalCount={monthRoomsNeedInputCount ?? 0}
          missingCount={Math.max(0, (monthRoomsNeedInputCount ?? 0) - (monthRoomsRecordedCount ?? 0))}
          readyToBillCount={readyToBillCount}
          overdueCount={overdueCount}
        />

        <div className="flex gap-2">
          <Button onClick={() => setIsExportTemplateOpen(true)} icon={<Download className="h-4 w-4" />}>
            导出模版
          </Button>
          <Button onClick={() => setIsBatchImportOpen(true)} icon={<Upload className="h-4 w-4" />}>
            批量导入
          </Button>
          <Button type="primary" onClick={handleAdd} icon={<Plus className="h-4 w-4" />}>
            录入读数
          </Button>
        </div>

        <PendingBillTable data={pendingUtilityBills} onEntry={handleQuickEntry} onUpdate={handleQuickUpdate} />

        <MissingInitialWarning rooms={roomsMissingInitial} onEntry={onMissingEntry} />
      </div>

      {/* Create Dialog */}
      <CreateUtilityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateSubmit}
        isPending={createMutation.isPending}
        apartmentRooms={apartmentRooms}
        orgId={orgId ?? ''}
        preset={createPreset}
      />

      {/* Edit Dialog */}
      {editingUtility && (
        <EditUtilityDialog
          open={!!editingUtility}
          onOpenChange={(open) => !open && setEditingUtility(null)}
          onSubmit={handleEditSubmit}
          isPending={updateMutation.isPending}
          utility={editingUtility}
        />
      )}

      {/* Batch Import Dialog */}
      <BatchImportDialog
        open={isBatchImportOpen}
        onOpenChange={setIsBatchImportOpen}
        onImport={handleBatchImport}
        isPending={batchImportMutation.isPending}
        allRooms={allRooms}
        apartments={apartments}
      />

      {/* Export Template Dialog */}
      <ExportTemplateDialog open={isExportTemplateOpen} onOpenChange={setIsExportTemplateOpen} />
    </>
  );
}
