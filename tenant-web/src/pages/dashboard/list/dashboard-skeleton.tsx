function DashboardSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 sm:h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid flex-1 gap-3 grid-cols-1 lg:grid-cols-2 min-h-0" style={{ minHeight: '200px' }}>
        {[1, 2].map((i) => (
          <div key={i} className="h-full min-h-0 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid flex-1 gap-3 grid-cols-1 lg:grid-cols-2 min-h-0" style={{ minHeight: '200px' }}>
        {[1, 2].map((i) => (
          <div key={i} className="h-full min-h-0 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export { DashboardSkeleton };
