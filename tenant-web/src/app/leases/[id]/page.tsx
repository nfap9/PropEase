'use client';

import { LeaseDetailPage } from '@/features/leases/components/lease-detail-page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaseDetailPageRoute({ params }: PageProps) {
  const { id } = await params;
  return <LeaseDetailPage leaseId={id} />;
}
