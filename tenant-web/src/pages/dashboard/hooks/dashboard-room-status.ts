import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apartmentsApi, roomsApi } from '@/api/apartments';

export function useRoomStatusCard(orgId: string | undefined) {
  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(),
    enabled: !!orgId,
  });

  const apartmentIds = useMemo(() => apartments?.map((a) => a.id) ?? [], [apartments]);

  const { data: allRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms-all', orgId, apartmentIds],
    queryFn: () => roomsApi.listAll(apartmentIds),
    enabled: !!orgId && apartmentIds.length > 0,
  });

  const availableRooms = useMemo(() => allRooms.filter((r) => r.status === 'available'), [allRooms]);

  return {
    availableRooms,
    totalRooms: allRooms.length,
    isLoading: apartmentsLoading || roomsLoading,
  };
}
