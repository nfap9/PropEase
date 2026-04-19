import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[380px] rounded-xl" />
    </div>
  );
}
