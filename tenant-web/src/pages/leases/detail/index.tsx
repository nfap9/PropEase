import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { leasesApi } from '@/api';
import { useAuth } from '@/contexts/auth';
import { LeaseDetailTabs } from '@/components/leases/lease-detail-tabs';
import { LeaseDetailInfo } from '@/components/leases/lease-detail-info';
import { LeaseChangeHistoryTab } from '@/components/leases/lease-change-history-tab';
import { OperationsDropdown } from '@/components/leases/operations-dropdown';

export default function LeaseDetailPageRoute() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const { data: lease, isLoading } = useQuery({
    queryKey: ['lease', id],
    queryFn: () => leasesApi.get(orgId!, id!),
    enabled: Boolean(orgId) && Boolean(id),
  });

  if (!id) {
    return <div>无效的租约ID</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-4">
        <p className="text-muted-foreground">租约不存在</p>
        <Link to="/leases">
          <Button variant="outline">返回列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">加载中...</div>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/leases">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">租约详情</h1>
              <p className="text-sm text-muted-foreground">
                {lease.room?.apartment?.name} - {lease.room?.room_number}
              </p>
            </div>
          </div>
          {orgId && (
            <OperationsDropdown
              orgId={orgId}
              leaseId={id}
              lease={lease}
            />
          )}
        </div>

        <LeaseDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div>
          {activeTab === 'info' && <LeaseDetailInfo lease={lease} />}
          {activeTab === 'history' && <LeaseChangeHistoryTab leaseId={id} orgId={orgId!} />}
        </div>
      </div>
    </Suspense>
  );
}
