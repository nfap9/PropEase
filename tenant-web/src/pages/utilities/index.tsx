import { Suspense } from 'react';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Tabs } from 'antd';
import { useAuth } from '@/contexts/auth';
import { EntryTab } from './tabs/entry-tab';
import { HistoryTab } from './tabs/history-tab';
import { useUtilitiesPage } from './hooks/use-utilities-page';
import {
  CreateUtilityDialog,
  ExportTemplateDialog,
  BatchImportDialog,
  EditUtilityDialog,
} from '@/pages/utilities/components';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';

export default function UtilitiesPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const {
    pendingUtilityBills,
    monthRoomsNeedInputCount,
    monthRoomsRecordedCount,
    roomsMissingInitial,
    apartmentRooms,
    allRooms,
    apartments,
    createMutation,
    updateMutation,
    batchImportMutation,
    readyToBillCount,
    overdueCount,
    activeTab,
    setActiveTab,
    isCreateOpen,
    setIsCreateOpen,
    isExportTemplateOpen,
    setIsExportTemplateOpen,
    isBatchImportOpen,
    setIsBatchImportOpen,
    initialReadingRoom,
    setInitialReadingRoom,
    editingUtility,
    setEditingUtility,
    createPreset,
    handleQuickEntry,
    handleQuickUpdate,
    clearCreatePreset,
    invalidateInitialReadingQueries,
  } = useUtilitiesPage();

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
                <Suspense fallback={<div className="flex h-40 items-center justify-center text-gray-400">加载中...</div>}>
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
            onSubmit={(data) => updateMutation.mutate({ id: editingUtility.id, data })}
            isPending={updateMutation.isPending}
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
