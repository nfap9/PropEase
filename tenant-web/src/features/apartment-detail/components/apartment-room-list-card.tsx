'use client';

import { useEffect, useState } from 'react';
import { Check, Home, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { ROOM_STATUS_CONFIG } from '@/lib/status-config';
import type { Room } from '@/types';
import type { RoomStatus } from '@/types';
import type { FloorRoomGroup } from '../apartment-detail.utils';
import { STATUS_BORDER_COLORS } from '../apartment-detail.schemas';

interface ApartmentRoomListCardProps {
  roomsLoading: boolean;
  rooms?: Room[];
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

export function ApartmentRoomListCard({
  roomsLoading,
  rooms,
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
}: ApartmentRoomListCardProps) {
  const [contextMenu, setContextMenu] = useState<{
    room: Room;
    x: number;
    y: number;
  } | null>(null);
  const totalRoomCount = rooms?.length ?? 0;
  const isAllSelected = totalRoomCount > 0 && selectedRoomIds.size === totalRoomCount;
  const responsiveIconClassName = 'hidden h-4 w-4 shrink-0 md:mr-2 md:inline-block';

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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>房间列表</CardTitle>
          <CardDescription>管理该公寓的所有房间</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectAllRooms(!isAllSelected)}
          >
            {isAllSelected ? '取消全选' : '全选'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedRoomIds.size === 0}
            onClick={onOpenBatchEdit}
          >
            <Pencil className={responsiveIconClassName} />
            编辑{selectedRoomIds.size > 0 ? ` (${selectedRoomIds.size})` : ''}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedRoomIds.size === 0 || isBatchDeletePending}
            onClick={onDeleteSelected}
          >
            <Trash2 className={responsiveIconClassName} />
            删除{selectedRoomIds.size > 0 ? ` (${selectedRoomIds.size})` : ''}
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenBatchCreate}>
            <Layers className={responsiveIconClassName} />
            批量添加
          </Button>
          <Button size="sm" onClick={onOpenCreateRoom}>
            <Plus className={responsiveIconClassName} />
            新增房间
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {roomsLoading ? (
          <Skeleton className="h-64" />
        ) : rooms && rooms.length > 0 ? (
          <>
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
            </div>

            <div className="space-y-6">
              {roomGroups.map((group) => {
                const selectedCount = group.rooms.filter((room) => selectedRoomIds.has(room.id)).length;
                return (
                  <div key={group.floor} className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
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
                        return (
                          <div
                            key={room.id}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            onClick={() => onToggleRoomSelection(room.id)}
                            onContextMenu={(event) => {
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
                                onToggleRoomSelection(room.id);
                              }
                            }}
                            className={`relative flex min-w-[72px] cursor-pointer flex-col items-center rounded-lg border-2 bg-card p-2 transition-all hover:bg-accent ${STATUS_BORDER_COLORS[room.status]} ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                          >
                            {isSelected && (
                              <div
                                className="pointer-events-none absolute -left-2 -top-2 z-10"
                                aria-label="已选房间"
                              >
                                <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground">
                                  <Check className="h-3 w-3" />
                                </div>
                              </div>
                            )}
                            <span className="font-mono text-sm font-medium">{room.room_number}</span>
                            <span className="text-xs text-muted-foreground">
                              ¥{room.monthly_rent.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground/70">{room.layout || '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
