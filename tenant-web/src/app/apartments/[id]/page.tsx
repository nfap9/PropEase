'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { useAuth } from '@/auth/context';
import type { Room, RoomFacilities } from '@/types';
import {
  apartmentFormDefaultValues,
  apartmentSchema,
  batchEditSchema,
  roomBatchConfigSchema,
  roomSchema,
  type BatchEditFormData,
  type RoomFormData,
} from '@/features/apartment-detail/apartment-detail.schemas';
import {
  useApartmentDetailData,
  useApartmentFormSync,
  useApartmentRoomMetrics,
  useGeneratedRoomSelection,
  useRoomBatchSelection,
} from '@/features/apartment-detail/apartment-detail.hooks';
import { ApartmentDetailHeader } from '@/features/apartment-detail/components/apartment-detail-header';
import { ApartmentOverviewTab } from '@/features/apartment-detail/components/apartment-overview-tab';
import { ApartmentRoomListTab } from '@/features/apartment-detail/components/apartment-room-list-tab';
import { UtilityConfigDialog } from '@/features/apartment-detail/components/UtilityConfigDialog';
import {
  ApartmentEditDialog,
  BatchCreateRoomDialog,
  BatchEditDialog,
  CreateRoomDialog,
  DeleteRoomDialog,
  RoomEditDialog,
} from '@/features/apartment-detail/components/apartment-detail-dialogs';

export default function ApartmentDetailPage() {
  const params = useParams();
  const apartmentId = params.id as string;
  const router = useRouter();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isEditApartmentOpen, setIsEditApartmentOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isBatchCreateRoomOpen, setIsBatchCreateRoomOpen] = useState(false);
  const [batchCreateStep, setBatchCreateStep] = useState<'config' | 'confirm'>('config');
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoomFacilities, setNewRoomFacilities] = useState<RoomFacilities | null>(null);
  const [facilityDialogOpen, setFacilityDialogOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isUtilityConfigOpen, setIsUtilityConfigOpen] = useState(false);

  const apartmentForm = useForm({
    resolver: zodResolver(apartmentSchema),
    defaultValues: apartmentFormDefaultValues,
  });
  const createRoomForm = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      room_number: '',
      layout: '',
      area: 0,
      monthly_rent: 0,
      notes: '',
    },
  });
  const batchCreateRoomForm = useForm({
    resolver: zodResolver(roomBatchConfigSchema),
    defaultValues: {
      floors: '1',
      start_number: 1,
      end_number: 10,
      layout: '',
      monthly_rent: 0,
      area: 0,
      notes: '',
    },
  });
  const batchEditForm = useForm<BatchEditFormData>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      layout: '',
      area: undefined,
      status: undefined,
    },
  });

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
    orgId,
    onApartmentUpdated: () => setIsEditApartmentOpen(false),
    onRoomCreated: () => {
      setIsCreateRoomOpen(false);
      createRoomForm.reset();
      setNewRoomFacilities(null);
    },
    onBatchRoomsCreated: () => {
      setIsBatchCreateRoomOpen(false);
      setBatchCreateStep('config');
      batchCreateRoomForm.reset();
      resetGeneratedSelection();
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
      batchEditForm.reset();
    },
    onBatchDeleted: () => {
      clearRoomSelection();
    },
  });

  useApartmentFormSync(apartment, apartmentForm);

  const {
    generatedRooms,
    selectedRooms,
    initializeSelectedRooms,
    toggleRoom,
    toggleFloor,
    toggleAll,
    resetSelectedRooms: resetGeneratedSelection,
  } = useGeneratedRoomSelection(batchCreateRoomForm);

  const {
    selectedRoomIds,
    toggleRoomSelection,
    toggleFloorSelection,
    toggleAllRoomSelection,
    clearRoomSelection,
  } = useRoomBatchSelection(rooms);

  const { stats, roomGroups } = useApartmentRoomMetrics(rooms);

  const handleEditApartment = () => {
    if (apartment) {
      setIsEditApartmentOpen(true);
    }
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
    if (selectedRoomIds.size === 0) {
      return;
    }

    if (confirm(`确定要删除选中的 ${selectedRoomIds.size} 个房间吗？`)) {
      batchDeleteMutation.mutate(Array.from(selectedRoomIds));
    }
  };

  if (authLoading || apartmentLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!apartment) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">公寓不存在</h2>
          <Button onClick={() => router.push('/apartments')}>返回公寓列表</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <ApartmentDetailHeader
            apartment={apartment}
            onBack={() => router.push('/apartments')}
            onEdit={handleEditApartment}
            onOpenUtilityConfig={() => setIsUtilityConfigOpen(true)}
          />

          <Tabs defaultValue="info" className="flex flex-col">
            <TabsList className="inline-flex w-auto self-start">
              <TabsTrigger value="info">基础信息</TabsTrigger>
              <TabsTrigger value="rooms">房间列表</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <ApartmentOverviewTab apartment={apartment} stats={stats} />
            </TabsContent>

            <TabsContent value="rooms" className="mt-4">
              <ApartmentRoomListTab
                rooms={rooms}
                roomsLoading={roomsLoading}
                roomGroups={roomGroups}
                selectedRoomIds={selectedRoomIds}
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
              />
            </TabsContent>
          </Tabs>
        </div>

        <ApartmentEditDialog
          open={isEditApartmentOpen}
          onOpenChange={setIsEditApartmentOpen}
          form={apartmentForm}
          onSubmit={(data) => updateApartmentMutation.mutate(data)}
          isPending={updateApartmentMutation.isPending}
        />

        <CreateRoomDialog
          apartmentName={apartment.name}
          open={isCreateRoomOpen}
          onOpenChange={(open) => {
            setIsCreateRoomOpen(open);
            if (!open) {
              setNewRoomFacilities(null);
            }
          }}
          form={createRoomForm}
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
          open={isBatchCreateRoomOpen}
          onOpenChange={setIsBatchCreateRoomOpen}
          step={batchCreateStep}
          onStepChange={setBatchCreateStep}
          form={batchCreateRoomForm}
          generatedRooms={generatedRooms}
          selectedRooms={selectedRooms}
          onInitializeSelection={initializeSelectedRooms}
          onToggleAll={toggleAll}
          onToggleFloor={toggleFloor}
          onToggleRoom={toggleRoom}
          onSubmitConfig={() => setBatchCreateStep('confirm')}
          onSubmitRooms={() =>
            batchCreateRoomMutation.mutate({
              roomNumbers: Array.from(selectedRooms),
              config: batchCreateRoomForm.getValues(),
            })
          }
          isPending={batchCreateRoomMutation.isPending}
          onResetSelection={resetGeneratedSelection}
        />

        <RoomEditDialog
          open={isEditRoomOpen}
          onOpenChange={setIsEditRoomOpen}
          room={selectedRoom}
          onSubmit={(data) => {
            if (selectedRoom) {
              updateRoomMutation.mutate({ roomId: selectedRoom.id, data });
            }
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
          form={batchEditForm}
          selectedCount={selectedRoomIds.size}
          onSubmit={(data) =>
            batchUpdateMutation.mutate({
              roomIds: Array.from(selectedRoomIds),
              data,
            })
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
      </MainLayout>
    </PermissionPageGuard>
  );
}
