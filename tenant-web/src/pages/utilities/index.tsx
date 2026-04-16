import { Suspense } from 'react';
import { UtilitiesPageContent } from '@/components/utilities';

export default function UtilitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      }
    >
      <UtilitiesPageContent />
    </Suspense>
  );
}
