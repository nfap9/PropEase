'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import type { Apartment, Room } from '@/types';
import type { FloorRoomGroup, RoomStats } from '../apartment-detail.utils';
import { ApartmentRoomListCard } from './apartment-room-list-card';

interface ApartmentOverviewTabProps {
  apartment: Apartment;
  rooms?: Room[];
  roomsLoading: boolean;
  stats: RoomStats;
  roomGroups: FloorRoomGroup[];
  isBatchEditMode: boolean;
  selectedRoomIds: Set<string>;
  isBatchDeletePending: boolean;
  onOpenBatchMode: () => void;
  onExitBatchMode: () => void;
  onOpenCreateRoom: () => void;
  onOpenBatchCreate: () => void;
  onOpenBatchEdit: () => void;
  onDeleteSelected: () => void;
  onSelectAllRooms: (select: boolean) => void;
  onToggleFloorSelection: (rooms: Room[], select: boolean) => void;
  onToggleRoomSelection: (roomId: string) => void;
  onRoomClick: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
}

export function ApartmentOverviewTab({
  apartment,
  rooms,
  roomsLoading,
  stats,
  roomGroups,
  isBatchEditMode,
  selectedRoomIds,
  isBatchDeletePending,
  onOpenBatchMode,
  onExitBatchMode,
  onOpenCreateRoom,
  onOpenBatchCreate,
  onOpenBatchEdit,
  onDeleteSelected,
  onSelectAllRooms,
  onToggleFloorSelection,
  onToggleRoomSelection,
  onRoomClick,
  onDeleteRoom,
}: ApartmentOverviewTabProps) {
  const hasPropertyInfo = apartment.floors || apartment.land_area || apartment.total_area;

  return (
    <div className="space-y-4">
      {hasPropertyInfo && (
        <Card>
          <CardHeader>
            <CardTitle>物业信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <PropertyInfoItem label="楼层数" value={`${apartment.floors ?? '-'} 层`} />
              <PropertyInfoItem
                label="用地面积"
                value={apartment.land_area ? `${apartment.land_area} 亩` : '-'}
              />
              <PropertyInfoItem
                label="总面积"
                value={apartment.total_area ? `${apartment.total_area} ㎡` : '-'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <ApartmentRoomListCard
        rooms={rooms}
        roomsLoading={roomsLoading}
        stats={stats}
        roomGroups={roomGroups}
        isBatchEditMode={isBatchEditMode}
        selectedRoomIds={selectedRoomIds}
        isBatchDeletePending={isBatchDeletePending}
        onOpenBatchMode={onOpenBatchMode}
        onExitBatchMode={onExitBatchMode}
        onOpenCreateRoom={onOpenCreateRoom}
        onOpenBatchCreate={onOpenBatchCreate}
        onOpenBatchEdit={onOpenBatchEdit}
        onDeleteSelected={onDeleteSelected}
        onSelectAllRooms={onSelectAllRooms}
        onToggleFloorSelection={onToggleFloorSelection}
        onToggleRoomSelection={onToggleRoomSelection}
        onRoomClick={onRoomClick}
        onDeleteRoom={onDeleteRoom}
      />
    </div>
  );
}

function PropertyInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

