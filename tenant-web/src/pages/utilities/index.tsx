/**
 * UtilitiesPage - 水电费管理页面入口
 *
 * 职责：组合各 Tab 视图，跨组件协调 InitialReadingDialog。
 */
import { Suspense, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Tabs } from 'antd';
import { useAuth } from '@/contexts/auth';
import { useQueryClient } from '@tanstack/react-query';
import { EntryTab } from './views/entry/entry-tab';
import { HistoryTab } from './views/history/history-tab';
import { InitialReadingDialog } from '@/pages/leases/initial-reading';
import type { RoomMissingInitialReading } from '@/types';

function PageLoading() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
    </div>
  );
}

export default function UtilitiesPage() {
  const [searchParams] = useSearchParams();
  const { organization, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'entry' | 'history'>(() => {
    return searchParams.get('tab') === 'history' ? 'history' : 'entry';
  });

  const [initialReadingRoom, setInitialReadingRoom] = useState<RoomMissingInitialReading | null>(null);

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
              children: <EntryTab onMissingEntry={setInitialReadingRoom} />,
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
                  <HistoryTab />
                </Suspense>
              ),
            },
          ]}
        />
      </div>

      {initialReadingRoom && (
        <InitialReadingDialog
          orgId={organization?.id ?? ''}
          roomId={initialReadingRoom.room_id}
          roomDisplay={`${initialReadingRoom.apartment_name} - ${initialReadingRoom.room_number}`}
          startDate={initialReadingRoom.lease_start_date}
          open={!!initialReadingRoom}
          onOpenChange={(open) => !open && setInitialReadingRoom(null)}
          onSuccess={() => {
            if (organization?.id) {
              invalidateInitialReadingQueries(organization.id);
            }
            setInitialReadingRoom(null);
          }}
        />
      )}
    </PermissionPageGuard>
  );
}
