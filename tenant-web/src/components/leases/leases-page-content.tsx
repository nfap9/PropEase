
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Building2 } from 'lucide-react';
import { useConfirmAction, useListFilters, useSelection } from '@apartment-ultra/shared-ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ListPageLayout } from '@apartment-ultra/shared-ui/components/ui';
import { PageToolbar } from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { LeaseSigningDrawer } from './lease-signing-drawer';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';
import type { LeaseCreatedParams } from '@/components/common/lease-form-dialog';
import { useAuth } from '@/contexts/auth';
import { toDateInputValue } from '@/utils/date';
import { DataTable } from '@/components/common/data-table';
import type { Lease } from '@/types';
import { createLeaseColumns } from '@/components/leases/columns';
import { useLeasesData } from '@/hooks/leases';
import {
  getDefaultLeaseFilters,
  LEASES,
  leaseSchema,
  type LeaseEditFormData,
  type LeaseFiltersState,
} from '@/schemas/leases';
import { filterLeases } from '@/utils/leases';
import { LeaseDeleteDialog, LeaseEditDialog, LeaseTerminateDialog } from './lease-dialogs';
import { LeaseFilters } from './lease-filters';

export function LeasesPageContent() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingInitialReading, setPendingInitialReading] = useState<LeaseCreatedParams | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const editLease = useSelection<Lease>();
  const terminateConfirm = useConfirmAction<Lease>();
  const deleteConfirm = useConfirmAction<Lease>();
  const { filters, setFilter, resetFilters } = useListFilters<LeaseFiltersState>(getDefaultLeaseFilters);

  const editForm = useForm<LeaseEditFormData>({
    resolver: zodResolver(leaseSchema),
  });

  const { apartments, leases, leasesLoading, updateMutation, terminateMutation, deleteMutation } = useLeasesData({
    orgId,
    onUpdateSuccess: () => {
      setIsEditOpen(false);
      editLease.clear();
    },
    onTerminateSuccess: terminateConfirm.close,
    onDeleteSuccess: deleteConfirm.close,
  });

  const filteredLeases = useMemo(() => filterLeases(leases, filters), [leases, filters]);

  const handleEdit = useCallback(
    (lease: Lease) => {
      editLease.select(lease);
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
    },
    [editForm, editLease]
  );

  const columns = useMemo(
    () =>
      createLeaseColumns({
        onEdit: handleEdit,
        onTerminate: terminateConfirm.openFor,
        onDelete: deleteConfirm.openFor,
      }),
    [deleteConfirm.openFor, handleEdit, terminateConfirm.openFor]
  );

  const handleFilterChange = useCallback(
    (key: keyof LeaseFiltersState, value: unknown) => {
      setFilter(key, value as LeaseFiltersState[typeof key]);
    },
    [setFilter]
  );

  const handleEditDialogOpenChange = useCallback(
    (open: boolean) => {
      setIsEditOpen(open);

      if (!open) {
        editLease.clear();
      }
    },
    [editLease]
  );

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">请先创建或加入团队</h2>
        <p className="text-muted-foreground">在顶部导航栏选择或创建一个团队开始使用</p>
      </div>
    );
  }

  return (
    <PermissionPageGuard>
      <ListPageLayout
          title=""
          maxWidth="full"
          className="w-full"
          actions={
            <PageToolbar>
              <Button onClick={() => setIsCreateOpen(true)} data-testid={LEASES.NEW_BUTTON}>
                <Plus className="mr-2 h-4 w-4" />
                新增租约
              </Button>
            </PageToolbar>
          }
        >
          {leasesLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <DataTable
              columns={columns}
              data={filteredLeases}
              testid={LEASES.LIST}
              useCard={false}
              toolbar={
                <LeaseFilters
                  apartments={apartments?.map((apartment) => ({ id: apartment.id, name: apartment.name })) ?? []}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={resetFilters}
                />
              }
            />
          )}
        </ListPageLayout>

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
            isHistoricalLeaseEntry={pendingInitialReading.is_historical_entry}
            open={Boolean(pendingInitialReading)}
            onOpenChange={(open) => !open && setPendingInitialReading(null)}
            onSuccess={() => setPendingInitialReading(null)}
          />
        )}

        <LeaseEditDialog
          open={isEditOpen}
          onOpenChange={handleEditDialogOpenChange}
          selectedLease={editLease.selected}
          form={editForm}
          onSubmit={(data) => updateMutation.mutate({ id: editLease.selected!.id, data })}
          isPending={updateMutation.isPending}
        />

        <LeaseTerminateDialog
          {...terminateConfirm.dialogProps}
          onConfirm={() => terminateConfirm.selectedItem && terminateMutation.mutate(terminateConfirm.selectedItem.id)}
          isPending={terminateMutation.isPending}
        />

        <LeaseDeleteDialog
          {...deleteConfirm.dialogProps}
          onConfirm={() => deleteConfirm.selectedItem && deleteMutation.mutate(deleteConfirm.selectedItem.id)}
          isPending={deleteMutation.isPending}
        />
    </PermissionPageGuard>
  );
}
