'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@/components/common/data-table';
import { apartmentsApi, roomsApi, utilitiesApi, leasesApi, billsApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { formatDate } from '@/lib/date-utils';
import { useAuth } from '@/lib/auth/context';
import { Plus, Upload, Download, Building2, AlertCircle } from 'lucide-react';
import type { Bill, RoomMissingInitialReading, UtilityReading } from '@/types';
import { UtilityHistoryPanel } from './components/utility-history-panel';

const CreateUtilityDialog = dynamic(
  () => import('./components/CreateUtilityDialog').then((mod) => mod.CreateUtilityDialog),
  { ssr: false }
);

const ExportTemplateDialog = dynamic(
  () => import('./components/ExportTemplateDialog').then((mod) => mod.ExportTemplateDialog),
  { ssr: false }
);

const BatchImportDialog = dynamic(() => import('./components/BatchImportDialog').then((mod) => mod.BatchImportDialog), {
  ssr: false,
});

const InitialReadingDialog = dynamic(
  () => import('@/components/common/initial-reading-dialog').then((mod) => mod.InitialReadingDialog),
  { ssr: false }
);

const EditUtilityDialog = dynamic(
  () => import('./components/EditUtilityDialog').then((mod) => mod.EditUtilityDialog),
  { ssr: false }
);

// 注意: 实际使用时从 testids 导入 UTILITIES 常量
const UTILITIES = {
  HEADING: 'utilities-heading',
  ENTRY_BUTTON: 'utilities-entry-btn',
  LIST: 'utilities-list',
  EXPORT_TEMPLATE_BUTTON: 'utilities-export-template-button',
  IMPORT_BUTTON: 'utilities-import-button',
  OVERVIEW_CARD: 'utilities-overview-card',
  PENDING_BILLS_CARD: 'utilities-pending-bills-card',
  MISSING_INITIAL_CARD: 'utilities-missing-initial-card',
} as const;

// 从签约日期提取出账日（每月几号出账）
function getBillingDay(dateStr: string): number {
  return new Date(dateStr).getDate();
}

type UtilityBillStatus = 'pending_input' | 'input_overdue' | 'ready_to_bill' | 'billed';

const UTILITY_BILL_STATUS_CONFIG: Record<
  UtilityBillStatus,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'info' }
> = {
  pending_input: { label: '待录入', variant: 'warning' },
  input_overdue: { label: '录入逾期', variant: 'destructive' },
  ready_to_bill: { label: '待出账', variant: 'info' },
  billed: { label: '已出账', variant: 'success' },
};

function getPeriodKey(year: number, month: number) {
  return year * 12 + month;
}

function getBillingDeadline(startDate: string, year: number, month: number) {
  const billingDay = getBillingDay(startDate);
  const daysInMonth = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(billingDay, daysInMonth));
}

function getUsage(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null) return null;
  return current - previous;
}

function formatMeterValue(value: number | null | undefined) {
  return value == null ? '—' : Number(value).toFixed(2);
}

function formatCurrencyValue(value: number | null | undefined) {
  return value == null ? '—' : `¥${value.toFixed(2)}`;
}

interface PendingUtilityBillRow {
  leaseId: string;
  apartmentId: string | null;
  apartmentName: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  periodLabel: string;
  waterPrevious: number | null;
  electricityPrevious: number | null;
  waterCurrent: number | null;
  electricityCurrent: number | null;
  waterUsage: number | null;
  electricityUsage: number | null;
  waterFee: number | null;
  electricityFee: number | null;
  totalUtilityFee: number | null;
  deadline: string;
  status: UtilityBillStatus;
  currentReading: UtilityReading | null;
}

const pendingUtilityBillColumns: ColumnDef<PendingUtilityBillRow>[] = [
  {
    id: 'room',
    header: '房间',
    size: 180,
    minSize: 150,
    meta: { sticky: 'left' as const },
    cell: ({ row }) => (
      <div>
        <div>{row.original.apartmentName}</div>
        <div className="font-medium">{row.original.roomNumber}</div>
      </div>
    ),
  },
  {
    accessorKey: 'tenantName',
    header: '租客',
    size: 100,
    minSize: 80,
  },
  {
    accessorKey: 'periodLabel',
    header: '账期',
    size: 100,
    minSize: 80,
  },
  {
    id: 'previousReadings',
    header: '上月水电读数',
    size: 120,
    minSize: 100,
    cell: ({ row }) => (
      <div>
        <div>水 {formatMeterValue(row.original.waterPrevious)}</div>
        <div className="text-muted-foreground">电 {formatMeterValue(row.original.electricityPrevious)}</div>
      </div>
    ),
  },
  {
    id: 'currentReadings',
    header: '本月水电读数',
    size: 120,
    minSize: 100,
    cell: ({ row }) => (
      <div>
        <div>水 {formatMeterValue(row.original.waterCurrent)}</div>
        <div className="text-muted-foreground">电 {formatMeterValue(row.original.electricityCurrent)}</div>
      </div>
    ),
  },
  {
    id: 'usage',
    header: '水电用量',
    size: 120,
    minSize: 100,
    cell: ({ row }) => (
      <div>
        <div>水 {formatMeterValue(row.original.waterUsage)}</div>
        <div className="text-muted-foreground">电 {formatMeterValue(row.original.electricityUsage)}</div>
      </div>
    ),
  },
  {
    id: 'fees',
    header: '水电费',
    size: 140,
    minSize: 120,
    cell: ({ row }) => (
      <div>
        <div>{formatCurrencyValue(row.original.totalUtilityFee)}</div>
        <div className="text-muted-foreground">
          水 {formatCurrencyValue(row.original.waterFee)} / 电 {formatCurrencyValue(row.original.electricityFee)}
        </div>
      </div>
    ),
  },
  {
    id: 'status',
    header: '状态',
    size: 100,
    minSize: 80,
    cell: ({ row }) => {
      const statusConfig = UTILITY_BILL_STATUS_CONFIG[row.original.status];
      return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
    },
  },
  {
    accessorKey: 'deadline',
    header: '出账截止时间',
    size: 140,
    minSize: 120,
  },
  {
    id: 'actions',
    header: '操作',
    size: 100,
    minSize: 80,
    meta: { sticky: 'right' as const },
  },
];

export default function UtilitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'entry';

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExportTemplateOpen, setIsExportTemplateOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [initialReadingRoom, setInitialReadingRoom] = useState<RoomMissingInitialReading | null>(null);
  const [createPreset, setCreatePreset] = useState<{
    apartmentId: string;
    roomId: string;
    periodYear: number;
    periodMonth: number;
    readingDate: string;
    waterPrevious?: number | null;
    electricityPrevious?: number | null;
  } | null>(null);
  const [editingUtility, setEditingUtility] = useState<UtilityReading | null>(null);

  const columns = useMemo<ColumnDef<PendingUtilityBillRow>[]>(() => {
    const baseColumns: ColumnDef<PendingUtilityBillRow>[] = pendingUtilityBillColumns.map((col) => {
      if (col.id === 'actions') {
        return {
          ...col,
          cell: ({ row }) => {
            const { currentReading, apartmentId, roomId, waterPrevious, electricityPrevious } = row.original;
            return currentReading ? (
              <Button variant="outline" size="sm" onClick={() => setEditingUtility(currentReading)}>
                更新
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!apartmentId) return;
                  setCreatePreset({
                    apartmentId,
                    roomId,
                    periodYear: currentYear,
                    periodMonth: currentMonth,
                    readingDate: today.toISOString().split('T')[0],
                    waterPrevious,
                    electricityPrevious,
                  });
                  setIsCreateOpen(true);
                }}
              >
                录入
              </Button>
            );
          },
        };
      }
      return col;
    });
    return baseColumns;
  }, [currentYear, currentMonth, today]);

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: allRooms } = useQuery({
    queryKey: ['allRooms', orgId],
    queryFn: () => roomsApi.listAll(orgId!, apartments?.map((a) => a.id) || []),
    enabled: !!orgId && !!apartments && apartments.length > 0,
  });

  const { data: activeLeases = [] } = useQuery({
    queryKey: ['leases', orgId, true],
    queryFn: () => leasesApi.list(orgId!, true),
    enabled: !!orgId,
  });

  const { data: monthUtilities = [], isLoading: monthUtilitiesLoading } = useQuery({
    queryKey: ['utilities', orgId, 'period', currentYear, currentMonth],
    queryFn: () =>
      utilitiesApi.list(orgId!, {
        period_year: currentYear,
        period_month: currentMonth,
      }),
    enabled: !!orgId,
  });

  const { data: latestPreviousReadings = {} } = useQuery({
    queryKey: ['utilities', 'latest-before', orgId, currentYear, currentMonth],
    queryFn: () => utilitiesApi.getLatestBefore(orgId!, currentYear, currentMonth),
    enabled: !!orgId,
  });

  const { data: currentMonthBills = [] } = useQuery({
    queryKey: ['bills', orgId, currentYear, currentMonth],
    queryFn: () => billsApi.list(orgId!, { year: currentYear, month: currentMonth }),
    enabled: !!orgId,
  });

  const { data: roomsMissingInitial = [] } = useQuery({
    queryKey: ['utilities', 'rooms-missing-initial', orgId],
    queryFn: () => utilitiesApi.getRoomsMissingInitial(orgId!),
    enabled: !!orgId,
  });

  const scopeRooms = allRooms;
  const apartmentRooms = useMemo(() => {
    if (!apartments || !allRooms) return [];
    return apartments
      .map((apt) => ({
        apartment: apt,
        rooms: allRooms.filter((r) => r.apartment_id === apt.id && r.status === 'occupied'),
      }))
      .filter((group) => group.rooms.length > 0);
  }, [apartments, allRooms]);

  const activeLeaseRoomIds = useMemo(() => new Set(activeLeases.map((l) => l.room_id)), [activeLeases]);

  const monthRoomsNeedInputCount = useMemo(() => {
    if (!scopeRooms) return null;
    return scopeRooms.filter((r) => r.status === 'occupied' && activeLeaseRoomIds.has(r.id)).length;
  }, [activeLeaseRoomIds, scopeRooms]);

  const monthRoomsRecordedCount = useMemo(() => {
    if (!scopeRooms) return null;
    const needRoomIds = new Set(
      scopeRooms.filter((r) => r.status === 'occupied' && activeLeaseRoomIds.has(r.id)).map((r) => r.id)
    );
    const recordedRoomIds = new Set(monthUtilities.map((u) => u.room_id));
    let cnt = 0;
    needRoomIds.forEach((id) => {
      if (recordedRoomIds.has(id)) cnt += 1;
    });
    return cnt;
  }, [activeLeaseRoomIds, monthUtilities, scopeRooms]);

  const monthRoomsMissingCount =
    monthRoomsNeedInputCount == null || monthRoomsRecordedCount == null
      ? null
      : Math.max(0, monthRoomsNeedInputCount - monthRoomsRecordedCount);

  const pendingUtilityBills = useMemo(() => {
    if (!activeLeases.length) return [];

    const todayTime = today.getTime();
    const currentPeriodKey = getPeriodKey(currentYear, currentMonth);
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

        let status: UtilityBillStatus = 'pending_input';
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

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.create>[1]) =>
      utilitiesApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsCreateOpen(false);
      appToast.success('水电读数录入成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '录入失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof utilitiesApi.update>[2] }) =>
      utilitiesApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['bills', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setEditingUtility(null);
      appToast.success('水电读数更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const batchImportMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.batchCreate>[1]) => utilitiesApi.batchCreate(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsBatchImportOpen(false);
      appToast.success('批量导入成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '批量导入失败，请重试')),
  });

  const handleBatchImport = (payload: Parameters<typeof utilitiesApi.batchCreate>[1]) => {
    batchImportMutation.mutate(payload);
  };

  const handleTabChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (value === 'history') {
      nextParams.set('tab', 'history');
    } else {
      nextParams.delete('tab');
    }
    const query = nextParams.toString();
    router.replace(query ? `/utilities?${query}` : '/utilities', { scroll: false });
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!orgId) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <h1 className="text-2xl font-semibold tracking-tight" data-testid={UTILITIES.HEADING}>
                  水电记录
                </h1>
                <TabsList>
                  <TabsTrigger value="entry">本月录入</TabsTrigger>
                  <TabsTrigger value="history">历史记录</TabsTrigger>
                </TabsList>
              </div>

              {activeTab === 'entry' ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsExportTemplateOpen(true)}
                    data-testid={UTILITIES.EXPORT_TEMPLATE_BUTTON}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出模版
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsBatchImportOpen(true)}
                    data-testid={UTILITIES.IMPORT_BUTTON}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    批量导入
                  </Button>
                <Button
                  onClick={() => {
                    setCreatePreset(null);
                    setIsCreateOpen(true);
                  }}
                  data-testid={UTILITIES.ENTRY_BUTTON}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  录入读数
                </Button>
                </div>
              ) : null}
            </div>

            <TabsContent value="entry" className="space-y-6">
              <Card data-testid={UTILITIES.OVERVIEW_CARD}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {currentYear}年{currentMonth}月水电录入概览
                  </CardTitle>
                  <CardDescription>统计范围：全部公寓（仅统计有活跃租约的已入住房间）</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthUtilitiesLoading || !allRooms ? (
                    <Skeleton className="h-20" />
                  ) : monthRoomsNeedInputCount == null ||
                    monthRoomsRecordedCount == null ||
                    monthRoomsMissingCount == null ? (
                    <p className="py-6 text-sm text-muted-foreground">暂无数据</p>
                  ) : (
                    <div className="rounded-xl border bg-muted/20 px-5 py-4">
                      <div className="flex flex-wrap items-start gap-8">
                        <div className="min-w-[120px]">
                          <div className="text-sm text-muted-foreground">需要录入房间</div>
                          <div className="mt-2 text-2xl font-bold">{monthRoomsNeedInputCount}</div>
                        </div>
                        <div className="min-w-[120px]">
                          <div className="text-sm text-muted-foreground">已记录房间</div>
                          <div className="mt-2 text-2xl font-bold text-foreground">{monthRoomsRecordedCount}</div>
                        </div>
                        <div className="min-w-[120px]">
                          <div className="text-sm text-muted-foreground">未记录房间</div>
                          <div className="mt-2 text-2xl font-bold text-amber-600">{monthRoomsMissingCount}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <DataTable
                data-testid={UTILITIES.PENDING_BILLS_CARD}
                columns={columns}
                data={pendingUtilityBills}
                testid={UTILITIES.LIST}
                title="待出账水电账单"
                description="按本月账期展示活跃租约的水电录入、出账准备和更新状态"
              />

              {roomsMissingInitial.length > 0 && (
                <Card className="border-amber-500/50" data-testid={UTILITIES.MISSING_INITIAL_CARD}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      未录入签约月初始读数的房间
                    </CardTitle>
                    <CardDescription>以下房间已签约但尚未录入签约月的初始水电读数，请及时补录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-2 text-left font-medium">公寓</th>
                            <th className="px-4 py-2 text-left font-medium">房间号</th>
                            <th className="px-4 py-2 text-left font-medium">租客</th>
                            <th className="px-4 py-2 text-left font-medium">签约日期</th>
                            <th className="px-4 py-2 text-right font-medium">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomsMissingInitial.map((room) => (
                            <tr key={room.room_id} className="border-b last:border-0">
                              <td className="px-4 py-2">{room.apartment_name}</td>
                              <td className="px-4 py-2">{room.room_number}</td>
                              <td className="px-4 py-2">{room.tenant_name}</td>
                              <td className="px-4 py-2">{room.lease_start_date}</td>
                              <td className="px-4 py-2 text-right">
                                <Button variant="outline" size="sm" onClick={() => setInitialReadingRoom(room)}>
                                  录入
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      点击每行「录入」按钮可快速录入该房间签约月的初始水电读数，读数日期默认签约日期
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <UtilityHistoryPanel orgId={orgId} />
            </TabsContent>
          </Tabs>
        </div>

        {isCreateOpen ? (
          <CreateUtilityDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
            apartmentRooms={apartmentRooms}
            orgId={orgId!}
            preset={createPreset}
          />
        ) : null}

        {isExportTemplateOpen ? (
          <ExportTemplateDialog open={isExportTemplateOpen} onOpenChange={setIsExportTemplateOpen} />
        ) : null}

        {isBatchImportOpen ? (
          <BatchImportDialog
            open={isBatchImportOpen}
            onOpenChange={setIsBatchImportOpen}
            onImport={handleBatchImport}
            isPending={batchImportMutation.isPending}
            allRooms={allRooms}
            apartments={apartments}
          />
        ) : null}

        {initialReadingRoom && (
          <InitialReadingDialog
            orgId={orgId}
            roomId={initialReadingRoom.room_id}
            roomDisplay={`${initialReadingRoom.apartment_name} - ${initialReadingRoom.room_number}`}
            startDate={initialReadingRoom.lease_start_date}
            open={!!initialReadingRoom}
            onOpenChange={(open) => !open && setInitialReadingRoom(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ['utilities', 'rooms-missing-initial', orgId],
              });
              queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
              setInitialReadingRoom(null);
            }}
          />
        )}

        {editingUtility ? (
          <EditUtilityDialog
            open={!!editingUtility}
            onOpenChange={(open) => !open && setEditingUtility(null)}
            onSubmit={(data) => updateMutation.mutate({ id: editingUtility.id, data })}
            isPending={updateMutation.isPending}
            utility={editingUtility}
          />
        ) : null}
      </MainLayout>
    </PermissionPageGuard>
  );
}
