'use client';

import { Check, CheckCircle, Home, Layers, Pencil, Trash2, X } from 'lucide-react';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { ROOM_STATUS_CONFIG } from '@/lib/status-config';
import type { Room, RoomStatus } from '@/types';
import type { FloorRoomGroup, RoomStats } from '../apartment-detail.utils';
import { STATUS_BORDER_COLORS } from '../apartment-detail.schemas';

interface ApartmentRoomListCardProps {
  roomsLoading: boolean;
  rooms?: Room[];
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

export function ApartmentRoomListCard({
  roomsLoading,
  rooms,
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
}: ApartmentRoomListCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>房间列表</CardTitle>
          <CardDescription>管理该公寓的所有房间</CardDescription>
        </div>
        <div className="flex gap-2">
          {isBatchEditMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onSelectAllRooms(true)}>
                全选
              </Button>
              <Button variant="outline" size="sm" onClick={() => onSelectAllRooms(false)}>
                取消全选
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedRoomIds.size === 0}
                onClick={onOpenBatchEdit}
              >
                <Pencil className="mr-2 h-4 w-4" />
                批量编辑 ({selectedRoomIds.size})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedRoomIds.size === 0 || isBatchDeletePending}
                onClick={onDeleteSelected}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除 ({selectedRoomIds.size})
              </Button>
              <Button variant="ghost" size="sm" onClick={onExitBatchMode}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onOpenBatchMode}>
                <CheckCircle className="mr-2 h-4 w-4" />
                批量操作
              </Button>
              <Button variant="outline" onClick={onOpenBatchCreate}>
                <Layers className="mr-2 h-4 w-4" />
                批量添加
              </Button>
              <Button onClick={onOpenCreateRoom}>新增房间</Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {roomsLoading ? (
          <Skeleton className="h-64" />
        ) : rooms && rooms.length > 0 ? (
          <>
            <div className="mb-4 flex items-center gap-2">
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

            <div className="mb-6 grid grid-cols-4 gap-4">
              <RoomStatItem label="总房间数" value={stats.total} />
              <RoomStatItem label="已出租" value={stats.occupied} valueClassName="text-blue-600" />
              <RoomStatItem label="空置" value={stats.available} valueClassName="text-green-600" />
              <RoomStatItem label="维修中" value={stats.maintenance} valueClassName="text-orange-600" />
            </div>

            <div className="space-y-6">
              {roomGroups.map((group) => {
                const selectedCount = group.rooms.filter((room) => selectedRoomIds.has(room.id)).length;
                return (
                  <div key={group.floor} className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      {isBatchEditMode && (
                        <button
                          type="button"
                          onClick={() =>
                            onToggleFloorSelection(group.rooms, selectedCount !== group.rooms.length)
                          }
                          className="rounded p-0.5 hover:bg-accent"
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                              selectedCount === group.rooms.length
                                ? 'border-primary bg-primary text-primary-foreground'
                                : selectedCount > 0
                                  ? 'border-primary bg-primary/20'
                                  : 'border-muted-foreground'
                            }`}
                          >
                            {selectedCount === group.rooms.length && <Check className="h-3 w-3" />}
                          </div>
                        </button>
                      )}
                      <Layers className="h-4 w-4" />
                      {group.floor} 楼
                      <span className="text-xs">
                        ({group.rooms.length} 间
                        {isBatchEditMode && selectedCount > 0 && `，已选 ${selectedCount}`})
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
                            onClick={() =>
                              isBatchEditMode ? onToggleRoomSelection(room.id) : onRoomClick(room)
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                if (isBatchEditMode) {
                                  onToggleRoomSelection(room.id);
                                } else {
                                  onRoomClick(room);
                                }
                              }
                            }}
                            className={`group relative flex min-w-[72px] cursor-pointer flex-col items-center rounded-lg border-2 bg-card p-2 transition-all hover:bg-accent ${STATUS_BORDER_COLORS[room.status]} ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                          >
                            {isBatchEditMode && (
                              <div className="absolute -left-1 -top-1">
                                <div
                                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                    isSelected
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-muted-foreground bg-background'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </div>
                            )}
                            <span className="font-mono text-sm font-medium">{room.room_number}</span>
                            <span className="text-xs text-muted-foreground">
                              ¥{room.monthly_rent.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground/70">{room.layout || '-'}</span>
                            {!isBatchEditMode && (
                              <div className="absolute -right-1 -top-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onDeleteRoom(room);
                                  }}
                                  className="rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/80"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
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
    </Card>
  );
}

function RoomStatItem({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-2xl font-bold ${valueClassName ?? ''}`}>{value}</span>
    </div>
  );
}

