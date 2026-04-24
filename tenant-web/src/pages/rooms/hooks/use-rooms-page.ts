import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roomsApi, apartmentsApi } from '@/api/apartments';
import { leasesApi } from '@/api/leases';
import { getErrorMessage } from '@/utils/error';
import { useAuth } from '@/contexts/auth';
import { Room, RoomStatus, ApartmentWithStats, Lease } from '@/types';
import type { LeaseCreatedParams } from '@/types';
import type { ViewMode } from '@/pages/rooms/components/rooms-view-toggle';
import type { RoomFiltersState } from '@/pages/rooms/components/room-filters';

export interface RoomsPageState {
  // Data
  allRooms: (Room & { apartment?: { id: string; name: string } })[] | undefined;
  apartments: ApartmentWithStats[] | undefined;
  leases: Lease[] | undefined;
  roomsLoading: boolean;
  apartmentsLoading: boolean;

  // UI State
  filters: RoomFiltersState;
  searchQuery: string;
  viewMode: ViewMode;
  isLeaseOpen: boolean;
  pendingInitialReading: LeaseCreatedParams | null;
  isTerminateOpen: boolean;
  selectedRoom: Room | null;

  // Computed
  filteredRooms: (Room & { apartment?: { id: string; name: string } })[];
  groupedRooms: { id: string; name: string; rooms: Room[] }[];

  // Mutations
  terminateLeaseMutation: ReturnType<typeof useMutation<unknown, Error, string>>;
  updateStatusMutation: ReturnType<typeof useMutation<Room, Error, { id: string; maintenance: boolean }>>;

  // Actions
  handleLease: (room: Room) => void;
  handleTerminate: (room: Room) => void;
  handleStatusChange: (room: Room, status: RoomStatus) => void;
  handleFilterChange: (key: keyof RoomFiltersState, value: unknown) => void;
  setSearchQuery: (query: string) => void;
  handleClearFilters: () => void;
  handleLeaseSuccess: () => void;
  closeLeaseDrawer: () => void;
  closeTerminateDialog: () => void;
  setViewMode: (mode: ViewMode) => void;
  getActiveLease: (roomId: string) => Lease | undefined;
  setPendingInitialReading: (value: LeaseCreatedParams | null) => void;
  setLeaseOpen: (open: boolean) => void;
}

export function useRoomsPage(): RoomsPageState {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
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
  const [searchQuery, _setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLeaseOpen, _setIsLeaseOpen] = useState(false);
  const [pendingInitialReading, _setPendingInitialReading] = useState<LeaseCreatedParams | null>(null);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId,
  });

  const { data: leases } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(true),
    enabled: !!orgId,
  });

  const { data: allRooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['all-rooms', orgId, apartments],
    queryFn: async () => {
      if (!apartments || apartments.length === 0) return [];
      const apartmentIds = apartments.map((apt) => apt.id);
      const rooms = await roomsApi.listAll(apartmentIds);
      const apartmentMap = new Map(apartments.map((apt) => [apt.id, apt]));
      return rooms.map((room) => ({
        ...room,
        apartment: apartmentMap.get(room.apartment_id),
      }));
    },
    enabled: !!orgId && !!apartments && apartments.length > 0,
  });

  const terminateLeaseMutation = useMutation({
    mutationFn: (leaseId: string) => leasesApi.terminate(leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      closeTerminateDialog();
      toast.success('退租成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '退租失败，请重试')),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, maintenance }: { id: string; maintenance: boolean }) =>
      roomsApi.update(id, { maintenance }),
    onSuccess: (updatedRoom) => {
      const allRoomsKeys = queryClient.getQueriesData<Array<Room & { apartment?: unknown }>>({
        queryKey: ['all-rooms', orgId],
      });
      for (const [key, data] of allRoomsKeys) {
        if (Array.isArray(data)) {
          queryClient.setQueryData(key, data.map((room) =>
            room.id === updatedRoom.id ? { ...room, status: updatedRoom.status } : room
          ));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      toast.success('状态更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '状态更新失败，请重试')),
  });

  const handleLease = useCallback((room: Room) => {
    setSelectedRoom(room);
    _setIsLeaseOpen(true);
  }, []);

  const handleTerminate = useCallback((room: Room) => {
    setSelectedRoom(room);
    setIsTerminateOpen(true);
  }, []);

  const handleStatusChange = useCallback((room: Room, status: RoomStatus) => {
    updateStatusMutation.mutate({ id: room.id, maintenance: status === 'maintenance' });
  }, [updateStatusMutation]);

  const handleFilterChange = useCallback((key: keyof RoomFiltersState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    _setSearchQuery(query);
  }, []);

  const handleClearFilters = useCallback(() => {
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
  }, []);

  const handleLeaseSuccess = useCallback(() => {
    setSelectedRoom(null);
    _setIsLeaseOpen(false);
  }, []);

  const closeLeaseDrawer = useCallback(() => _setIsLeaseOpen(false), []);
  const closeTerminateDialog = useCallback(() => {
    setIsTerminateOpen(false);
    setSelectedRoom(null);
  }, []);

  const setPendingInitialReading = useCallback((value: LeaseCreatedParams | null) => {
    _setPendingInitialReading(value);
  }, []);

  const setLeaseOpen = useCallback((open: boolean) => {
    _setIsLeaseOpen(open);
  }, []);

  const getActiveLease = useCallback((roomId: string) => {
    return leases?.find((lease) => lease.room_id === roomId && lease.is_active);
  }, [leases]);

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
      if (filters.rentMin !== null && (room.pricing?.monthly_rent ?? 0) < filters.rentMin) {
        return false;
      }
      if (filters.rentMax !== null && (room.pricing?.monthly_rent ?? 0) > filters.rentMax) {
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

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredRooms]);

  return {
    allRooms,
    apartments,
    leases,
    roomsLoading,
    apartmentsLoading,
    filters,
    searchQuery,
    viewMode,
    isLeaseOpen,
    pendingInitialReading,
    isTerminateOpen,
    selectedRoom,
    filteredRooms,
    groupedRooms,
    terminateLeaseMutation,
    updateStatusMutation,
    handleLease,
    handleTerminate,
    handleStatusChange,
    handleFilterChange,
    setSearchQuery,
    handleClearFilters,
    handleLeaseSuccess,
    closeLeaseDrawer,
    closeTerminateDialog,
    setViewMode,
    getActiveLease,
    setPendingInitialReading,
    setLeaseOpen,
  };
}
