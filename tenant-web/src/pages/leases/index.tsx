/**
 * LeasesPage - 租约页面入口
 *
 * 职责：组合各组件，处理跨组件协调。
 * - 签租约抽屉、初始读数对话框由入口统一管理
 * - 权限检查在入口处进行
 */
import { useCallback, useState } from 'react';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { Skeleton } from 'antd';
import { Building2 } from 'lucide-react';
import { LeaseSigningDrawer } from './components/lease-signing-drawer';
import { InitialReadingDialog } from './components';
import { LeasesListView } from './views/leases-list-view';
import type { LeaseCreatedParams } from '@/types';

export default function LeasesPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isLeaseOpen, setIsLeaseOpen] = useState(false);
  const [pendingInitialReading, setPendingInitialReading] = useState<LeaseCreatedParams | null>(null);

  const handleLeaseSuccess = useCallback(() => {
    setIsLeaseOpen(false);
  }, []);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
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
      <LeasesListView />

      <LeaseSigningDrawer
        orgId={orgId}
        open={isLeaseOpen}
        onOpenChange={setIsLeaseOpen}
        onLeaseCreated={setPendingInitialReading}
      />

      {pendingInitialReading && (
        <InitialReadingDialog
          orgId={orgId}
          roomId={pendingInitialReading.room_id}
          roomDisplay={pendingInitialReading.room_display}
          startDate={pendingInitialReading.start_date}
          isHistoricalLeaseEntry={pendingInitialReading.is_historical_entry}
          open={Boolean(pendingInitialReading)}
          onOpenChange={(open) => !open && setPendingInitialReading(null)}
          onSuccess={() => setPendingInitialReading(null)}
        />
      )}
    </PermissionPageGuard>
  );
}
