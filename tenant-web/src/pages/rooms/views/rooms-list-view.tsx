/**
 * RoomsListView - 房间列表视图
 *
 * 自包含的视图组件，内部管理：
 * - useRoomsData：获取房间列表
 * - useRoomsMutations：退租、状态更新 mutation
 * - TerminateDialog 弹窗状态
 * - 搜索、筛选、视图模式状态
 *
 * 对外仅暴露 orgId 和 onLeaseSuccess（退租/签租约成功后需父组件协调刷新）。
 */
import { useCallback, useMemo, useState } from 'react';
import type { Room, RoomStatus } from '@/types';
import type { ViewMode } from '@/pages/rooms/components/rooms-view-toggle';
import type { RoomFiltersState } from '@/pages/rooms/components/room-filters';

import { RoomsStatsBar } from '../components/rooms-stats-bar';
import { RoomsSearchBar } from '../components/rooms-search-bar';
import { RoomsViewToggle } from '../components/rooms-view-toggle';
import { RoomsGroupedView } from '../components/rooms-grouped-view';
import { TerminateDialog } from './terminate-dialog';
import { EditRoomDialog } from './edit-room-dialog';
import { useRoomsData, useRoomsMutations } from '../hooks/use-rooms-page';
import type { RoomEditFormData } from '@propease/api-contract';
import type { RoomFacilities } from '@/types';
import { buildRoomFormValues } from '@/utils/apartment-detail';
import { useAuth } from '@/contexts/auth';
import { Skeleton } from 'antd';
import { Building2 } from 'lucide-react';

const DEFAULT_FILTERS: RoomFiltersState = {
  apartmentId: null,
  status: null,
  layout: null,
  rentMin: null,
  rentMax: null,
  areaMin: null,
  areaMax: null,
};

interface RoomsListViewProps {
  onLeaseSuccess?: () => void;
}

export function RoomsListView({ onLeaseSuccess }: RoomsListViewProps) {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const [filters, setFilters] = useState<RoomFiltersState>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Dialog states
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const {
    allRooms,
    apartments,
    roomsLoading,
    apartmentsLoading,
    filteredRooms,
    groupedRooms,
    getActiveLease,
  } = useRoomsData(filters, searchQuery);

  const { terminateLease, updateRoomStatus, isTerminating } = useRoomsMutations();

  const handleFilterChange = useCallback((key: keyof RoomFiltersState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value as (typeof prev)[typeof key] }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  }, []);

  const handleTerminate = useCallback((room: Room) => {
    setSelectedRoom(room);
    setIsTerminateOpen(true);
  }, []);

  const handleEdit = useCallback((room: Room) => {
    setSelectedRoom(room);
    setIsEditOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    (room: Room, status: RoomStatus) => {
      updateRoomStatus(room.id, status === 'maintenance');
    },
    [updateRoomStatus],
  );

  const handleTerminateConfirm = useCallback(() => {
    if (!selectedRoom) return;
    const activeLease = getActiveLease(selectedRoom.id);
    if (activeLease) {
      terminateLease(activeLease.id, () => {
        setIsTerminateOpen(false);
        setSelectedRoom(null);
        onLeaseSuccess?.();
      });
    }
  }, [selectedRoom, getActiveLease, terminateLease, onLeaseSuccess]);

  const handleEditSubmit = useCallback(
    (data: RoomEditFormData & { facilities?: RoomFacilities | null }) => {
      setIsEditOpen(false);
      setSelectedRoom(null);
      onLeaseSuccess?.();
    },
    [onLeaseSuccess],
  );

  const isLoading = roomsLoading || apartmentsLoading;

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">请先创建或加入团队</h2>
        <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allRooms && <RoomsStatsBar rooms={allRooms} />}

      {apartments && apartments.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <RoomsSearchBar
            apartments={apartments}
            filters={filters}
            search={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
          <RoomsViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <RoomsGroupedView
          groups={groupedRooms}
          viewMode={viewMode}
          onLease={() => {}}
          onTerminate={handleTerminate}
          onStatusChange={handleStatusChange}
        />
      )}

      <TerminateDialog
        open={isTerminateOpen}
        onOpenChange={(open) => !open && setIsTerminateOpen(false)}
        onConfirm={handleTerminateConfirm}
        isPending={isTerminating}
        room={selectedRoom}
      />

      <EditRoomDialog
        open={isEditOpen}
        onOpenChange={(open) => !open && setIsEditOpen(false)}
        apartmentName={selectedRoom?.apartment?.name}
        initialValues={selectedRoom ? buildRoomFormValues(selectedRoom) : {}}
        facilities={selectedRoom?.facilities ?? null}
        onSubmit={handleEditSubmit}
        isPending={false}
      />
    </div>
  );
}
