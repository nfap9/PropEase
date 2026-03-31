'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { leasesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { LeaseDetailTabs } from './lease-detail-tabs';
import { LeaseDetailInfo } from './lease-detail-info';
import { LeaseChangeHistoryTab } from './lease-change-history-tab';
import { OperationsDropdown } from './operations-dropdown';

interface LeaseDetailPageProps {
  leaseId: string;
}

export function LeaseDetailPage({ leaseId }: LeaseDetailPageProps) {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const { data: lease, isLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(orgId!, leaseId),
    enabled: Boolean(orgId) && Boolean(leaseId),
  });

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
        <Link href="/leases">
          <Button variant="outline">返回列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leases">
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
            leaseId={leaseId}
            lease={lease}
          />
        )}
      </div>

      {/* Tab 切换 */}
      <LeaseDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab 内容 */}
      <div>
        {activeTab === 'info' && <LeaseDetailInfo lease={lease} orgId={orgId!} />}
        {activeTab === 'history' && <LeaseChangeHistoryTab leaseId={leaseId} orgId={orgId!} />}
      </div>
    </div>
  );
}
