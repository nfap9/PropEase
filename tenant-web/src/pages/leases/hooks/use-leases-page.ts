import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TableProps } from 'antd';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import type { Lease, LeaseEditFormData, LeaseFiltersState } from '@/types';
import { createLeaseColumns } from '@/pages/leases/components/columns';
import { useLeasesData } from '@/hooks/leases';
import { filterLeases, buildLeaseEditFormValues, getLeaseDisplayInfo } from '@/hooks/leases';
import { filterEmptyStrings } from '@/utils/form';
import type { LeaseCreatedParams } from '@/components/common/lease-form-dialog';

const DEFAULT_LEASE_FILTERS: LeaseFiltersState = {
  apartmentId: null,
  keyword: null,
  startDateFrom: null,
  startDateTo: null,
  endDateFrom: null,
  endDateTo: null,
};

export interface LeasesPageState {
  // Data
  apartments: { id: string; name: string }[] | undefined;
  leases: Lease[] | undefined;
  leasesLoading: boolean;
  filteredLeases: Lease[];

  // Permissions
  canCreateLease: boolean;
  canEditLease: boolean;
  canDeleteLease: boolean;

  // UI State
  isCreateOpen: boolean;
  pendingInitialReading: LeaseCreatedParams | null;
  isEditOpen: boolean;
  selectedLease: Lease | null;
  rowSelection: Record<string, boolean>;
  isTerminateOpen: boolean;
  isDeleteOpen: boolean;
  filters: LeaseFiltersState;
  tableProps: TableProps<Lease>;

  // Mutations
  updateMutation: ReturnType<typeof useLeasesData>['updateMutation'];
  terminateMutation: ReturnType<typeof useLeasesData>['terminateMutation'];
  deleteMutation: ReturnType<typeof useLeasesData>['deleteMutation'];

  // Actions
  handleEdit: (lease: Lease) => void;
  handleTerminate: (lease: Lease) => void;
  handleDelete: (lease: Lease) => void;
  handleRowSelectionChange: (selection: Record<string, boolean>) => void;
  handleEditDialogOpenChange: (open: boolean) => void;
  handleFilterChange: (key: keyof LeaseFiltersState, value: unknown) => void;
  handleClearFilters: () => void;
  setIsCreateOpen: (open: boolean) => void;
  setPendingInitialReading: (value: LeaseCreatedParams | null) => void;
  closeTerminateDialog: () => void;
  closeDeleteDialog: () => void;
}

export function useLeasesPage(): LeasesPageState {
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
  const [filters, setFilters] = useState<LeaseFiltersState>(DEFAULT_LEASE_FILTERS);

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
        onEdit: handleEdit,
        onTerminate: handleTerminate,
        onDelete: handleDelete,
        canEditLease,
        canDeleteLease,
      }),
    [canEditLease, canDeleteLease, handleEdit, handleTerminate, handleDelete]
  );

  const handleFilterChange = useCallback(
    (key: keyof LeaseFiltersState, value: unknown) => {
      setFilters((prev) => ({ ...prev, [key]: value as LeaseFiltersState[typeof key] }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_LEASE_FILTERS);
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

  const closeTerminateDialog = useCallback(() => setIsTerminateOpen(false), []);
  const closeDeleteDialog = useCallback(() => setIsDeleteOpen(false), []);

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

  return {
    apartments: apartments?.map((apt) => ({ id: apt.id, name: apt.name })),
    leases,
    leasesLoading,
    filteredLeases,
    canCreateLease,
    canEditLease,
    canDeleteLease,
    isCreateOpen,
    pendingInitialReading,
    isEditOpen,
    selectedLease,
    rowSelection,
    isTerminateOpen,
    isDeleteOpen,
    filters,
    updateMutation,
    terminateMutation,
    deleteMutation,
    tableProps,
    handleEdit,
    handleTerminate,
    handleDelete,
    handleRowSelectionChange,
    handleEditDialogOpenChange,
    handleFilterChange,
    handleClearFilters,
    setIsCreateOpen,
    setPendingInitialReading,
    closeTerminateDialog,
    closeDeleteDialog,
  };
}
