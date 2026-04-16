
import { Card, CardContent } from '@apartment-ultra/shared-ui/components/ui';
import { Room } from '@/types';
import { Home, Users, Wrench, CheckCircle } from 'lucide-react';

interface RoomStatsCardsProps {
  rooms: Room[];
}

export function RoomStatsCards({ rooms }: RoomStatsCardsProps) {
  const stats = {
    total: rooms.length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    available: rooms.filter((r) => r.status === 'available').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  };

  return (
    <Card>
      <CardContent className="px-5 pb-4 pt-4 sm:px-6 sm:pt-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="min-w-[104px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="h-4 w-4" />
              总房间数
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{stats.total}</div>
          </div>
          <div className="min-w-[104px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-blue-500" />
              已出租
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-blue-600">{stats.occupied}</div>
          </div>
          <div className="min-w-[104px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              空置
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-green-600">{stats.available}</div>
          </div>
          <div className="min-w-[104px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench className="h-4 w-4 text-orange-500" />
              维修中
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-orange-600">{stats.maintenance}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
