import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button, Skeleton, Tabs } from 'antd';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import type { Room, RoomFacilities } from '@/types';
import { useApartmentDetailData, useApartmentRoomMetrics, useRoomBatchSelection } from '@/pages/apartments/hooks/use-apartment-detail';
import { buildApartmentFormValues } from '@/utils/apartment-detail';
import { ApartmentDetailHeader } from '@/pages/apartments/detail/components/apartment-detail-header';
import { ApartmentOverviewTab } from '@/pages/apartments/detail/components/apartment-overview-tab';
import { ApartmentRoomListTab } from '@/pages/apartments/detail/components/apartment-room-list-tab';
import { UtilityConfigDialog } from '@/pages/apartments/detail/components/utility-config-dialog';
import { ApartmentEditDialog } from '@/pages/apartments/detail/components/apartment-edit-dialog';
import { BatchCreateRoomDialog, BatchEditDialog, CreateRoomDialog, DeleteRoomDialog, RoomEditDialog } from '@/pages/apartments/detail/components/room-dialogs';

export default function ApartmentDetailPage() {
  const params = useParams();
  const apartmentId = params.id as string;
  const navigate = useNavigate();
  const { organization, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  const canEditApartment = hasPermission(PERMISSIONS.APARTMENT_EDIT);
  const canEditUtility = hasPermission(PERMISSIONS.UTILITY_EDIT);
  const canCreateRoom = hasPermission(PERMISSIONS.ROOM_CREATE);
  const canEditRoom = hasPermission(PERMISSIONS.ROOM_EDIT);
  const canDeleteRoom = hasPermission(PERMISSIONS.ROOM_DELETE);

  const [isEditApartmentOpen, setIsEditApartmentOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isBatchCreateRoomOpen, setIsBatchCreateRoomOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false);
  const [isBatchSelectMode, setIsBatchSelectMode] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoomFacilities, setNewRoomFacilities] = useState<RoomFacilities | null>(null);
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isUtilityConfigOpen, setIsUtilityConfigOpen] = useState(false);

  // Batch create: selected rooms
  const [batchSelectedRooms, setBatchSelectedRooms] = useState<Set<string>>(new Set());

  const {
    apartment,
    apartmentLoading,
    rooms,
    roomsLoading,
    updateApartmentMutation,
    createRoomMutation,
    batchCreateRoomMutation,
    updateRoomMutation,
    deleteRoomMutation,
    batchUpdateMutation,
    batchDeleteMutation,
  } = useApartmentDetailData({
    apartmentId,
    onApartmentUpdated: () => setIsEditApartmentOpen(false),
    onRoomCreated: () => {
      setIsCreateRoomOpen(false);
      setNewRoomFacilities(null);
    },
    onBatchRoomsCreated: () => {
      setIsBatchCreateRoomOpen(false);
      setBatchSelectedRooms(new Set());
    },
    onRoomUpdated: () => {
      setIsEditRoomOpen(false);
      setSelectedRoom(null);
    },
    onRoomDeleted: () => {
      setIsDeleteRoomOpen(false);
      setSelectedRoom(null);
    },
    onBatchUpdated: () => {
      setIsBatchEditOpen(false);
      clearRoomSelection();
    },
    onBatchDeleted: () => {
      clearRoomSelection();
    },
  });

  const {
    selectedRoomIds,
    toggleRoomSelection,
    toggleFloorSelection,
    toggleAllRoomSelection,
    clearRoomSelection,
  } = useRoomBatchSelection(rooms);

  const { stats, roomGroups } = useApartmentRoomMetrics(rooms);

  const handleToggleRoom = useCallback((roomNumber: string) => {
    setBatchSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomNumber)) next.delete(roomNumber);
      else next.add(roomNumber);
      return next;
    });
  }, []);

  const handleToggleFloor = useCallback((roomNumbers: string[], select: boolean) => {
    setBatchSelectedRooms((prev) => {
      const next = new Set(prev);
      roomNumbers.forEach((rn) => {
        if (select) next.add(rn);
        else next.delete(rn);
      });
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((select: boolean) => {
    if (!select) {
      setBatchSelectedRooms(new Set());
    }
    // When select all, we need all generated rooms - this will be handled by the dialog internally
  }, []);

  const handleEditApartment = () => {
    if (apartment) setIsEditApartmentOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsEditRoomOpen(true);
  };

  const handleDeleteRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteRoomOpen(true);
  };

  const handleDeleteSelectedRooms = () => {
    if (selectedRoomIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedRoomIds.size} 个房间吗？`)) {
      batchDeleteMutation.mutate(Array.from(selectedRoomIds));
    }
  };

  const handleToggleBatchSelectMode = () => {
    setIsBatchSelectMode((prev) => !prev);
    if (isBatchSelectMode) clearRoomSelection();
  };

  const handleClearSelection = () => {
    clearRoomSelection();
    setIsBatchSelectMode(false);
  };

  if (authLoading || apartmentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton active paragraph={{ rows: 1 }} />
        <Skeleton active paragraph={{ rows: 3 }} />
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-gray-400" />
        <h2 className="text-xl font-semibold">公寓不存在</h2>
        <Button onClick={() => navigate('/workspace/apartments')}>返回公寓列表</Button>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <div className="flex flex-col gap-4 overflow-y-auto pr-1">
        <ApartmentDetailHeader
          apartment={apartment}
          onBack={() => navigate('/workspace/apartments')}
          onEdit={handleEditApartment}
          onOpenUtilityConfig={() => setIsUtilityConfigOpen(true)}
          canEdit={canEditApartment}
          canEditUtility={canEditUtility}
        />

        <Tabs defaultActiveKey="info">
          <Tabs.TabPane tab="基础信息" key="info">
            <ApartmentOverviewTab apartment={apartment} stats={stats} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="房间列表" key="rooms">
            <ApartmentRoomListTab
              rooms={rooms}
              roomsLoading={roomsLoading}
              roomGroups={roomGroups}
              selectedRoomIds={selectedRoomIds}
              isBatchSelectMode={isBatchSelectMode}
              isBatchDeletePending={batchDeleteMutation.isPending}
              onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
              onOpenBatchCreate={() => setIsBatchCreateRoomOpen(true)}
              onOpenBatchEdit={() => setIsBatchEditOpen(true)}
              onDeleteSelected={handleDeleteSelectedRooms}
              onSelectAllRooms={toggleAllRoomSelection}
              onToggleFloorSelection={toggleFloorSelection}
              onToggleRoomSelection={toggleRoomSelection}
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleDeleteRoom}
              onToggleBatchSelectMode={handleToggleBatchSelectMode}
              onClearSelection={handleClearSelection}
              canCreateRoom={canCreateRoom}
              canEditRoom={canEditRoom}
              canDeleteRoom={canDeleteRoom}
            />
          </Tabs.TabPane>
        </Tabs>
      </div>

      <ApartmentEditDialog
        open={isEditApartmentOpen}
        onOpenChange={setIsEditApartmentOpen}
        initialValues={buildApartmentFormValues(apartment)}
        onSubmit={(data) => updateApartmentMutation.mutate(data)}
        isPending={updateApartmentMutation.isPending}
      />

      <CreateRoomDialog
        apartmentName={apartment.name}
        open={isCreateRoomOpen}
        onOpenChange={(open) => {
          setIsCreateRoomOpen(open);
          if (!open) setNewRoomFacilities(null);
        }}
        facilities={newRoomFacilities}
        onFacilitiesChange={setNewRoomFacilities}
        facilityDialogOpen={facilityDialogOpen}
        onFacilityDialogOpenChange={setFacilityDialogOpen}
        onSubmit={(data) =>
          createRoomMutation.mutate({
            ...data,
            status: 'available',
            facilities: newRoomFacilities,
          })
        }
        isPending={createRoomMutation.isPending}
      />

      <BatchCreateRoomDialog
        key={isBatchCreateRoomOpen ? 'open' : 'closed'}
        open={isBatchCreateRoomOpen}
        onOpenChange={setIsBatchCreateRoomOpen}
        selectedRooms={batchSelectedRooms}
        onToggleAll={handleToggleAll}
        onToggleFloor={handleToggleFloor}
        onToggleRoom={handleToggleRoom}
        onSubmitRooms={() => batchCreateRoomMutation.mutate(Array.from(batchSelectedRooms))}
        isPending={batchCreateRoomMutation.isPending}
      />

      <RoomEditDialog
        open={isEditRoomOpen}
        onOpenChange={setIsEditRoomOpen}
        room={selectedRoom}
        onSubmit={(data) => {
          if (selectedRoom) updateRoomMutation.mutate({ roomId: selectedRoom.id, data });
        }}
        isPending={updateRoomMutation.isPending}
      />

      <DeleteRoomDialog
        open={isDeleteRoomOpen}
        onOpenChange={setIsDeleteRoomOpen}
        room={selectedRoom}
        onConfirm={() => selectedRoom && deleteRoomMutation.mutate(selectedRoom.id)}
        isPending={deleteRoomMutation.isPending}
      />

      <BatchEditDialog
        open={isBatchEditOpen}
        onOpenChange={setIsBatchEditOpen}
        selectedCount={selectedRoomIds.size}
        onSubmit={(data) =>
          batchUpdateMutation.mutate({ roomIds: Array.from(selectedRoomIds), data })
        }
        isPending={batchUpdateMutation.isPending}
      />

      <UtilityConfigDialog
        open={isUtilityConfigOpen}
        onOpenChange={setIsUtilityConfigOpen}
        orgId={orgId || ''}
        apartmentId={apartmentId}
        apartmentName={apartment.name}
      />
    </PermissionPageGuard>
  );
}
