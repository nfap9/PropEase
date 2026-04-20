import { lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/auth';

const UtilityHistoryPanel = lazy(() =>
  import('@/pages/utilities/components/UtilityHistoryPanel').then((mod) => ({
    default: mod.UtilityHistoryPanel,
  }))
);

export default function UtilitiesHistoryPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center text-gray-500">
        <span>请先创建或加入团队</span>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      }
    >
      <UtilityHistoryPanel orgId={orgId} />
    </Suspense>
  );
}