'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { leasesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';

interface LeaseDetailPageProps {
  leaseId: string;
}

// 占位组件，后续 Task 会创建实际的子组件
function LeaseDetailTabsPlaceholder() {
  return <div className="text-muted-foreground">Tab 组件加载中...</div>;
}

function LeaseDetailInfoPlaceholder() {
  return <div className="text-muted-foreground">详情内容加载中...</div>;
}

export function LeaseDetailPage({ leaseId }: LeaseDetailPageProps) {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [activeTab, setActiveTab] = useState<'info' | 'fee-items' | 'history'>('info');

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
          <Button variant="outline" size="sm" disabled>
            操作（开发中）
          </Button>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-4 border-b">
        <button
          className={`pb-2 px-1 text-sm font-medium ${
            activeTab === 'info'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('info')}
        >
          详情
        </button>
        <button
          className={`pb-2 px-1 text-sm font-medium ${
            activeTab === 'fee-items'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('fee-items')}
        >
          费用项目
        </button>
        <button
          className={`pb-2 px-1 text-sm font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('history')}
        >
          变更历史
        </button>
      </div>

      {/* Tab 内容 */}
      <div>
        {activeTab === 'info' && <LeaseDetailInfoPlaceholder />}
        {activeTab === 'fee-items' && <div className="text-muted-foreground">费用项目 Tab 开发中...</div>}
        {activeTab === 'history' && <div className="text-muted-foreground">变更历史 Tab 开发中...</div>}
      </div>
    </div>
  );
}