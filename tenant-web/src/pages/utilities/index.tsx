import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button, Card, Tabs, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { useAuth } from '@/contexts/auth';
import { Plus, Upload, Download, Building2, AlertCircle, Droplets, TrendingUp, Clock } from 'lucide-react';
import type { RoomMissingInitialReading, UtilityReading } from '@/types';
import { pendingUtilityBillColumns } from '@/pages/utilities/components/columns';
import { UTILITIES } from '@/constants/utilities';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { useUtilitiesData } from '@/hooks/use-utilities';

const CreateUtilityDialog = lazy(() => import('@/pages/utilities/components/CreateUtilityDialog').then((mod) => ({ default: mod.CreateUtilityDialog })));
const ExportTemplateDialog = lazy(() => import('@/pages/utilities/components/ExportTemplateDialog').then((mod) => ({ default: mod.ExportTemplateDialog })));
const BatchImportDialog = lazy(() => import('@/pages/utilities/components/BatchImportDialog').then((mod) => ({ default: mod.BatchImportDialog })));
const InitialReadingDialog = lazy(() => import('@/components/common/initial-reading-dialog').then((mod) => ({ default: mod.InitialReadingDialog })));
const EditUtilityDialog = lazy(() => import('@/pages/utilities/components/EditUtilityDialog').then((mod) => ({ default: mod.EditUtilityDialog })));
const UtilityHistoryPanel = lazy(() => import('@/pages/utilities/components/utility-history-panel').then((mod) => ({ default: mod.UtilityHistoryPanel })));

export default function UtilitiesPage() {
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

  const utilitiesData = useUtilitiesData();
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

  const columns = useMemo(() => {
    return pendingUtilityBillColumns.map((col) => {
      const antdCol = col as Record<string, unknown>;
      if (antdCol.key === 'actions') {
        return {
          ...col,
          render: (_: unknown, record: PendingUtilityBillRow) => {
            const { currentReading, apartmentId, roomId, waterPrevious, electricityPrevious } = record;
            return currentReading ? (
              <Button
                size="small"
                onClick={() => setEditingUtility(currentReading)}
              >
                更新
              </Button>
            ) : (
              <Button
                size="small"
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
          <Tabs activeKey={activeTab} onChange={handleTabChange} className="space-y-6" items={[
            {
              key: 'entry',
              label: '本月录入',
              children: (
                <>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3" />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outlined"
                        onClick={() => setIsExportTemplateOpen(true)}
                        data-testid={UTILITIES.EXPORT_TEMPLATE_BUTTON}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        导出模版
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setIsBatchImportOpen(true)}
                        data-testid={UTILITIES.IMPORT_BUTTON}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        批量导入
                      </Button>
                      <Button
                        type="primary"
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
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="relative overflow-hidden border-0 shadow-md">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-blue-50/25" style={{ background: 'linear-gradient(to bottom right, var(--ant-primary-color-hover, #1677ff33), var(--ant-primary-color-supplementary, #1677ff1a))' }} />
                      <div className="relative !pt-5 p-5 sm:!pt-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">本月录入进度</p>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-gray-900">{monthRoomsRecordedCount ?? 0}</span>
                              <span className="text-lg text-gray-400">/ {monthRoomsNeedInputCount ?? 0}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">已录入房间数</p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                            <Droplets className="h-7 w-7 text-blue-600" />
                          </div>
                        </div>
                        <div className="mt-4 h-2 w-full rounded-full bg-blue-100">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                            style={{
                              width: `${monthRoomsNeedInputCount ? ((monthRoomsRecordedCount ?? 0) / monthRoomsNeedInputCount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-orange-50/25" />
                      <div className="relative !pt-5 p-5 sm:!pt-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-600">待录入</p>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-gray-900">{monthRoomsMissingCount ?? 0}</span>
                              <span className="text-sm text-gray-400">房间</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">需要尽快录入</p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                            <Clock className="h-7 w-7 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-green-50/25" />
                      <div className="relative !pt-5 p-5 sm:!pt-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">待出账</p>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-gray-900">
                                {pendingUtilityBills.filter((b) => b.status === 'ready_to_bill').length}
                              </span>
                              <span className="text-sm text-gray-400">笔</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">已录入待出账</p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                            <TrendingUp className="h-7 w-7 text-green-600" />
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-md">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-red-50/25" />
                      <div className="relative !pt-5 p-5 sm:!pt-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-600">录入逾期</p>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-3xl font-bold text-gray-900">
                                {pendingUtilityBills.filter((b) => b.status === 'input_overdue').length}
                              </span>
                              <span className="text-sm text-gray-400">房间</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">需要立即处理</p>
                          </div>
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="h-7 w-7 text-red-600" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card
                    data-testid={UTILITIES.PENDING_BILLS_CARD}
                    title="本月水电账单"
                  >
                    <Table
                      data-testid={UTILITIES.LIST}
                      columns={columns as TableColumnsType}
                      dataSource={pendingUtilityBills}
                      rowKey="id"
                      pagination={false}
                    />
                  </Card>

                  {roomsMissingInitial.length > 0 && (
                    <Card
                      data-testid={UTILITIES.MISSING_INITIAL_CARD}
                      className="border-orange-200 bg-orange-50"
                      title={
                        <span className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          </span>
                          缺失初始读数
                        </span>
                      }
                    >
                      <p className="text-sm text-gray-500 mb-4">
                        以下房间已签约但尚未录入签约月的初始水电读数，请及时补录以避免费用计算错误
                      </p>
                      <div className="rounded-md border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
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
                                  <Button variant="outlined" size="small" onClick={() => setInitialReadingRoom(room)}>
                                    录入
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        点击每行「录入」按钮可快速录入该房间签约月的初始水电读数，读数日期默认签约日期
                      </p>
                    </Card>
                  )}
                </>
              ),
            },
            {
              key: 'history',
              label: '历史记录',
              children: (
                <UtilityHistoryPanel orgId={orgId} />
              ),
            },
          ]} />

        <Suspense fallback={
          <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-gray-400">加载中...</p>
            </div>
          </div>
        }>
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
        </Suspense>
      </div>
    </PermissionPageGuard>
  );
}
