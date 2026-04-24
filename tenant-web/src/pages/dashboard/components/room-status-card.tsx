import { Card, Tag } from 'antd';
import { Home } from 'lucide-react';
import { useRoomStatusCard } from '@/hooks/dashboard-room-status';
import { tenantMessages } from '@/i18n';

function RoomStatusCard({ orgId }: { orgId: string }) {
  const { availableRooms, totalRooms, isLoading } = useRoomStatusCard(orgId);

  if (isLoading) {
    return (
      <Card
        className="flex h-full min-h-0 flex-col"
        styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <div className="shrink-0 pb-2">
          <h3 className="text-sm sm:text-base">{tenantMessages.dashboard.roomStatus.title}</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground">加载中...</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="flex h-full min-h-0 flex-col"
      styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      <div className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base truncate">{tenantMessages.dashboard.roomStatus.title}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {tenantMessages.dashboard.roomStatus.available}: {availableRooms.length} /{' '}
              {tenantMessages.dashboard.roomStatus.total}: {totalRooms}
            </p>
          </div>
          <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden pt-0">
        {availableRooms.length === 0 ? (
          <p className="py-2 text-center text-xs sm:text-sm text-muted-foreground">
            {tenantMessages.dashboard.roomStatus.emptyList}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {availableRooms.map((room) => (
              <Tag
                key={room.id}
                className="px-1.5 py-0.5 text-[10px] sm:text-xs font-normal"
              >
                {room.apartment?.name ? `${room.apartment.name} - ` : ''}
                {room.room_number}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export { RoomStatusCard };
