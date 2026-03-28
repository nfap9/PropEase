'use client';

import { Home, Users, Wrench } from 'lucide-react';

interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

interface ApartmentStatsProps {
  stats: RoomStats;
}

export function ApartmentStats({ stats }: ApartmentStatsProps) {
  const occupancyRate =
    stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-lg bg-muted/50 p-2">
          <Home className="mb-1 h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-semibold">{stats.total}</span>
          <span className="text-xs text-muted-foreground">总房间</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-green-50 p-2 dark:bg-green-950/30">
          <Home className="mb-1 h-4 w-4 text-green-600" />
          <span className="text-lg font-semibold text-green-600">{stats.available}</span>
          <span className="text-xs text-muted-foreground">空房</span>
        </div>
        <div className="flex flex-col items-center rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
          <Users className="mb-1 h-4 w-4 text-blue-600" />
          <span className="text-lg font-semibold text-blue-600">{stats.occupied}</span>
          <span className="text-xs text-muted-foreground">已租</span>
        </div>
      </div>
      {stats.maintenance > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
          <Wrench className="h-4 w-4" />
          <span>{stats.maintenance} 间房间维修中</span>
        </div>
      )}
      <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
        <span>入住率</span>
        <span className="font-medium">{occupancyRate}%</span>
      </div>
    </>
  );
}
