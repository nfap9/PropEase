import { Plus, Building2 } from 'lucide-react';
import { Button, Skeleton, Table } from 'antd';
import type { TableProps } from 'antd';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { LeaseSigningDrawer } from '@/pages/leases/components/lease-signing-drawer';
import { InitialReadingDialog } from '@/pages/leases/components';
import { useAuth } from '@/contexts/auth';
import { LEASES } from '@/constants/leases';
import { useLeasesPage } from './hooks/use-leases-page';
import { LeaseDeleteDialog, LeaseEditDialog, LeaseTerminateDialog } from '@/pages/leases/components/lease-dialogs';
import { LeaseFilters } from '@/pages/leases/components/lease-filters';
import { buildLeaseEditFormValues, getLeaseDisplayInfo } from '@/pages/leases/hooks/leases';
import { filterEmptyStrings } from '@/utils/form';
import type { LeaseEditFormData } from '@/types';

export default function LeasesPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const {
    apartments,
    leasesLoading,
    canCreateLease,
    filters,
    isCreateOpen,
    pendingInitialReading,
    isEditOpen,
    selectedLease,
    isTerminateOpen,
    isDeleteOpen,
    updateMutation,
    terminateMutation,
    deleteMutation,
    tableProps,
    handleFilterChange,
    handleClearFilters,
    setIsCreateOpen,
    setPendingInitialReading,
    closeTerminateDialog,
    closeDeleteDialog,
  } = useLeasesPage();

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
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          {canCreateLease && (
            <Button onClick={() => setIsCreateOpen(true)} data-testid={LEASES.NEW_BUTTON} icon={<Plus className="mr-2 h-4 w-4" />}>
              新增租约
            </Button>
          )}
        </div>
        {leasesLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <>
            <LeaseFilters
              apartments={apartments ?? []}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <Table {...tableProps} />
          </>
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
          isHistoricalLeaseEntry={pendingInitialReading.is_historical_entry}
          open={Boolean(pendingInitialReading)}
          onOpenChange={(open) => !open && setPendingInitialReading(null)}
          onSuccess={() => setPendingInitialReading(null)}
        />
      )}

      {selectedLease && (
        <LeaseEditDialog
          key={selectedLease.id}
          open={isEditOpen}
          onOpenChange={(open) => !open && setPendingInitialReading(null)}
          initialValues={buildLeaseEditFormValues(selectedLease)}
          roomDisplay={getLeaseDisplayInfo(selectedLease).roomDisplay}
          tenantDisplay={getLeaseDisplayInfo(selectedLease).tenantDisplay}
          onSubmit={(data) =>
            updateMutation.mutate({ id: selectedLease.id, data: filterEmptyStrings(data) as LeaseEditFormData })
          }
          isPending={updateMutation.isPending}
        />
      )}

      <LeaseTerminateDialog
        open={isTerminateOpen}
        onOpenChange={closeTerminateDialog}
        onConfirm={() => selectedLease && terminateMutation.mutate(selectedLease.id)}
        isPending={terminateMutation.isPending}
      />

      <LeaseDeleteDialog
        open={isDeleteOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={() => selectedLease && deleteMutation.mutate(selectedLease.id)}
        isPending={deleteMutation.isPending}
      />
    </PermissionPageGuard>
  );
}
