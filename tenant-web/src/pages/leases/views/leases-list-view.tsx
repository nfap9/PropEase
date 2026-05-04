/**
 * LeasesListView - 租约列表视图
 *
 * 自包含的视图组件，内部管理：
 * - useLeasesData：获取租约列表
 * - useLeaseOperations：update/terminate/delete mutations
 * - LeaseFilters、Table 状态
 * - 编辑/终止/删除 Dialog 状态
 *
 * 对外仅暴露 orgId（权限检查在父组件进行）。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TableProps } from 'antd';
import { Button, Skeleton, Table } from 'antd';
import { Plus } from 'lucide-react';
import type { Lease, LeaseFiltersState } from '@/types';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { LEASES } from '@/constants/leases';
import { createLeaseColumns } from '../components/columns';
import { LeaseFilters } from '../components/lease-filters';
import { LeaseEditDialog, LeaseTerminateDialog, LeaseDeleteDialog, LeaseCreateDialog } from './lease-dialogs';
import { useLeasesData } from '../hooks/use-lease-data';
import { filterLeases, buildLeaseEditFormValues, getLeaseDisplayInfo } from '../hooks/leases-utils';

const DEFAULT_LEASE_FILTERS: LeaseFiltersState = {
  apartmentId: null,
  keyword: null,
  startDateFrom: null,
  startDateTo: null,
  endDateFrom: null,
  endDateTo: null,
};

export function LeasesListView() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const { hasPermission } = usePermissions();

  const canCreateLease = hasPermission(PERMISSIONS.LEASE_CREATE);
  const canEditLease = hasPermission(PERMISSIONS.LEASE_EDIT);
  const canDeleteLease = hasPermission(PERMISSIONS.LEASE_DELETE);

  const [filters, setFilters] = useState<LeaseFiltersState>(DEFAULT_LEASE_FILTERS);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  const { apartments, leases, leasesLoading, updateLease, terminateLease, deleteLease, isUpdating, isTerminating, isDeleting } = useLeasesData();

  const filteredLeases = useMemo(() => filterLeases(leases, filters), [leases, filters]);

  const handleEdit = useCallback((lease: Lease) => {
    setSelectedLease(lease);
    setIsEditOpen(true);
  }, []);

  const handleTerminate = useCallback((lease: Lease) => {
    setSelectedLease(lease);
    setIsTerminateOpen(true);
  }, []);

  const handleDelete = useCallback((lease: Lease) => {
    setSelectedLease(lease);
    setIsDeleteOpen(true);
  }, []);

  const handleEditDialogOpenChange = useCallback((open: boolean) => {
    setIsEditOpen(open);
    if (!open) {
      setSelectedLease(null);
      setRowSelection({});
    }
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof LeaseFiltersState, value: unknown) => {
      setFilters((prev) => ({ ...prev, [key]: value as LeaseFiltersState[typeof key] }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_LEASE_FILTERS);
  }, []);

  // Clear selection when filters change
  const filtersRef = useRef(filters);
  useEffect(() => {
    if (filtersRef.current !== filters) {
      filtersRef.current = filters;
      setRowSelection({});
      setSelectedLease(null);
      setIsEditOpen(false);
    }
  }, [filters]);

  const columns = useMemo(
    () =>
      createLeaseColumns({
        onEdit: handleEdit,
        onTerminate: handleTerminate,
        onDelete: handleDelete,
        canEditLease,
        canDeleteLease,
      }),
    [canEditLease, canDeleteLease, handleEdit, handleTerminate, handleDelete],
  );

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
        const selectedId = Object.keys(newSelection).pop();
        const lease = selectedId ? filteredLeases.find((l) => l.id === selectedId) : null;
        if (lease) {
          setSelectedLease(lease);
          setIsEditOpen(true);
        }
      },
    },
  };

  const displayInfo = selectedLease ? getLeaseDisplayInfo(selectedLease) : { roomDisplay: '', tenantDisplay: '' };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        {canCreateLease && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            data-testid={LEASES.NEW_BUTTON}
            icon={<Plus className="mr-2 h-4 w-4" />}
          >
            新增租约
          </Button>
        )}
      </div>

      {leasesLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <LeaseFilters
            apartments={apartments?.map((apt) => ({ id: apt.id, name: apt.name })) ?? []}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
          <Table {...tableProps} />
        </>
      )}

      {selectedLease && (
        <LeaseEditDialog
          key={selectedLease.id}
          open={isEditOpen}
          onOpenChange={handleEditDialogOpenChange}
          initialValues={buildLeaseEditFormValues(selectedLease)}
          roomDisplay={displayInfo.roomDisplay}
          tenantDisplay={displayInfo.tenantDisplay}
          onSubmit={(data) =>
            updateLease(selectedLease.id, data, () => {
              setIsEditOpen(false);
              setSelectedLease(null);
              setRowSelection({});
            })
          }
          isPending={isUpdating}
        />
      )}

      <LeaseTerminateDialog
        open={isTerminateOpen}
        onOpenChange={(open) => !open && setIsTerminateOpen(false)}
        onConfirm={() =>
          selectedLease && terminateLease(selectedLease.id, () => setIsTerminateOpen(false))
        }
        isPending={isTerminating}
      />

      <LeaseDeleteDialog
        open={isDeleteOpen}
        onOpenChange={(open) => !open && setIsDeleteOpen(false)}
        onConfirm={() =>
          selectedLease && deleteLease(selectedLease.id, () => setIsDeleteOpen(false))
        }
        isPending={isDeleting}
      />

      <LeaseCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        apartments={apartments?.map((apt) => ({ id: apt.id, name: apt.name }))}
      />
    </div>
  );
}
