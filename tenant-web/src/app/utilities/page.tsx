import { Suspense } from 'react';
import { UtilitiesPageContent, UtilitiesPageSuspenseFallback } from '@/features/utilities/components';

export default function UtilitiesPage() {
  return (
    <Suspense fallback={<UtilitiesPageSuspenseFallback />}>
      <UtilitiesPageContent />
    </Suspense>
  );
}
