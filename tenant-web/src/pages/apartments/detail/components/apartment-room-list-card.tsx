
import { useEffect, useState } from 'react';
import { Check, Home, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Skeleton, Switch } from 'antd';
import { ROOM_STATUS_CONFIG } from '@/constants/status';
import type { Room } from '@/types';
import type { RoomStatus } from '@/types';
import type { FloorRoomGroup } from '@/types';

interface ApartmentRoomListCardProps {
  roomsLoading: boolean;
  rooms?: Room[];
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

export function ApartmentRoomListCard({
  roomsLoading,
  rooms,
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
}: ApartmentRoomListCardProps) {
  const [contextMenu, setContextMenu] = useState<{
    room: Room;
    x: number;
    y: number;
  } | null>(null);
  const totalRoomCount = rooms?.length ?? 0;
  const isAllSelected = totalRoomCount > 0 && selectedRoomIds.size === totalRoomCount;
  const hasSelection = selectedRoomIds.size > 0;

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeContextMenu = () => setContextMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('pointerdown', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('pointerdown', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [contextMenu]);

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span>房间列表</span>
          <span className="text-sm font-normal text-gray-500">
            {hasSelection
              ? `已选择 ${selectedRoomIds.size} 间房间`
              : `${totalRoomCount} 间房间`}
          </span>
        </div>
      }
      className="text-sm"
      extra={
        <div className="flex items-center gap-2">
          {canEditRoom && (
            <>
              <span className="text-sm text-gray-500">批量选择</span>
              <Switch
                checked={isBatchSelectMode}
                onChange={onToggleBatchSelectMode}
              />

              {canCreateRoom && (
                <Button size="small" onClick={onOpenBatchCreate} icon={<Layers className="h-4 w-4" />}>
                  批量新增
                </Button>
              )}
            </>
          )}

          {canCreateRoom && (
            <Button size="small" type="primary" onClick={onOpenCreateRoom} icon={<Plus className="h-4 w-4" />}>
              新增房间
            </Button>
          )}
        </div>
      }
    >
      {roomsLoading ? (
        <Skeleton active />
      ) : rooms && rooms.length > 0 ? (
        <div className="space-y-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(Object.keys(ROOM_STATUS_CONFIG) as RoomStatus[]).map((status) => (
              <Badge
                key={status}
                color={ROOM_STATUS_CONFIG[status].variant === 'success' ? 'green' : ROOM_STATUS_CONFIG[status].variant === 'warning' ? 'orange' : 'blue'}
              >
                {ROOM_STATUS_CONFIG[status].label}
              </Badge>
            ))}

            {/* 批量选择模式开启时显示的操作栏 */}
            {isBatchSelectMode && (
              <>
                <div className="h-4 w-px bg-gray-200" />
                <span className="text-sm text-gray-500">
                  已选 {selectedRoomIds.size}
                </span>
                {canEditRoom && (
                  <Button
                    type="text"
                    size="small"
                    onClick={onOpenBatchEdit}
                    icon={<Pencil className="h-4 w-4" />}
                  >
                    批量编辑
                  </Button>
                )}
                {canDeleteRoom && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    onClick={onDeleteSelected}
                    disabled={isBatchDeletePending}
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    删除
                  </Button>
                )}
                <Button
                  type="text"
                  size="small"
                  onClick={onClearSelection}
                >
                  取消
                </Button>
              </>
            )}
          </div>

          {roomGroups.map((group) => {
            const selectedCount = group.rooms.filter((room) => selectedRoomIds.has(room.id)).length;
            return (
              <div key={group.floor} className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  {isBatchSelectMode && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleFloorSelection(group.rooms, selectedCount !== group.rooms.length)
                      }
                      className="rounded p-0.5 hover:bg-gray-100"
                      aria-label={`${group.floor} 楼全选切换`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                          selectedCount === group.rooms.length && group.rooms.length > 0
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : selectedCount > 0
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-400'
                        }`}
                      >
                        {selectedCount === group.rooms.length && group.rooms.length > 0 && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    </button>
                  )}
                  <Layers className="h-4 w-4" />
                  {group.floor} 楼
                  <span className="text-xs">
                    ({group.rooms.length} 间
                    {selectedCount > 0 && `，已选 ${selectedCount}`})
                  </span>
                </h4>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1.5">
                  {group.rooms.map((room) => {
                    const isSelected = selectedRoomIds.has(room.id);
                    const statusConfig = ROOM_STATUS_CONFIG[room.status];
                    const handleClick = () => {
                      if (isBatchSelectMode) {
                        onToggleRoomSelection(room.id);
                      } else {
                        onEditRoom(room);
                      }
                    };
                    return (
                      <div
                        key={room.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={handleClick}
                        onContextMenu={(event) => {
                          if (isBatchSelectMode) {
                            event.preventDefault();
                            return;
                          }
                          event.preventDefault();
                          setContextMenu({
                            room,
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleClick();
                          }
                        }}
                        className={`group relative flex h-16 cursor-pointer flex-col justify-between rounded-md border-2 bg-white px-2 py-1.5 transition-all hover:bg-gray-50 ${
                          isSelected
                            ? 'ring-2 ring-blue-500 ring-offset-1'
                            : statusConfig.variant === 'success'
                              ? 'border-green-500/60'
                              : statusConfig.variant === 'info'
                                ? 'border-blue-500/60'
                                : statusConfig.variant === 'warning'
                                  ? 'border-amber-500/60'
                                  : 'border-gray-200'
                        }`}
                      >
                        {/* 选中角标 */}
                        {isSelected && (
                          <div
                            className="pointer-events-none absolute -left-1 -top-1 z-10"
                            aria-label="已选房间"
                          >
                            <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-500 text-white">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          </div>
                        )}

                        {/* 房间号 */}
                        <span className="font-mono text-xs font-medium leading-none">{room.room_number}</span>

                        {/* 户型面积 */}
                        <span className="text-[10px] text-gray-400 leading-none">
                          {room.layout && room.area ? `${room.layout} ${room.area}m²` : room.layout || (room.area ? `${room.area}m²` : '')}
                        </span>

                        {/* 租金 */}
                        <span className="text-[10px] text-gray-400 leading-none">
                          {room.pricing?.monthly_rent
                            ? `¥${room.pricing.monthly_rent}`
                            : '--'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Home className="mb-4 h-12 w-12" />
          <p>暂无房间，点击上方按钮添加</p>
        </div>
      )}
    </Card>
  );
}
