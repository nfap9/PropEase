import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import type { UseFormReturn } from 'react-hook-form';
import { apartmentsApi, roomsApi } from '@/api';
import { getErrorMessage } from '@/utils/error';
import { filterEmptyStrings } from '@/utils/form';
import type { Apartment, Room, RoomFacilities, RoomStatus } from '@/types';
import type {
  ApartmentFormData,
  BatchEditFormData,
  RoomBatchConfigData,
  RoomFormData,
} from '@/schemas/apartment-detail';
import {
  buildApartmentFormValues,
  buildGeneratedRoomGroups,
  getRoomStats,
  groupRoomsByFloor,
} from '@/utils/apartment-detail';

interface UseApartmentDetailDataOptions {
  apartmentId: string;
  orgId?: string;
  onApartmentUpdated: () => void;
  onRoomCreated: () => void;
  onBatchRoomsCreated: (count: number) => void;
  onRoomUpdated: () => void;
  onRoomDeleted: () => void;
  onBatchUpdated: () => void;
  onBatchDeleted: () => void;
}

export function useApartmentDetailData({
  apartmentId,
  orgId,
  onApartmentUpdated,
  onRoomCreated,
  onBatchRoomsCreated,
  onRoomUpdated,
  onRoomDeleted,
  onBatchUpdated,
  onBatchDeleted,
}: UseApartmentDetailDataOptions) {
  const queryClient = useQueryClient();

  const apartmentQuery = useQuery({
    queryKey: ['apartment', orgId, apartmentId],
    queryFn: () => apartmentsApi.get(orgId!, apartmentId),
    enabled: Boolean(orgId),
  });

  const roomsQuery = useQuery({
    queryKey: ['rooms', orgId, apartmentId],
    queryFn: () => roomsApi.list(orgId!, apartmentId),
    enabled: Boolean(orgId),
  });

  const invalidateApartment = () => {
    queryClient.invalidateQueries({ queryKey: ['apartment', orgId, apartmentId] });
    queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
  };

  const invalidateRooms = () => {
    queryClient.invalidateQueries({ queryKey: ['rooms', orgId, apartmentId] });
  };

  const updateApartmentMutation = useMutation({
    mutationFn: (data: ApartmentFormData) =>
      apartmentsApi.update(orgId!, apartmentId, filterEmptyStrings(data)),
    onSuccess: () => {
      invalidateApartment();
      onApartmentUpdated();
      appToast.success('公寓信息更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const createRoomMutation = useMutation({
    mutationFn: (data: RoomFormData & { status: RoomStatus; facilities?: RoomFacilities | null }) =>
      roomsApi.create(orgId!, apartmentId, filterEmptyStrings(data)),
    onSuccess: () => {
      invalidateRooms();
      onRoomCreated();
      appToast.success('房间创建成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const batchCreateRoomMutation = useMutation({
    mutationFn: ({
      roomNumbers,
      config,
    }: {
      roomNumbers: string[];
      config: RoomBatchConfigData;
    }) =>
      roomsApi.batchCreate(orgId!, apartmentId, {
        room_numbers: roomNumbers,
        layout: config.layout || undefined,
        monthly_rent: config.monthly_rent,
        area: config.area || undefined,
        notes: config.notes || undefined,
      }),
    onSuccess: (createdRooms) => {
      invalidateRooms();
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      onBatchRoomsCreated(createdRooms.length);
      appToast.success(`成功创建 ${createdRooms.length} 个房间`);
    },
    onError: (error) => appToast.error(getErrorMessage(error, '批量创建失败，请重试')),
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({
      roomId,
      data,
    }: {
      roomId: string;
      data: RoomFormData & { facilities?: RoomFacilities | null };
    }) =>
      roomsApi.update(
        orgId!,
        roomId,
        filterEmptyStrings({
          ...data,
          apartment_id: apartmentId,
        })
      ),
    onSuccess: () => {
      invalidateRooms();
      onRoomUpdated();
      appToast.success('房间信息更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => roomsApi.delete(orgId!, roomId),
    onSuccess: () => {
      invalidateRooms();
      onRoomDeleted();
      appToast.success('房间删除成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const batchUpdateMutation = useMutation({
    mutationFn: async ({
      roomIds,
      data,
    }: {
      roomIds: string[];
      data: BatchEditFormData;
    }) => {
      const updates = roomIds.map((roomId) => {
        const updateData: Partial<Room> = {};
        if (data.layout !== undefined && data.layout !== '') {
          updateData.layout = data.layout;
        }
        if (data.area !== undefined) {
          updateData.area = data.area;
        }
        if (data.status !== undefined) {
          updateData.status = data.status;
        }
        return roomsApi.update(orgId!, roomId, updateData);
      });

      return Promise.all(updates);
    },
    onSuccess: () => {
      invalidateRooms();
      onBatchUpdated();
      appToast.success('批量更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '批量更新失败，请重试')),
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (roomIds: string[]) => Promise.all(roomIds.map((roomId) => roomsApi.delete(orgId!, roomId))),
    onSuccess: () => {
      invalidateRooms();
      onBatchDeleted();
      appToast.success('批量删除成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '批量删除失败，请重试')),
  });

  return {
    apartment: apartmentQuery.data,
    apartmentLoading: apartmentQuery.isLoading,
    rooms: roomsQuery.data,
    roomsLoading: roomsQuery.isLoading,
    updateApartmentMutation,
    createRoomMutation,
    batchCreateRoomMutation,
    updateRoomMutation,
    deleteRoomMutation,
    batchUpdateMutation,
    batchDeleteMutation,
  };
}

export function useApartmentFormSync(
  apartment: Apartment | undefined,
  apartmentForm: UseFormReturn<ApartmentFormData>
) {
  useEffect(() => {
    if (apartment) {
      apartmentForm.reset(buildApartmentFormValues(apartment));
    }
  }, [apartment, apartmentForm]);
}

export function useGeneratedRoomSelection(batchCreateRoomForm: UseFormReturn<RoomBatchConfigData>) {
  const floors = batchCreateRoomForm.watch('floors');
  const startNumber = batchCreateRoomForm.watch('start_number');
  const endNumber = batchCreateRoomForm.watch('end_number');
  const generatedRooms = useMemo(
    () => buildGeneratedRoomGroups(floors || '1', startNumber || 1, endNumber || 10),
    [floors, startNumber, endNumber]
  );

  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());

  const initializeSelectedRooms = () => {
    setSelectedRooms(new Set(generatedRooms.flatMap((floorGroup) => floorGroup.rooms)));
  };

  const toggleRoom = (roomNumber: string) => {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomNumber)) {
        next.delete(roomNumber);
      } else {
        next.add(roomNumber);
      }
      return next;
    });
  };

  const toggleFloor = (roomNumbers: string[], select: boolean) => {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      for (const roomNumber of roomNumbers) {
        if (select) {
          next.add(roomNumber);
        } else {
          next.delete(roomNumber);
        }
      }
      return next;
    });
  };

  const toggleAll = (select: boolean) => {
    setSelectedRooms(
      select ? new Set(generatedRooms.flatMap((floorGroup) => floorGroup.rooms)) : new Set()
    );
  };

  const resetSelectedRooms = () => {
    setSelectedRooms(new Set());
  };

  return {
    generatedRooms,
    selectedRooms,
    initializeSelectedRooms,
    toggleRoom,
    toggleFloor,
    toggleAll,
    resetSelectedRooms,
  };
}

export function useRoomBatchSelection(rooms: Room[] | undefined) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!rooms) {
      return;
    }

    const roomIds = new Set(rooms.map((room) => room.id));
    setSelectedRoomIds((prev) => {
      const next = new Set(Array.from(prev).filter((roomId) => roomIds.has(roomId)));
      return next.size === prev.size ? prev : next;
    });
  }, [rooms]);

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  const toggleFloorSelection = (floorRooms: Room[], select: boolean) => {
    setSelectedRoomIds((prev) => {
      const next = new Set(prev);
      for (const room of floorRooms) {
        if (select) {
          next.add(room.id);
        } else {
          next.delete(room.id);
        }
      }
      return next;
    });
  };

  const toggleAllRoomSelection = (select: boolean) => {
    setSelectedRoomIds(select && rooms ? new Set(rooms.map((room) => room.id)) : new Set());
  };

  const clearRoomSelection = () => {
    setSelectedRoomIds(new Set());
  };

  return {
    selectedRoomIds,
    toggleRoomSelection,
    toggleFloorSelection,
    toggleAllRoomSelection,
    clearRoomSelection,
  };
}

export function useApartmentRoomMetrics(rooms: Room[] | undefined) {
  const stats = useMemo(() => getRoomStats(rooms), [rooms]);
  const roomGroups = useMemo(() => groupRoomsByFloor(rooms), [rooms]);

  return { stats, roomGroups };
}
