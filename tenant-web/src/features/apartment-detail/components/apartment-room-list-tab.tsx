
import type { Room } from '@/types';
import type { FloorRoomGroup } from '../apartment-detail.utils';
import { ApartmentRoomListCard } from './apartment-room-list-card';

interface ApartmentRoomListTabProps {
  rooms?: Room[];
  roomsLoading: boolean;
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

export function ApartmentRoomListTab({
  rooms,
  roomsLoading,
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
}: ApartmentRoomListTabProps) {
  return (
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
  );
}
