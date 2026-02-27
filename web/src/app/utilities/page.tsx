'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apartmentsApi, roomsApi, utilitiesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { useAuth } from '@/lib/auth/context';
import { UtilityReading } from '@/types';
import { Plus, Upload, Building2 } from 'lucide-react';
import {
  useColumns,
  CreateUtilityDialog,
  EditUtilityDialog,
  BatchImportDialog,
} from './components';

export default function UtilitiesPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<UtilityReading | null>(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(orgId!, selectedApartmentId!),
    enabled: !!orgId && selectedApartmentId !== null,
  });

  const { data: allRooms } = useQuery({
    queryKey: ['allRooms', orgId],
    queryFn: () => roomsApi.listAll(orgId!, apartments?.map((a) => a.id) || []),
    enabled: !!orgId && !!apartments && apartments.length > 0,
  });

  const { data: utilities, isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities', orgId],
    queryFn: () => utilitiesApi.list(orgId!),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.create>[1]) =>
      utilitiesApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      setIsCreateOpen(false);
      toast.success('水电读数录入成功');
    },
    onError: () => {
      toast.error('录入失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof utilitiesApi.update>[2] }) =>
      utilitiesApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      setIsEditOpen(false);
      setSelectedUtility(null);
      toast.success('水电读数更新成功');
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const batchImportMutation = useMutation({
    mutationFn: (data: Parameters<typeof utilitiesApi.batchCreate>[1]) =>
      utilitiesApi.batchCreate(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      setIsBatchImportOpen(false);
      toast.success('批量导入成功');
    },
    onError: () => {
      toast.error('批量导入失败，请重试');
    },
  });

  const handleEdit = (utility: UtilityReading) => {
    setSelectedUtility(utility);
    setIsEditOpen(true);
  };

  const handleBatchImport = (
    readings: { room_id: number; water_reading: number | null; electricity_reading: number | null; notes: string | null }[]
  ) => {
    batchImportMutation.mutate({
      period_year: currentYear,
      period_month: currentMonth,
      reading_date: today.toISOString().split('T')[0],
      readings,
    });
  };

  const columns = useColumns({ onEdit: handleEdit });

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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">水电录入</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBatchImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              批量导入
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              录入读数
            </Button>
          </div>
        </div>

        {utilitiesLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={utilities || []} />
        )}
      </div>

      <CreateUtilityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        apartments={apartments}
        rooms={rooms}
        selectedApartmentId={selectedApartmentId}
        onApartmentChange={setSelectedApartmentId}
      />

      <EditUtilityDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={(data) => {
          if (selectedUtility) {
            updateMutation.mutate({ id: selectedUtility.id, data });
          }
        }}
        isPending={updateMutation.isPending}
        utility={selectedUtility}
      />

      <BatchImportDialog
        open={isBatchImportOpen}
        onOpenChange={setIsBatchImportOpen}
        onImport={handleBatchImport}
        isPending={batchImportMutation.isPending}
        allRooms={allRooms}
      />
    </MainLayout>
  );
}
