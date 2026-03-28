'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { DataTable } from '@/components/common/data-table';
import { LeaseSigningDrawer } from '@/features/leases/components/lease-signing-drawer';
import type { LeaseCreatedParams } from '@/components/common/lease-form-dialog';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { roomsApi, apartmentsApi, leasesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import { Room, RoomStatus } from '@/types';
import { Building2 } from 'lucide-react';
import {
  RoomStatsCards,
  RoomFilters,
  RoomFiltersState,
  useColumns,
  TerminateDialog,
} from './components';

// 注意: 实际使用时从 testids 导入 ROOMS 常量
const ROOMS = {
  HEADING: 'rooms-heading',
  SEARCH_INPUT: 'rooms-search-input',
  LIST: 'rooms-list',
  TERMINATE_DIALOG: 'rooms-terminate-dialog',
  CONFIRM_TERMINATE_BTN: 'rooms-confirm-terminate-btn',
  FILTER_TOGGLE: 'rooms-filter-toggle',
  APARTMENT_FILTER: 'rooms-apartment-filter',
  STATUS_FILTER: 'rooms-status-filter',
  LAYOUT_FILTER: 'rooms-layout-filter',
  RENT_MIN_INPUT: 'rooms-rent-min-input',
  RENT_MAX_INPUT: 'rooms-rent-max-input',
  AREA_MIN_INPUT: 'rooms-area-min-input',
  AREA_MAX_INPUT: 'rooms-area-max-input',
  CLEAR_FILTERS_BTN: 'rooms-clear-filters-btn',
} as const;

export default function RoomsPage() {
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

  const columns = useColumns({
    onLease: handleLease,
    onTerminate: handleTerminate,
    onStatusChange: handleStatusChange,
  });

  if (authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!orgId) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" data-testid={ROOMS.HEADING}>全部房间</h1>
          </div>

          {allRooms && <RoomStatsCards rooms={allRooms} />}

          {roomsLoading || apartmentsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <DataTable
              columns={columns}
              data={filteredRooms}
              testid={ROOMS.LIST}
              toolbar={
                apartments && apartments.length > 0 ? (
                  <RoomFilters
                    testids={ROOMS}
                    apartments={apartments}
                    filters={filters}
                    search={searchQuery}
                    onSearchChange={setSearchQuery}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                ) : null
              }
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
            open={!!pendingInitialReading}
            onOpenChange={(open) => !open && setPendingInitialReading(null)}
            onSuccess={() => setPendingInitialReading(null)}
          />
        )}

        <TerminateDialog
          testids={ROOMS}
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

      </MainLayout>
    </PermissionPageGuard>
  );
}
