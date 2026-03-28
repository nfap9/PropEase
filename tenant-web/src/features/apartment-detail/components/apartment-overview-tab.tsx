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
  selectedRoomIds: Set<string>;
  isBatchDeletePending: boolean;
  onOpenCreateRoom: () => void;
  onOpenBatchCreate: () => void;
  onOpenBatchEdit: () => void;
  onDeleteSelected: () => void;
  onSelectAllRooms: (select: boolean) => void;
  onToggleFloorSelection: (rooms: Room[], select: boolean) => void;
  onToggleRoomSelection: (roomId: string) => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
}

export function ApartmentOverviewTab({
  apartment,
  rooms,
  roomsLoading,
  stats,
  roomGroups,
  selectedRoomIds,
  isBatchDeletePending,
  onOpenCreateRoom,
  onOpenBatchCreate,
  onOpenBatchEdit,
  onDeleteSelected,
  onSelectAllRooms,
  onToggleFloorSelection,
  onToggleRoomSelection,
  onEditRoom,
  onDeleteRoom,
}: ApartmentOverviewTabProps) {
  const hasPropertyInfo = apartment.floors || apartment.land_area || apartment.total_area;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {hasPropertyInfo && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>物业信息</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>房间状态</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <PropertyInfoItem label="总房间数" value={String(stats.total)} valueClassName="text-2xl font-bold" />
              <PropertyInfoItem label="已出租" value={String(stats.occupied)} valueClassName="text-2xl font-bold text-blue-600" />
              <PropertyInfoItem label="空置" value={String(stats.available)} valueClassName="text-2xl font-bold text-green-600" />
              <PropertyInfoItem label="维修中" value={String(stats.maintenance)} valueClassName="text-2xl font-bold text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <ApartmentRoomListCard
        rooms={rooms}
        roomsLoading={roomsLoading}
        roomGroups={roomGroups}
        selectedRoomIds={selectedRoomIds}
        isBatchDeletePending={isBatchDeletePending}
        onOpenCreateRoom={onOpenCreateRoom}
        onOpenBatchCreate={onOpenBatchCreate}
        onOpenBatchEdit={onOpenBatchEdit}
        onDeleteSelected={onDeleteSelected}
        onSelectAllRooms={onSelectAllRooms}
        onToggleFloorSelection={onToggleFloorSelection}
        onToggleRoomSelection={onToggleRoomSelection}
        onEditRoom={onEditRoom}
        onDeleteRoom={onDeleteRoom}
      />
    </div>
  );
}

function PropertyInfoItem({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={valueClassName ?? 'font-medium'}>{value}</span>
    </div>
  );
}
