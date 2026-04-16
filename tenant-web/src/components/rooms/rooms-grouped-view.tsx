
import { useState } from 'react';
import { ChevronDown, ChevronRight, Home } from 'lucide-react';
import { Room, RoomStatus } from '@/types';
import { RoomCard } from './rooms-card-grid';
import { RoomListRow } from './rooms-list-row';
import { ViewMode } from './rooms-view-toggle';
import { cn } from '@/utils';

interface ApartmentGroup {
  id: string;
  name: string;
  rooms: Room[];
}

interface RoomsGroupedViewProps {
  groups: ApartmentGroup[];
  viewMode: ViewMode;
  onLease: (room: Room) => void;
  onTerminate: (room: Room) => void;
  onStatusChange: (room: Room, status: RoomStatus) => void;
}

export function RoomsGroupedView({
  groups,
  viewMode,
  onLease,
  onTerminate,
  onStatusChange,
}: RoomsGroupedViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-stone-400">
        <Home className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">暂无房间</p>
        <p className="text-sm">在公寓详情页添加房间</p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-4">
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.id);
        const stats = {
          total: group.rooms.length,
          occupied: group.rooms.filter((r) => r.status === 'occupied').length,
          available: group.rooms.filter((r) => r.status === 'available').length,
          maintenance: group.rooms.filter((r) => r.status === 'maintenance').length,
        };

        return (
          <div key={group.id} className="space-y-2 pb-2">
            {/* Apartment header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-left transition-colors hover:bg-stone-200"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-stone-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-500" />
              )}
              <div className="flex flex-1 items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm">
                  <Home className="h-3.5 w-3.5 text-stone-600" />
                </div>
                <div>
                  <div className="font-medium text-stone-900 text-sm">{group.name}</div>
                  <div className="text-[10px] text-stone-500">
                    {stats.total} 间 · {stats.occupied} 已租 · {stats.available} 空置
                  </div>
                </div>
              </div>
            </button>

            {/* Rooms */}
            {!isCollapsed && (
              <div
                className={cn(
                  'transition-all duration-200',
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                    : 'space-y-2'
                )}
              >
                {group.rooms.map((room) =>
                  viewMode === 'grid' ? (
                    <RoomCard
                      key={room.id}
                      room={room}
                      apartmentName={group.name}
                      onLease={onLease}
                      onTerminate={onTerminate}
                      onStatusChange={onStatusChange}
                    />
                  ) : (
                    <RoomListRow
                      key={room.id}
                      room={room}
                      apartmentName={group.name}
                      onLease={onLease}
                      onTerminate={onTerminate}
                      onStatusChange={onStatusChange}
                    />
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
