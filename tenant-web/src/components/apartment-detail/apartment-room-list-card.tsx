
import { useEffect, useState } from 'react';
import { Check, Home, Layers, Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { Switch } from '@apartment-ultra/shared-ui/components/ui';
import { ROOM_STATUS_CONFIG } from '@/utils/status';
import type { Room } from '@/types';
import type { RoomStatus } from '@/types';
import type { FloorRoomGroup } from '@/utils/apartment-detail';

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 py-3">
        <div className="flex flex-col gap-1">
          <CardTitle>房间列表</CardTitle>
          <CardDescription>
            {hasSelection
              ? `已选择 ${selectedRoomIds.size} 间房间`
              : `${totalRoomCount} 间房间`}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">批量选择</span>
            <Switch
              checked={isBatchSelectMode}
              onCheckedChange={onToggleBatchSelectMode}
            />
          </div>

          <Button variant="outline" size="sm" onClick={onOpenBatchCreate}>
            <Layers className="mr-2 h-4 w-4" />
            批量新增
          </Button>

          <Button size="sm" onClick={onOpenCreateRoom}>
            <Plus className="mr-2 h-4 w-4" />
            新增房间
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {roomsLoading ? (
          <Skeleton className="h-full" />
        ) : rooms && rooms.length > 0 ? (
          <div className="space-y-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {(Object.keys(ROOM_STATUS_CONFIG) as RoomStatus[]).map((status) => (
                <Badge
                  key={status}
                  variant={ROOM_STATUS_CONFIG[status].variant}
                  className="text-xs"
                >
                  {ROOM_STATUS_CONFIG[status].label}
                </Badge>
              ))}

              {/* 批量选择模式开启时显示的操作栏 */}
              {isBatchSelectMode && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-sm text-muted-foreground">
                    已选 {selectedRoomIds.size}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onOpenBatchEdit}
                    className="h-8"
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    批量编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeleteSelected}
                    disabled={isBatchDeletePending}
                    className="h-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    删除
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    className="h-8"
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
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    {isBatchSelectMode && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleFloorSelection(group.rooms, selectedCount !== group.rooms.length)
                        }
                        className="rounded p-0.5 hover:bg-accent"
                        aria-label={`${group.floor} 楼全选切换`}
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                            selectedCount === group.rooms.length && group.rooms.length > 0
                              ? 'border-primary bg-primary text-primary-foreground'
                              : selectedCount > 0
                                ? 'border-primary bg-primary/20'
                                : 'border-muted-foreground'
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
                  <div className="flex flex-wrap gap-2">
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
                          className={`group relative flex min-w-[80px] cursor-pointer flex-col items-center rounded-lg border bg-card p-2 transition-all hover:bg-accent ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                        >
                          {/* 选中角标 */}
                          {isSelected && (
                            <div
                              className="pointer-events-none absolute -left-1.5 -top-1.5 z-10"
                              aria-label="已选房间"
                            >
                              <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" />
                              </div>
                            </div>
                          )}

                          {/* 房间号 + 状态指示 */}
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-sm font-medium">{room.room_number}</span>
                            <span
                              className={`h-2 w-2 rounded-full ${statusConfig.variant === 'default' ? 'bg-muted-foreground' : statusConfig.variant === 'secondary' ? 'bg-blue-500' : statusConfig.variant === 'outline' ? 'bg-green-500' : 'bg-orange-500'}`}
                            />
                          </div>

                          {/* 租金 */}
                          <span className="text-xs text-muted-foreground">
                            {room.pricing?.monthly_rent
                              ? `¥${room.pricing.monthly_rent.toLocaleString()}`
                              : '暂无定价'}
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
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Home className="mb-4 h-12 w-12" />
            <p>暂无房间，点击上方按钮添加</p>
          </div>
        )}
      </CardContent>
      {contextMenu && (
        <div
          className="fixed z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              onEditRoom(contextMenu.room);
              setContextMenu(null);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            编辑
          </button>
          <button
            type="button"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-accent hover:text-destructive"
            onClick={() => {
              onDeleteRoom(contextMenu.room);
              setContextMenu(null);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </button>
        </div>
      )}
    </Card>
  );
}
