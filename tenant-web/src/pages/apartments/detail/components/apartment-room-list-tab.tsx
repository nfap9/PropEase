
import type { Room } from '@/types';
import type { FloorRoomGroup } from '@/types';
import { ApartmentRoomListCard } from './apartment-room-list-card';

interface ApartmentRoomListTabProps {
  rooms?: Room[];
  roomsLoading: boolean;
  roomGroups: FloorRoomGroup[];
  selectedRoomIds: Set<string>;
  isBatchSelectMode: boolean;
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
  onToggleBatchSelectMode: () => void;
  onClearSelection: () => void;
  /** 是否有创建房间权限 */
  canCreateRoom?: boolean;
  /** 是否有编辑房间权限 */
  canEditRoom?: boolean;
  /** 是否有删除房间权限 */
  canDeleteRoom?: boolean;
}

export function ApartmentRoomListTab({
  rooms,
  roomsLoading,
  roomGroups,
  selectedRoomIds,
  isBatchSelectMode,
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
  onToggleBatchSelectMode,
  onClearSelection,
  canCreateRoom = true,
  canEditRoom = true,
  canDeleteRoom = true,
}: ApartmentRoomListTabProps) {
  return (
    <ApartmentRoomListCard
      rooms={rooms}
      roomsLoading={roomsLoading}
      roomGroups={roomGroups}
      selectedRoomIds={selectedRoomIds}
      isBatchSelectMode={isBatchSelectMode}
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
      onToggleBatchSelectMode={onToggleBatchSelectMode}
      onClearSelection={onClearSelection}
      canCreateRoom={canCreateRoom}
      canEditRoom={canEditRoom}
      canDeleteRoom={canDeleteRoom}
    />
  );
}
