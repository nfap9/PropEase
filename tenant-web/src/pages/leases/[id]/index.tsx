
import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { LeaseDetailPage } from '@/features/leases/components/lease-detail-page';

export default function LeaseDetailPageRoute() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div>无效的租约ID</div>;
  }
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">加载中...</div>}>
      <LeaseDetailPage leaseId={id} />
    </Suspense>
  );
}
