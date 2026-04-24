import { Suspense, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Tabs } from 'antd';
import { useAuth } from '@/contexts/auth';
import { useQueryClient } from '@tanstack/react-query';
import { EntryTab } from './tabs/entry-tab';
import { HistoryTab } from './tabs/history-tab';
import { useUtilitiesData } from './hooks/use-utility-data';
import { useMonthStats } from './hooks/use-month-stats';
import {
  CreateUtilityDialog,
  ExportTemplateDialog,
  BatchImportDialog,
  EditUtilityDialog,
} from '@/pages/utilities/components';
import { InitialReadingDialog } from '@/pages/leases/components';
import type { RoomMissingInitialReading, UtilityReading } from '@/types';
import type { PendingUtilityBillRow } from '@/types/utilities';

export default function UtilitiesPage() {
  const [searchParams] = useSearchParams();
  const { organization, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const {
    pendingUtilityBills,
    monthRoomsNeedInputCount,
    monthRoomsRecordedCount,
    roomsMissingInitial,
    apartmentRooms,
    allRooms,
    apartments,
    createUtility,
    updateUtility,
    batchImportUtilities,
    isCreating,
    isUpdating,
    isBatchImporting,
  } = useUtilitiesData();
  const { readyToBillCount, overdueCount } = useMonthStats(pendingUtilityBills);

  const [activeTab, setActiveTab] = useState<'entry' | 'history'>(() => {
    return searchParams.get('tab') === 'history' ? 'history' : 'entry';
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExportTemplateOpen, setIsExportTemplateOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [initialReadingRoom, setInitialReadingRoom] = useState<RoomMissingInitialReading | null>(null);
  const [editingUtility, setEditingUtility] = useState<UtilityReading | null>(null);

  const [createPreset, setCreatePreset] = useState<{
    apartmentId: string;
    roomId: string;
    periodYear: number;
    periodMonth: number;
    readingDate: string;
    waterPrevious?: number | null;
    electricityPrevious?: number | null;
  } | null>(null);

  const handleQuickEntry = useCallback(
    (record: PendingUtilityBillRow) => {
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
    },
    [currentYear, currentMonth, today],
  );

  const handleQuickUpdate = useCallback((record: PendingUtilityBillRow) => {
    if (record.currentReading) {
      setEditingUtility(record.currentReading);
    }
  }, []);

  const clearCreatePreset = useCallback(() => {
    setCreatePreset(null);
  }, []);

  const invalidateInitialReadingQueries = useCallback(
    (orgId: string) => {
      queryClient.invalidateQueries({ queryKey: ['utilities', 'rooms-missing-initial', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', orgId] });
    },
    [queryClient],
  );

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
                    clearCreatePreset();
                    setIsCreateOpen(true);
                  }}
                />
              ),
            },
            {
              key: 'history',
              label: '历史记录',
              children: (
                <Suspense
                  fallback={
                    <div className="flex h-40 items-center justify-center text-gray-400">加载中...</div>
                  }
                >
                  <HistoryTab orgId={orgId} />
                </Suspense>
              ),
            },
          ]}
        />

        {isCreateOpen && (
          <CreateUtilityDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSubmit={(data) => createUtility(data, () => setIsCreateOpen(false))}
            isPending={isCreating}
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
            onImport={(data) => batchImportUtilities(data, () => setIsBatchImportOpen(false))}
            isPending={isBatchImporting}
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
              invalidateInitialReadingQueries(orgId);
              setInitialReadingRoom(null);
            }}
          />
        )}

        {editingUtility && (
          <EditUtilityDialog
            open={!!editingUtility}
            onOpenChange={(open) => !open && setEditingUtility(null)}
            onSubmit={(data) => updateUtility(editingUtility.id, data, () => setEditingUtility(null))}
            isPending={isUpdating}
            utility={editingUtility}
          />
        )}
      </div>
    </PermissionPageGuard>
  );
}

function PageLoading() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
    </div>
  );
}

function NoOrgPlaceholder() {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center text-gray-500">
      <span className="text-lg">请先创建或加入团队</span>
    </div>
  );
}
