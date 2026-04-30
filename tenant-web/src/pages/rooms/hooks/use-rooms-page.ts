import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { roomsApi, apartmentsApi } from '@/api/apartments';
import { leasesApi } from '@/api/leases';
import { getErrorMessage } from '@propease/web-shared';
import { useAuth } from '@/contexts/auth';
import type { Room, ApartmentWithStats, Lease } from '@/types';
import type { RoomFiltersState } from '@/pages/rooms/components/room-filters';

export function useRoomsData(filters: RoomFiltersState, searchQuery: string) {
  const { organization } = useAuth();
  const orgId = organization?.id;

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

  const filteredRooms = useMemo(() => {
    if (!allRooms) return [];

    return allRooms.filter((room) => {
      if (filters.apartmentId && room.apartment_id !== filters.apartmentId) return false;
      if (filters.status && room.status !== filters.status) return false;
      if (filters.layout && room.layout !== filters.layout) return false;
      if (filters.rentMin !== null && (room.pricing?.monthly_rent ?? 0) < filters.rentMin) return false;
      if (filters.rentMax !== null && (room.pricing?.monthly_rent ?? 0) > filters.rentMax) return false;
      if (filters.areaMin !== null && (room.area === null || room.area < filters.areaMin)) return false;
      if (filters.areaMax !== null && (room.area === null || room.area > filters.areaMax)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchRoomNumber = room.room_number.toLowerCase().includes(query);
        const matchNotes = room.notes?.toLowerCase().includes(query) || false;
        if (!matchRoomNumber && !matchNotes) return false;
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

  const getActiveLease = useCallback(
    (roomId: string) => leases?.find((lease) => lease.room_id === roomId && lease.is_active),
    [leases],
  );

  return {
    allRooms,
    apartments,
    leases,
    roomsLoading,
    apartmentsLoading,
    filteredRooms,
    groupedRooms,
    getActiveLease,
  };
}

export function useRoomsMutations() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;

  const terminateLeaseMutation = useMutation({
    mutationFn: (leaseId: string) => leasesApi.terminate(leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
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
          queryClient.setQueryData(
            key,
            data.map((room) => (room.id === updatedRoom.id ? { ...room, status: updatedRoom.status } : room)),
          );
        }
      }
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      toast.success('状态更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '状态更新失败，请重试')),
  });

  const terminateLease = useCallback(
    (leaseId: string, onSuccess?: () => void) => {
      terminateLeaseMutation.mutate(leaseId, { onSuccess });
    },
    [terminateLeaseMutation],
  );

  const updateRoomStatus = useCallback(
    (id: string, maintenance: boolean) => {
      updateStatusMutation.mutate({ id, maintenance });
    },
    [updateStatusMutation],
  );

  return {
    terminateLease,
    updateRoomStatus,
    isTerminating: terminateLeaseMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
