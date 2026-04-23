import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { Button, Skeleton, Table, Modal } from 'antd';
import type { TableProps } from 'antd';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { LeaseSigningDrawer } from '@/pages/leases/components/lease-signing-drawer';
import { InitialReadingDialog } from '@/components/common/initial-reading-dialog';
import type { LeaseCreatedParams } from '@/components/common/lease-form-dialog';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import type { Lease } from '@/types';
import { createLeaseColumns } from '@/pages/leases/components/columns';
import { useLeasesData } from '@/hooks/leases';
import {
  getDefaultLeaseFilters,
  type LeaseEditFormData,
  type LeaseFiltersState,
} from '@/schemas/leases';
import { LEASES } from '@/constants/leases';
import { filterLeases } from '@/hooks/leases';
import { LeaseDeleteDialog, LeaseEditDialog, LeaseTerminateDialog } from '@/pages/leases/components/lease-dialogs';
import { LeaseFilters } from '@/pages/leases/components/lease-filters';

export default function LeasesPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  const canCreateLease = hasPermission(PERMISSIONS.LEASE_CREATE);
  const canEditLease = hasPermission(PERMISSIONS.LEASE_EDIT);
  const canDeleteLease = hasPermission(PERMISSIONS.LEASE_DELETE);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingInitialReading, setPendingInitialReading] = useState<LeaseCreatedParams | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [filters, setFilters] = useState<LeaseFiltersState>(getDefaultLeaseFilters());

  const { apartments, leases, leasesLoading, updateMutation, terminateMutation, deleteMutation } = useLeasesData({
    onUpdateSuccess: () => {
      setIsEditOpen(false);
      setSelectedLease(null);
      setRowSelection({});
    },
    onTerminateSuccess: () => setIsTerminateOpen(false),
    onDeleteSuccess: () => setIsDeleteOpen(false),
  });

  const filteredLeases = useMemo(() => filterLeases(leases, filters), [leases, filters]);

  const handleRowSelectionChange = useCallback(
    (selection: Record<string, boolean>) => {
      setRowSelection(selection);
      const selectedIds = Object.keys(selection).filter((id) => selection[id]);
      if (selectedIds.length > 0) {
        const selectedId = selectedIds[selectedIds.length - 1];
        const lease = filteredLeases.find((l) => l.id === selectedId);
        if (lease) {
          setSelectedLease(lease);
          setIsEditOpen(true);
        }
      }
    },
    [filteredLeases]
  );

  const handleEditDialogOpenChange = useCallback((open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setSelectedLease(null);
      setRowSelection({});
    }
  }, []);

  const columns = useMemo(
    () =>
      createLeaseColumns({
        onEdit: (lease) => {
          setSelectedLease(lease);
          setIsEditOpen(true);
        },
        onTerminate: (lease) => {
          setSelectedLease(lease);
          setIsTerminateOpen(true);
        },
        onDelete: (lease) => {
          setSelectedLease(lease);
          setIsDeleteOpen(true);
        },
        canEditLease,
        canDeleteLease,
      }),
    [canEditLease, canDeleteLease]
  );

  const handleFilterChange = useCallback(
    (key: keyof LeaseFiltersState, value: unknown) => {
      setFilters((prev) => ({ ...prev, [key]: value as LeaseFiltersState[typeof key] }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(getDefaultLeaseFilters());
  }, []);

  const filtersRef = useRef(filters);
  useEffect(() => {
    if (filtersRef.current !== filters) {
      filtersRef.current = filters;
      setRowSelection({});
      setSelectedLease(null);
      setIsEditOpen(false);
    }
  }, [filters]);

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

  const tableProps: TableProps<Lease> = {
    columns,
    dataSource: filteredLeases,
    rowKey: 'id',
    pagination: false,
    rowSelection: {
      type: 'radio',
      selectedRowKeys: Object.keys(rowSelection),
      onChange: (selectedRowKeys) => {
        const newSelection: Record<string, boolean> = {};
        selectedRowKeys.forEach((key) => {
          newSelection[key as string] = true;
        });
        handleRowSelectionChange(newSelection);
      },
    },
  };

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
              apartments={apartments?.map((apartment) => ({ id: apartment.id, name: apartment.name })) ?? []}
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
          onOpenChange={handleEditDialogOpenChange}
          selectedLease={selectedLease}
          onSubmit={(data) => updateMutation.mutate({ id: selectedLease.id, data })}
          isPending={updateMutation.isPending}
        />
      )}

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
    </PermissionPageGuard>
  );
}
