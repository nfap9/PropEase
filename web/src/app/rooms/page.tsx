'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/common/data-table';
import { LeaseFormDialog } from '@/components/common/lease-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { roomsApi, apartmentsApi, leasesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { useAuth } from '@/lib/auth/context';
import { Room, RoomStatus } from '@/types';
import { Building2, Search } from 'lucide-react';
import {
  RoomStatsCards,
  RoomFilters,
  RoomFiltersState,
  useColumns,
  EditRoomDialog,
  TerminateDialog,
  DeleteRoomDialog,
} from './components';

interface RoomFormData {
  room_number: string;
  layout?: string;
  area?: number;
  monthly_rent: number;
  status: RoomStatus;
  notes?: string;
  [key: string]: unknown;
}

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [filters, setFilters] = useState<RoomFiltersState>({
    apartmentId: null,
    status: null,
    rentMin: null,
    rentMax: null,
    areaMin: null,
    areaMax: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaseOpen, setIsLeaseOpen] = useState(false);
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
      rentMin: null,
      rentMax: null,
      areaMin: null,
      areaMax: null,
    });
    setSearchQuery('');
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoomFormData }) =>
      roomsApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsEditOpen(false);
      setSelectedRoom(null);
      toast.success('房间更新成功');
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roomsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsDeleteOpen(false);
      setSelectedRoom(null);
      toast.success('房间删除成功');
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
  });

  const terminateLeaseMutation = useMutation({
    mutationFn: (leaseId: number) => leasesApi.terminate(orgId!, leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsTerminateOpen(false);
      setSelectedRoom(null);
      toast.success('退租成功');
    },
    onError: () => {
      toast.error('退租失败，请重试');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RoomStatus }) =>
      roomsApi.update(orgId!, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      toast.success('状态更新成功');
    },
    onError: () => {
      toast.error('状态更新失败，请重试');
    },
  });

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsEditOpen(true);
  };

  const handleDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteOpen(true);
  };

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

  const getActiveLease = (roomId: number) => {
    return leases?.find((lease) => lease.room_id === roomId && lease.is_active);
  };

  const columns = useColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
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
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入组织</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个组织开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">全部房间</h1>
          <p className="text-muted-foreground mt-1">
            查看和管理所有公寓的房间
          </p>
        </div>

        {allRooms && <RoomStatsCards rooms={allRooms} />}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索房间号或备注..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {apartments && apartments.length > 0 && (
          <RoomFilters
            apartments={apartments}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}

        <div className="text-sm text-muted-foreground">
          显示 {filteredRooms.length} / {allRooms?.length || 0} 个房间
        </div>

        {roomsLoading || apartmentsLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={filteredRooms} />
        )}
      </div>

      <EditRoomDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={(data) => {
          if (selectedRoom) {
            updateMutation.mutate({ id: selectedRoom.id, data });
          }
        }}
        isPending={updateMutation.isPending}
        room={selectedRoom}
      />

      <LeaseFormDialog
        orgId={orgId!}
        open={isLeaseOpen}
        onOpenChange={setIsLeaseOpen}
        room={selectedRoom}
        onSuccess={handleLeaseSuccess}
      />

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

      <DeleteRoomDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={() => {
          if (selectedRoom) {
            deleteMutation.mutate(selectedRoom.id);
          }
        }}
        isPending={deleteMutation.isPending}
        room={selectedRoom}
      />
    </MainLayout>
  );
}
