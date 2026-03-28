'use client';

import { Suspense } from 'react';
import {
  BillsPageContent,
  BillsPageSuspenseFallback,
} from '@/features/bills/components/bills-page-content';

export default function BillsPage() {
  return (
    <Suspense fallback={<BillsPageSuspenseFallback />}>
      <BillsPageContent />
    </Suspense>
  );
}
