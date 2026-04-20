import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button, Tabs } from 'antd';
import { useAuth } from '@/contexts/auth';
import { Plus, Upload, Download } from 'lucide-react';
import type { RoomMissingInitialReading, UtilityReading } from '@/types';
import type { PendingUtilityBillRow } from '@/types/utilities';
import { useUtilitiesData } from '@/hooks/use-utilities';
import { MonthStatsCard, useMonthStats } from './components/MonthStatsCard';
import { PendingBillTable } from './components/PendingBillTable';
import { MissingInitialWarning } from './components/MissingInitialWarning';

const CreateUtilityDialog = lazy(() =>
  import('@/pages/utilities/components/CreateUtilityDialog').then((mod) => ({ default: mod.CreateUtilityDialog }))
);
const ExportTemplateDialog = lazy(() =>
  import('@/pages/utilities/components/ExportTemplateDialog').then((mod) => ({ default: mod.ExportTemplateDialog }))
);
const BatchImportDialog = lazy(() =>
  import('@/pages/utilities/components/BatchImportDialog').then((mod) => ({ default: mod.BatchImportDialog }))
);
const InitialReadingDialog = lazy(() =>
  import('@/components/common/initial-reading-dialog').then((mod) => ({ default: mod.InitialReadingDialog }))
);
const EditUtilityDialog = lazy(() =>
  import('@/pages/utilities/components/EditUtilityDialog').then((mod) => ({ default: mod.EditUtilityDialog }))
);
const UtilityHistoryPanel = lazy(() =>
  import('@/pages/utilities/components/UtilityHistoryPanel').then((mod) => ({ default: mod.UtilityHistoryPanel }))
);

export default function UtilitiesPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [activeTab, setActiveTab] = useState<'entry' | 'history'>(() => {
    return searchParams.get('tab') === 'history' ? 'history' : 'entry';
  });

  // 弹窗状态
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExportTemplateOpen, setIsExportTemplateOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [initialReadingRoom, setInitialReadingRoom] = useState<RoomMissingInitialReading | null>(null);
  const [editingUtility, setEditingUtility] = useState<UtilityReading | null>(null);

  // 录入预设
  const [createPreset, setCreatePreset] = useState<{
    apartmentId: string;
    roomId: string;
    periodYear: number;
    periodMonth: number;
    readingDate: string;
    waterPrevious?: number | null;
    electricityPrevious?: number | null;
  } | null>(null);

  // 数据
  const utilitiesData = useUtilitiesData();
  const {
    pendingUtilityBills,
    monthRoomsNeedInputCount,
    monthRoomsRecordedCount,
    roomsMissingInitial,
    apartmentRooms,
    createMutation,
    updateMutation,
    batchImportMutation,
  } = utilitiesData;

  const { readyToBillCount, overdueCount } = useMonthStats(pendingUtilityBills);

  // 快捷录入
  const handleQuickEntry = (record: PendingUtilityBillRow) => {
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
  };

  const handleQuickUpdate = (record: PendingUtilityBillRow) => {
    if (record.currentReading) {
      setEditingUtility(record.currentReading);
    }
  };

  if (authLoading) {
    return <PageLoading />;
  }

  if (!orgId) {
    return <NoOrgPlaceholder />;
  }

  return (
    <PermissionPageGuard>
      <div className="space-y-4">
        <Tabs
          activeKey={activeTab}
          onChange={(v) => setActiveTab(v as 'entry' | 'history')}
          items={[
            {
              key: 'entry',
              label: '本月录入',
              children: (
                <EntryTab
                  recordedCount={monthRoomsRecordedCount ?? 0}
                  totalCount={monthRoomsNeedInputCount ?? 0}
                  missingCount={Math.max(0, (monthRoomsNeedInputCount ?? 0) - (monthRoomsRecordedCount ?? 0))}
                  readyToBillCount={readyToBillCount}
                  overdueCount={overdueCount}
                  bills={pendingUtilityBills}
                  missingRooms={roomsMissingInitial}
                  onEntry={handleQuickEntry}
                  onUpdate={handleQuickUpdate}
                  onMissingEntry={setInitialReadingRoom}
                  onExportTemplate={() => setIsExportTemplateOpen(true)}
                  onBatchImport={() => setIsBatchImportOpen(true)}
                  onAdd={() => {
                    setCreatePreset(null);
                    setIsCreateOpen(true);
                  }}
                />
              ),
            },
            {
              key: 'history',
              label: '历史记录',
              children: (
                <Suspense fallback={<div className="flex h-40 items-center justify-center text-gray-400">加载中...</div>}>
                  <UtilityHistoryPanel orgId={orgId} />
                </Suspense>
              ),
            },
          ]}
        />

        <Suspense fallback={<DialogLoading />}>
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
              onImport={(data) => batchImportMutation.mutate(data)}
              isPending={batchImportMutation.isPending}
              allRooms={utilitiesData.allRooms}
              apartments={utilitiesData.apartments}
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
                queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
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

// --- Entry Tab ---
interface EntryTabProps {
  recordedCount: number;
  totalCount: number;
  missingCount: number;
  readyToBillCount: number;
  overdueCount: number;
  bills: PendingUtilityBillRow[];
  missingRooms: RoomMissingInitialReading[];
  onEntry: (record: PendingUtilityBillRow) => void;
  onUpdate: (record: PendingUtilityBillRow) => void;
  onMissingEntry: (room: RoomMissingInitialReading) => void;
  onExportTemplate: () => void;
  onBatchImport: () => void;
  onAdd: () => void;
}

function EntryTab({
  recordedCount,
  totalCount,
  missingCount,
  readyToBillCount,
  overdueCount,
  bills,
  missingRooms,
  onEntry,
  onUpdate,
  onMissingEntry,
  onExportTemplate,
  onBatchImport,
  onAdd,
}: EntryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MonthStatsCard
          recordedCount={recordedCount}
          totalCount={totalCount}
          missingCount={missingCount}
          readyToBillCount={readyToBillCount}
          overdueCount={overdueCount}
        />
        <div className="flex gap-2">
          <Button variant="outlined" onClick={onExportTemplate} icon={<Download className="h-4 w-4" />}>
            导出模版
          </Button>
          <Button variant="outlined" onClick={onBatchImport} icon={<Upload className="h-4 w-4" />}>
            批量导入
          </Button>
          <Button type="primary" onClick={onAdd} icon={<Plus className="h-4 w-4" />}>
            录入读数
          </Button>
        </div>
      </div>

      <PendingBillTable data={bills} onEntry={onEntry} onUpdate={onUpdate} />

      <MissingInitialWarning rooms={missingRooms} onEntry={onMissingEntry} />
    </div>
  );
}

// --- Placeholders ---
function PageLoading() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
    </div>
  );
}

function DialogLoading() {
  return null;
}

function NoOrgPlaceholder() {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center text-gray-500">
      <span className="text-lg">请先创建或加入团队</span>
    </div>
  );
}

// 重新导出 MonthStatsCard（包含 useMonthStats）
export { MonthStatsCard, useMonthStats } from './components/MonthStatsCard';