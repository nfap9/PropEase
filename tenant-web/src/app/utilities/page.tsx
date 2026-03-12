'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apartmentsApi, roomsApi, utilitiesApi, leasesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { formatDate } from '@/lib/date-utils';
import { useAuth } from '@/lib/auth/context';
import { Plus, Upload, Download, Building2, AlertCircle, History } from 'lucide-react';
import { CreateUtilityDialog, ExportTemplateDialog, BatchImportDialog } from './components';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';
import type { RoomMissingInitialReading } from '@/lib/api/utilities';

// 注意: 实际使用时从 testids 导入 UTILITIES 常量
const UTILITIES = {
  HEADING: 'utilities-heading',
  ENTRY_BUTTON: 'utilities-entry-btn',
  LIST: 'utilities-list',
  EXPORT_TEMPLATE_BUTTON: 'utilities-export-template-button',
  IMPORT_BUTTON: 'utilities-import-button',
  OVERVIEW_CARD: 'utilities-overview-card',
  MISSING_LEASES_CARD: 'utilities-missing-leases-card',
  MISSING_INITIAL_CARD: 'utilities-missing-initial-card',
} as const;

// 从签约日期提取出账日（每月几号出账）
function getBillingDay(dateStr: string): number {
  return new Date(dateStr).getDate();
}

// 计算出账状态
type BillingStatus = 'recorded' | 'pending' | 'upcoming' | 'overdue';

function getBillingStatus(billingDay: number, isRecorded: boolean): BillingStatus {
  if (isRecorded) return 'recorded';

  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const adjustedBillingDay = Math.min(billingDay, daysInMonth);

  if (currentDay > adjustedBillingDay) {
    return 'overdue';
  } else if (currentDay >= adjustedBillingDay - 5) {
    return 'upcoming';
  }
  return 'pending';
}

const BILLING_STATUS_CONFIG: Record<
  BillingStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  recorded: { label: '已录入', variant: 'default' }, // 绿色（默认使用 default，但需要自定义样式）
  pending: { label: '未录入', variant: 'secondary' }, // 蓝色
  upcoming: { label: '即将到期', variant: 'outline' }, // 橙色（需要自定义样式）
  overdue: { label: '已逾期', variant: 'destructive' }, // 红色
};

// 格式化合同期
function formatLeasePeriod(startDate: string, endDate: string | null): string {
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : '长期';
  return `${start} ~ ${end}`;
}

export default function UtilitiesPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [createApartmentId, setCreateApartmentId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExportTemplateOpen, setIsExportTemplateOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [initialReadingRoom, setInitialReadingRoom] = useState<RoomMissingInitialReading | null>(
    null
  );

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, createApartmentId],
    queryFn: () => roomsApi.list(orgId!, createApartmentId!),
    enabled: !!orgId && createApartmentId !== null,
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

  const { data: roomsMissingInitial = [] } = useQuery({
    queryKey: ['utilities', 'rooms-missing-initial', orgId],
    queryFn: () => utilitiesApi.getRoomsMissingInitial(orgId!),
    enabled: !!orgId,
  });

  const scopeRooms = allRooms;
  const activeLeaseRoomIds = useMemo(
    () => new Set(activeLeases.map((l) => l.room_id)),
    [activeLeases]
  );

  const monthRoomsNeedInputCount = useMemo(() => {
    if (!scopeRooms) return null;
    return scopeRooms.filter((r) => r.status === 'occupied' && activeLeaseRoomIds.has(r.id)).length;
  }, [activeLeaseRoomIds, scopeRooms]);

  const monthRoomsRecordedCount = useMemo(() => {
    if (!scopeRooms) return null;
    const needRoomIds = new Set(
      scopeRooms
        .filter((r) => r.status === 'occupied' && activeLeaseRoomIds.has(r.id))
        .map((r) => r.id)
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

  // 本月未录入水电的活跃租约列表
  const monthMissingLeases = useMemo(() => {
    if (!scopeRooms || !activeLeases.length) return [];
    const recordedRoomIds = new Set(monthUtilities.map((u) => u.room_id));
    const occupiedRoomIds = new Set(
      scopeRooms.filter((r) => r.status === 'occupied').map((r) => r.id)
    );

    return activeLeases
      .filter((lease) => occupiedRoomIds.has(lease.room_id) && !recordedRoomIds.has(lease.room_id))
      .sort((a, b) => {
        // 按出账日期（签约日的日部分）排序
        const aDay = new Date(a.start_date).getDate();
        const bDay = new Date(b.start_date).getDate();
        return aDay - bDay;
      });
  }, [activeLeases, monthUtilities, scopeRooms]);

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.create>[1]) =>
      utilitiesApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsCreateOpen(false);
      toast.success('水电读数录入成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '录入失败，请重试')),
  });

  const batchImportMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.batchCreate>[1]) =>
      utilitiesApi.batchCreate(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
      setIsBatchImportOpen(false);
      toast.success('批量导入成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '批量导入失败，请重试')),
  });

  const handleBatchImport = (payload: Parameters<typeof utilitiesApi.batchCreate>[1]) => {
    batchImportMutation.mutate(payload);
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
          <h2 className="text-xl font-semibold">请先创建或加入组织</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个组织开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold" data-testid={UTILITIES.HEADING}>水电记录</h1>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/utilities/history">
                  <History className="mr-2 h-4 w-4" />
                  历史水电记录
                </Link>
              </Button>
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
              <Button onClick={() => setIsCreateOpen(true)} data-testid={UTILITIES.ENTRY_BUTTON}>
                <Plus className="mr-2 h-4 w-4" />
                录入读数
              </Button>
            </div>
          </div>

          {/* 本月水电录入概览 */}
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
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-md border p-4">
                    <div className="text-sm text-muted-foreground">需要录入房间</div>
                    <div className="mt-1 text-2xl font-bold">{monthRoomsNeedInputCount}</div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="text-sm text-muted-foreground">已记录房间</div>
                    <div className="mt-1 text-2xl font-bold">{monthRoomsRecordedCount}</div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="text-sm text-muted-foreground">未记录房间</div>
                    <div className="mt-1 text-2xl font-bold">{monthRoomsMissingCount}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 本月未录入水电的租约 */}
          {monthMissingLeases.length > 0 && (
            <Card data-testid={UTILITIES.MISSING_LEASES_CARD}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">本月未录入水电的租约</CardTitle>
                <CardDescription>以下活跃租约本月尚未录入水电读数</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border" data-testid={UTILITIES.LIST}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">公寓</th>
                        <th className="px-4 py-2 text-left font-medium">房间号</th>
                        <th className="px-4 py-2 text-left font-medium">租客</th>
                        <th className="px-4 py-2 text-left font-medium">出账日期</th>
                        <th className="px-4 py-2 text-left font-medium">合同期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthMissingLeases.map((lease) => {
                        const billingDay = getBillingDay(lease.start_date);
                        const status = getBillingStatus(billingDay, false);
                        const config = BILLING_STATUS_CONFIG[status];
                        return (
                          <tr key={lease.id} className="border-b last:border-0">
                            <td className="px-4 py-2">{lease.room?.apartment?.name ?? '-'}</td>
                            <td className="px-4 py-2">{lease.room?.room_number ?? '-'}</td>
                            <td className="px-4 py-2">{lease.tenant?.name ?? '-'}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <span>每月{billingDay}日</span>
                                <Badge
                                  variant={config.variant}
                                  className={
                                    status === 'recorded'
                                      ? 'bg-green-600 hover:bg-green-700'
                                      : status === 'upcoming'
                                        ? 'border-orange-500 text-orange-600'
                                        : undefined
                                  }
                                >
                                  {config.label}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {formatLeasePeriod(lease.start_date, lease.end_date)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 未录入初始读数的房间 */}
          {roomsMissingInitial.length > 0 && (
            <Card
              className="border-amber-500/50"
              data-testid={UTILITIES.MISSING_INITIAL_CARD}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  未录入签约月初始读数的房间
                </CardTitle>
                <CardDescription>
                  以下房间已签约但尚未录入签约月的初始水电读数，请及时补录
                </CardDescription>
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
                      {roomsMissingInitial.map((r) => (
                        <tr key={r.room_id} className="border-b last:border-0">
                          <td className="px-4 py-2">{r.apartment_name}</td>
                          <td className="px-4 py-2">{r.room_number}</td>
                          <td className="px-4 py-2">{r.tenant_name}</td>
                          <td className="px-4 py-2">{r.lease_start_date}</td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setInitialReadingRoom(r)}
                            >
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
        </div>

        <CreateUtilityDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
          apartments={apartments}
          rooms={rooms}
          selectedApartmentId={createApartmentId}
          onApartmentChange={setCreateApartmentId}
        />

        <ExportTemplateDialog open={isExportTemplateOpen} onOpenChange={setIsExportTemplateOpen} />

        <BatchImportDialog
          open={isBatchImportOpen}
          onOpenChange={setIsBatchImportOpen}
          onImport={handleBatchImport}
          isPending={batchImportMutation.isPending}
          allRooms={allRooms}
          apartments={apartments}
        />

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
      </MainLayout>
    </PermissionPageGuard>
  );
}
