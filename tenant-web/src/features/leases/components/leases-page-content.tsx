'use client';

import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Building2 } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { LeaseSigningDrawer } from './lease-signing-drawer';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';
import type { LeaseCreatedParams } from '@/components/common/lease-form-dialog';
import { useAuth } from '@/lib/auth/context';
import { toDateInputValue } from '@/lib/date-utils';
import { DataTable } from '@/components/common/data-table';
import type { Lease } from '@/types';
import { createLeaseColumns } from '../leases.columns';
import { useLeasesData } from '../leases.hooks';
import {
  getDefaultLeaseFilters,
  LEASES,
  leaseSchema,
  type LeaseEditFormData,
  type LeaseFiltersState,
} from '../leases.schemas';
import { filterLeases } from '../leases.utils';
import { LeaseDeleteDialog, LeaseEditDialog, LeaseTerminateDialog } from './lease-dialogs';
import { LeaseFilters } from './lease-filters';

export function LeasesPageContent() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingInitialReading, setPendingInitialReading] = useState<LeaseCreatedParams | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [filters, setFilters] = useState<LeaseFiltersState>(getDefaultLeaseFilters());

  const editForm = useForm<LeaseEditFormData>({
    resolver: zodResolver(leaseSchema),
  });

  const { apartments, leases, leasesLoading, updateMutation, terminateMutation, deleteMutation } = useLeasesData({
    orgId,
    onUpdateSuccess: () => {
      setIsEditOpen(false);
      setSelectedLease(null);
    },
    onTerminateSuccess: () => {
      setIsTerminateOpen(false);
      setSelectedLease(null);
    },
    onDeleteSuccess: () => {
      setIsDeleteOpen(false);
      setSelectedLease(null);
    },
  });

  const filteredLeases = useMemo(() => filterLeases(leases, filters), [leases, filters]);

  const handleEdit = useCallback((lease: Lease) => {
    setSelectedLease(lease);
    editForm.reset({
      room_id: lease.room_id,
      tenant_id: lease.tenant_id,
      start_date: toDateInputValue(lease.start_date),
      end_date: toDateInputValue(lease.end_date),
      monthly_rent: lease.monthly_rent,
      deposit: lease.deposit ?? 0,
      water_rate: lease.water_rate ?? 0,
      electricity_rate: lease.electricity_rate ?? 0,
      notes: lease.notes ?? '',
    });
    setIsEditOpen(true);
  }, [editForm]);

  const columns = useMemo(
    () =>
      createLeaseColumns({
        onEdit: handleEdit,
        onTerminate: (lease) => {
          setSelectedLease(lease);
          setIsTerminateOpen(true);
        },
        onDelete: (lease) => {
          setSelectedLease(lease);
          setIsDeleteOpen(true);
        },
      }),
    [handleEdit]
  );

  const handleFilterChange = (key: keyof LeaseFiltersState, value: unknown) => {
    setFilters((current) => ({ ...current, [key]: value as LeaseFiltersState[typeof key] }));
  };

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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold" data-testid={LEASES.HEADING}>
              租约管理
            </h1>
            <Button onClick={() => setIsCreateOpen(true)} data-testid={LEASES.NEW_BUTTON}>
              <Plus className="mr-2 h-4 w-4" />
              新增租约
            </Button>
          </div>

          <LeaseFilters
            apartments={apartments?.map((apartment) => ({ id: apartment.id, name: apartment.name })) ?? []}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={() => setFilters(getDefaultLeaseFilters())}
          />

          {leasesLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <DataTable columns={columns} data={filteredLeases} testid={LEASES.LIST} />
          )}
        </div>

        <LeaseSigningDrawer
          orgId={orgId}
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onLeaseCreated={setPendingInitialReading}
        />

        {pendingInitialReading && (
          <InitialReadingDialog
            orgId={orgId}
            roomId={pendingInitialReading.room_id}
            roomDisplay={pendingInitialReading.room_display}
            startDate={pendingInitialReading.start_date}
            open={Boolean(pendingInitialReading)}
            onOpenChange={(open) => !open && setPendingInitialReading(null)}
            onSuccess={() => setPendingInitialReading(null)}
          />
        )}

        <LeaseEditDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          selectedLease={selectedLease}
          form={editForm}
          onSubmit={(data) => updateMutation.mutate({ id: selectedLease!.id, data })}
          isPending={updateMutation.isPending}
        />

        <LeaseTerminateDialog
          open={isTerminateOpen}
          onOpenChange={setIsTerminateOpen}
          onConfirm={() => selectedLease && terminateMutation.mutate(selectedLease.id)}
          isPending={terminateMutation.isPending}
        />

        <LeaseDeleteDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={() => selectedLease && deleteMutation.mutate(selectedLease.id)}
          isPending={deleteMutation.isPending}
        />
      </MainLayout>
    </PermissionPageGuard>
  );
}
