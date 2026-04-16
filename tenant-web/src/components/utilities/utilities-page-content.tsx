
import { lazy, Suspense } from 'react';
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { DataTable } from '@/components/common/data-table';
import { useAuth } from '@/contexts/auth';
import { Plus, Upload, Download, Building2, AlertCircle, Droplets, TrendingUp, Clock } from 'lucide-react';
import type { RoomMissingInitialReading, UtilityReading } from '@/types';
import { pendingUtilityBillColumns } from '@/components/utilities/columns';
import { UTILITIES } from '@/constants/utilities';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { useUtilitiesData } from '@/hooks/use-utilities';

const CreateUtilityDialog = lazy(() => import('@/components/utilities/CreateUtilityDialog').then((mod) => ({ default: mod.CreateUtilityDialog })));
const ExportTemplateDialog = lazy(() => import('@/components/utilities/ExportTemplateDialog').then((mod) => ({ default: mod.ExportTemplateDialog })));
const BatchImportDialog = lazy(() => import('@/components/utilities/BatchImportDialog').then((mod) => ({ default: mod.BatchImportDialog })));
const InitialReadingDialog = lazy(() => import('@/components/common/initial-reading-dialog').then((mod) => ({ default: mod.InitialReadingDialog })));
const EditUtilityDialog = lazy(() => import('@/components/utilities/EditUtilityDialog').then((mod) => ({ default: mod.EditUtilityDialog })));

export function UtilitiesPageContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                onClick={() => setEditingUtility(currentReading)}
              >
                更新
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="h-8 bg-primary hover:bg-primary/90"
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
    navigate(query ? `/utilities?${query}` : '/utilities', { replace: true });
  };

  if (authLoading) {
    return <UtilitiesPageSuspenseFallback />;
  }

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
        <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <TabsList>
                  <TabsTrigger value="entry">本月录入</TabsTrigger>
                  <TabsTrigger value="history">历史记录</TabsTrigger>
                </TabsList>
              </div>

              {activeTab === 'entry' ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="hover:border-input border-border"
                    onClick={() => setIsExportTemplateOpen(true)}
                    data-testid={UTILITIES.EXPORT_TEMPLATE_BUTTON}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出模版
                  </Button>
                  <Button
                    variant="outline"
                    className="hover:border-input border-border"
                    onClick={() => setIsBatchImportOpen(true)}
                    data-testid={UTILITIES.IMPORT_BUTTON}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    批量导入
                  </Button>
                  <Button
                    className="bg-primary shadow-sm hover:bg-primary/90"
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

            <TabsContent value="entry" className="mt-6 space-y-6">
              {/* 现代化概览卡片区域 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* 本月录入进度卡片 */}
                <Card className="relative overflow-hidden border-0 shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                  <CardContent className="relative !pt-5 p-5 sm:!pt-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary">本月录入进度</p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-foreground">{monthRoomsRecordedCount ?? 0}</span>
                          <span className="text-lg text-muted-foreground">/ {monthRoomsNeedInputCount ?? 0}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">已录入房间数</p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                        <Droplets className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    {/* 进度条 */}
                    <div className="mt-4 h-2 w-full rounded-full bg-primary/20">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{
                          width: `${monthRoomsNeedInputCount ? ((monthRoomsRecordedCount ?? 0) / monthRoomsNeedInputCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 待录入卡片 */}
                <Card className="relative overflow-hidden border-0 shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-warning/5" />
                  <CardContent className="relative !pt-5 p-5 sm:!pt-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-warning-foreground">待录入</p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-foreground">{monthRoomsMissingCount ?? 0}</span>
                          <span className="text-sm text-muted-foreground">房间</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">需要尽快录入</p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/20">
                        <Clock className="h-7 w-7 text-warning-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 待出账卡片 */}
                <Card className="relative overflow-hidden border-0 shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-info/10 to-info/5" />
                  <CardContent className="relative !pt-5 p-5 sm:!pt-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-info-foreground">待出账</p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-foreground">
                            {pendingUtilityBills.filter((b) => b.status === 'ready_to_bill').length}
                          </span>
                          <span className="text-sm text-muted-foreground">笔</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">已录入待出账</p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info/20">
                        <TrendingUp className="h-7 w-7 text-info-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 逾期提醒卡片 */}
                <Card className="relative overflow-hidden border-0 shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-destructive/5" />
                  <CardContent className="relative !pt-5 p-5 sm:!pt-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-destructive">录入逾期</p>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-foreground">
                            {pendingUtilityBills.filter((b) => b.status === 'input_overdue').length}
                          </span>
                          <span className="text-sm text-muted-foreground">房间</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">需要立即处理</p>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
                        <AlertCircle className="h-7 w-7 text-destructive" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DataTable
                data-testid={UTILITIES.PENDING_BILLS_CARD}
                columns={columns}
                data={pendingUtilityBills}
                testid={UTILITIES.LIST}
                useCard={true}
                title="本月水电账单"
                description="展示本月各房间水电录入状态，支持快速录入和更新"
              />

              {roomsMissingInitial.length > 0 && (
                <Card className="border-warning/20 bg-warning/10" data-testid={UTILITIES.MISSING_INITIAL_CARD}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warning/20">
                        <AlertCircle className="h-4 w-4 text-warning-foreground" />
                      </span>
                      缺失初始读数
                    </CardTitle>
                    <CardDescription>
                      以下房间已签约但尚未录入签约月的初始水电读数，请及时补录以避免费用计算错误
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

            <TabsContent value="history" className="mt-6 space-y-6">
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

const UtilityHistoryPanel = lazy(() => import('@/components/utilities/utility-history-panel').then((mod) => ({ default: mod.UtilityHistoryPanel })));
