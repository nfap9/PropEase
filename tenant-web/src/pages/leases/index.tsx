/**
 * LeasesPage - 租约页面主入口
 * 包含列表展示和触发其他功能的入口
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Skeleton } from 'antd';
import { Plus } from 'lucide-react';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import { Building2 } from 'lucide-react';

import { LeaseSigningDrawer } from './signing';
import { InitialReadingDialog } from './initial-reading';
import { createLeaseColumns } from './list/columns';
import { LeaseFilters } from './list/filters';
import { LeasesTable } from './list/table';
import { LeaseEditDialog } from './list/dialogs/edit-dialog';
import { LeaseTerminateDialog } from './list/dialogs/terminate-dialog';
import { LeaseDeleteDialog } from './list/dialogs/delete-dialog';
import { useLeasesData } from './signing/use-lease-data';
import { filterLeases, buildLeaseEditFormValues, getLeaseDisplayInfo } from './utils/leases-utils';
import type { Lease, LeaseFiltersState } from '@/types';
import { LEASES } from '@/constants/leases';

const DEFAULT_LEASE_FILTERS: LeaseFiltersState = {
  apartmentId: null,
  keyword: null,
  startDateFrom: null,
  startDateTo: null,
  endDateFrom: null,
  endDateTo: null,
};

export default function LeasesPage() {
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;
  const { hasPermission } = usePermissions();

  const canCreateLease = hasPermission(PERMISSIONS.LEASE_CREATE);
  const canEditLease = hasPermission(PERMISSIONS.LEASE_EDIT);
  const canDeleteLease = hasPermission(PERMISSIONS.LEASE_DELETE);

  // 签约抽屉
  const [isLeaseOpen, setIsLeaseOpen] = useState(false);
  const [pendingInitialReading, setPendingInitialReading] = useState<{ room_id: string; room_display: string; start_date: string; is_historical_entry: boolean } | null>(null);

  // 筛选状态
  const [filters, setFilters] = useState<LeaseFiltersState>(DEFAULT_LEASE_FILTERS);

  // 表格选中状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<Record<string, boolean>>({});

  // Dialog 状态
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
      setSelectedRowKeys({});
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

  const handleSelectionChange = useCallback((keys: React.Key[]) => {
    const newSelection: Record<string, boolean> = {};
    keys.forEach((key) => {
      newSelection[key as string] = true;
    });
    const selectedId = Object.keys(newSelection).pop();
    const lease = selectedId ? filteredLeases.find((l) => l.id === selectedId) : null;
    if (lease) {
      setSelectedLease(lease);
      setIsEditOpen(true);
    }
  }, [filteredLeases]);

  // 筛选变化时清除选中
  const filtersRef = useRef(filters);
  useEffect(() => {
    if (filtersRef.current !== filters) {
      filtersRef.current = filters;
      setSelectedRowKeys({});
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

  const displayInfo = selectedLease ? getLeaseDisplayInfo(selectedLease) : { roomDisplay: '', tenantDisplay: '' };

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
            <Button
              onClick={() => setIsLeaseOpen(true)}
              data-testid={LEASES.NEW_BUTTON}
              icon={<Plus className="mr-2 h-4 w-4" />}
            >
              新增租约
            </Button>
          )}
        </div>

        <LeaseFilters
          apartments={apartments?.map((apt) => ({ id: apt.id, name: apt.name })) ?? []}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <LeasesTable
          leases={filteredLeases}
          loading={leasesLoading}
          columns={columns}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={handleSelectionChange}
        />

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
                setSelectedRowKeys({});
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
      </div>

      <LeaseSigningDrawer
        orgId={orgId}
        open={isLeaseOpen}
        onOpenChange={setIsLeaseOpen}
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
    </PermissionPageGuard>
  );
}
