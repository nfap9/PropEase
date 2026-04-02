'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@/components/common/data-table';
import { useAuth } from '@/lib/auth/context';
import { Plus, Upload, Download, Building2, AlertCircle } from 'lucide-react';
import type { RoomMissingInitialReading, UtilityReading } from '@/types';
import { pendingUtilityBillColumns } from '../utilities.columns';
import { UTILITIES } from '../utilities.constants';
import type { PendingUtilityBillRow } from '../utilities.types';
import { useUtilitiesData } from '../hooks/use-utilities';

const CreateUtilityDialog = dynamic(
  () => import('@/app/utilities/components/CreateUtilityDialog').then((mod) => mod.CreateUtilityDialog),
  { ssr: false }
);

const ExportTemplateDialog = dynamic(
  () => import('@/app/utilities/components/ExportTemplateDialog').then((mod) => mod.ExportTemplateDialog),
  { ssr: false }
);

const BatchImportDialog = dynamic(
  () => import('@/app/utilities/components/BatchImportDialog').then((mod) => mod.BatchImportDialog),
  { ssr: false }
);

const InitialReadingDialog = dynamic(
  () => import('@/components/common/initial-reading-dialog').then((mod) => mod.InitialReadingDialog),
  { ssr: false }
);

const EditUtilityDialog = dynamic(
  () => import('@/app/utilities/components/EditUtilityDialog').then((mod) => mod.EditUtilityDialog),
  { ssr: false }
);

export function UtilitiesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'entry';

  const today = useMemo(() => new Date(), []);
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

  const utilitiesData = useUtilitiesData({ orgId });
  const {
    apartments,
    allRooms,
    pendingUtilityBills,
    monthRoomsNeedInputCount,
    monthRoomsRecordedCount,
    monthRoomsMissingCount,
    roomsMissingInitial,
    monthUtilitiesLoading,
    apartmentRooms,
    createMutation,
    updateMutation,
    batchImportMutation,
  } = utilitiesData;

  const columns = useMemo<ColumnDef<PendingUtilityBillRow>[]>(() => {
    const baseColumns: ColumnDef<PendingUtilityBillRow>[] = pendingUtilityBillColumns.map((col) => {
      if (col.id === 'actions') {
        return {
          ...col,
          cell: ({ row }: { row: { original: PendingUtilityBillRow } }) => {
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

  const handleBatchImport = (payload: Parameters<typeof utilitiesData.batchImportMutation.mutate>[0]) => {
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
        <UtilitiesPageSuspenseFallback />
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
                    <div className="h-20" />
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

        {isCreateOpen && (
          <CreateUtilityDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
            apartmentRooms={apartmentRooms}
            orgId={orgId}
            preset={createPreset}
          />
        )}

        {isExportTemplateOpen && (
          <ExportTemplateDialog open={isExportTemplateOpen} onOpenChange={setIsExportTemplateOpen} />
        )}

        {isBatchImportOpen && (
          <BatchImportDialog
            open={isBatchImportOpen}
            onOpenChange={setIsBatchImportOpen}
            onImport={handleBatchImport}
            isPending={batchImportMutation.isPending}
            allRooms={allRooms}
            apartments={apartments}
          />
        )}

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

        {editingUtility && (
          <EditUtilityDialog
            open={!!editingUtility}
            onOpenChange={(open) => !open && setEditingUtility(null)}
            onSubmit={(data) => updateMutation.mutate({ id: editingUtility.id, data })}
            isPending={updateMutation.isPending}
            utility={editingUtility}
          />
        )}
      </MainLayout>
    </PermissionPageGuard>
  );
}

export function UtilitiesPageSuspenseFallback() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="h-8 w-48" />
        <div className="h-10 w-full" />
      </div>
      <div className="h-64 w-full" />
    </div>
  );
}

const UtilityHistoryPanel = dynamic(
  () => import('@/app/utilities/components/utility-history-panel').then((mod) => mod.UtilityHistoryPanel),
  { ssr: false }
);
