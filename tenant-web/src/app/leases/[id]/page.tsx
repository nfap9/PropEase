import { LeaseDetailPage } from '@/features/leases/components/lease-detail-page';
import { Suspense } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaseDetailPageRoute({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">加载中...</div>}>
      <LeaseDetailPage leaseId={id} />
    </Suspense>
  );
}
