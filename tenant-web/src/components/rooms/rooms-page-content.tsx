
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { roomsApi, apartmentsApi, leasesApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { useAuth } from '@/contexts/auth';
import { Room, RoomStatus } from '@/types';
import { Building2 } from 'lucide-react';

import { RoomsStatsBar } from './rooms-stats-bar';
import { RoomsSearchBar } from './rooms-search-bar';
import { RoomsViewToggle, type ViewMode } from './rooms-view-toggle';
import { RoomsGroupedView } from './rooms-grouped-view';
import { RoomFiltersState } from './room-filters';
import { LeaseSigningDrawer } from '@/components/leases/lease-signing-drawer';
import type { LeaseCreatedParams } from '@/components/common/lease-form-dialog';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';
import { TerminateDialog } from './TerminateDialog';

export function RoomsPageContent() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [filters, setFilters] = useState<RoomFiltersState>({
    apartmentId: null,
    status: null,
    layout: null,
    rentMin: null,
    rentMax: null,
    areaMin: null,
    areaMax: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLeaseOpen, setIsLeaseOpen] = useState(false);
  const [pendingInitialReading, setPendingInitialReading] = useState<LeaseCreatedParams | null>(
    null
  );
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleLeaseSuccess = () => {
    setSelectedRoom(null);
    setIsLeaseOpen(false);
  };

  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: leases } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(orgId!, true),
    enabled: !!orgId,
  });

  const { data: allRooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['all-rooms', orgId, apartments],
    queryFn: async () => {
      if (!apartments || apartments.length === 0) return [];
      const apartmentIds = apartments.map((apt) => apt.id);
      const rooms = await roomsApi.listAll(orgId!, apartmentIds);
      const apartmentMap = new Map(apartments.map((apt) => [apt.id, apt]));
      return rooms.map((room) => ({
        ...room,
        apartment: apartmentMap.get(room.apartment_id),
      }));
    },
    enabled: !!orgId && !!apartments && apartments.length > 0,
  });

  const filteredRooms = useMemo(() => {
    if (!allRooms) return [];

    return allRooms.filter((room) => {
      if (filters.apartmentId && room.apartment_id !== filters.apartmentId) {
        return false;
      }
      if (filters.status && room.status !== filters.status) {
        return false;
      }
      if (filters.layout && room.layout !== filters.layout) {
        return false;
      }
      if (filters.rentMin !== null && room.monthly_rent < filters.rentMin) {
        return false;
      }
      if (filters.rentMax !== null && room.monthly_rent > filters.rentMax) {
        return false;
      }
      if (filters.areaMin !== null && (room.area === null || room.area < filters.areaMin)) {
        return false;
      }
      if (filters.areaMax !== null && (room.area === null || room.area > filters.areaMax)) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchRoomNumber = room.room_number.toLowerCase().includes(query);
        const matchNotes = room.notes?.toLowerCase().includes(query) || false;
        if (!matchRoomNumber && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [allRooms, filters, searchQuery]);

  // Group rooms by apartment
  const groupedRooms = useMemo(() => {
    if (!filteredRooms || filteredRooms.length === 0) return [];

    const groups = new Map<string, { id: string; name: string; rooms: Room[] }>();

    filteredRooms.forEach((room) => {
      const aptId = room.apartment_id;
      const aptName = room.apartment?.name || '未知公寓';

      if (!groups.has(aptId)) {
        groups.set(aptId, { id: aptId, name: aptName, rooms: [] });
      }
      groups.get(aptId)!.rooms.push(room);
    });

    // Sort groups by apartment name
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredRooms]);

  const handleFilterChange = (key: keyof RoomFiltersState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      apartmentId: null,
      status: null,
      layout: null,
      rentMin: null,
      rentMax: null,
      areaMin: null,
      areaMax: null,
    });
    setSearchQuery('');
  };

  const terminateLeaseMutation = useMutation({
    mutationFn: (leaseId: string) => leasesApi.terminate(orgId!, leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsTerminateOpen(false);
      setSelectedRoom(null);
      appToast.success('退租成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '退租失败，请重试')),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) =>
      roomsApi.update(orgId!, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      appToast.success('状态更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '状态更新失败，请重试')),
  });

  const handleLease = (room: Room) => {
    setSelectedRoom(room);
    setIsLeaseOpen(true);
  };

  const handleTerminate = (room: Room) => {
    setSelectedRoom(room);
    setIsTerminateOpen(true);
  };

  const handleStatusChange = (room: Room, status: RoomStatus) => {
    updateStatusMutation.mutate({ id: room.id, status });
  };

  const getActiveLease = (roomId: string) => {
    return leases?.find((lease) => lease.room_id === roomId && lease.is_active);
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">请先创建或加入团队</h2>
        <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  const isLoading = roomsLoading || apartmentsLoading;

  return (
    <PermissionPageGuard>
      <div className="space-y-6">
          {/* Stats bar */}
          {allRooms && <RoomsStatsBar rooms={allRooms} />}

          {/* Search and filters */}
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

          {/* Rooms content */}
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
              onLease={handleLease}
              onTerminate={handleTerminate}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>

        <LeaseSigningDrawer
          orgId={orgId!}
          open={isLeaseOpen}
          onOpenChange={setIsLeaseOpen}
          room={selectedRoom}
          onSuccess={handleLeaseSuccess}
          onLeaseCreated={setPendingInitialReading}
        />

        {pendingInitialReading && (
          <InitialReadingDialog
            orgId={orgId!}
            roomId={pendingInitialReading.room_id}
            roomDisplay={pendingInitialReading.room_display}
            startDate={pendingInitialReading.start_date}
            isHistoricalLeaseEntry={pendingInitialReading.is_historical_entry}
            open={!!pendingInitialReading}
            onOpenChange={(open) => !open && setPendingInitialReading(null)}
            onSuccess={() => setPendingInitialReading(null)}
          />
        )}

        <TerminateDialog
          open={isTerminateOpen}
          onOpenChange={setIsTerminateOpen}
          onConfirm={() => {
            if (selectedRoom) {
              const activeLease = getActiveLease(selectedRoom.id);
              if (activeLease) {
                terminateLeaseMutation.mutate(activeLease.id);
              }
            }
          }}
          isPending={terminateLeaseMutation.isPending}
          room={selectedRoom}
        />
    </PermissionPageGuard>
  );
}
