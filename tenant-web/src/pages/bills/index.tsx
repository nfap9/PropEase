
import { Suspense } from 'react';
import {
  BillsPageContent,
  BillsPageSuspenseFallback,
} from '@/components/bills/bills-page-content';

export default function BillsPage() {
  return (
    <Suspense fallback={<BillsPageSuspenseFallback />}>
      <BillsPageContent />
    </Suspense>
  );
}
