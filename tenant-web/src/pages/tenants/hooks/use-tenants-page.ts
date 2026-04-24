import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tenantsApi } from '@/api/tenants';
import { useAuth } from '@/contexts/auth';
import { usePermissions, PERMISSIONS } from '@/hooks/use-permissions';
import type { Tenant } from '@/types';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { useConfirmAction } from '@/hooks/use-confirm-action';
import type { TenantFormData } from '../components/tenant-form-modal';

export interface TenantsPageState {
  // Data
  tenants: Tenant[] | undefined;
  tenantsLoading: boolean;

  // Permissions
  canCreateTenant: boolean;
  canEditTenant: boolean;
  canDeleteTenant: boolean;

  // Dialog state
  isCreateOpen: boolean;
  isEditOpen: boolean;
  selectedTenant: Tenant | null;
  deleteConfirm: ReturnType<typeof useConfirmAction<Tenant>>;

  // Mutations
  createMutation: ReturnType<typeof useMutation<Tenant, Error, TenantFormData>>;
  updateMutation: ReturnType<typeof useMutation<Tenant, Error, { id: string; data: TenantFormData }>>;
  deleteMutation: ReturnType<typeof useMutation<void, Error, string>>;

  // Actions
  handleEdit: (tenant: Tenant) => void;
  handleDelete: (tenant: Tenant) => void;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  closeEditDialog: () => void;
}

export function useTenantsPage(): TenantsPageState {
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const { hasPermission } = usePermissions();
  const orgId = organization?.id;

  const canCreateTenant = hasPermission(PERMISSIONS.TENANT_CREATE);
  const canEditTenant = hasPermission(PERMISSIONS.TENANT_EDIT);
  const canDeleteTenant = hasPermission(PERMISSIONS.TENANT_DELETE);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const deleteConfirm = useConfirmAction<Tenant>();

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data: TenantFormData) => tenantsApi.create(filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      closeCreateDialog();
      toast.success('租客创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantFormData }) =>
      tenantsApi.update(id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      closeEditDialog();
      toast.success('租客信息更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      deleteConfirm.close();
      toast.success('租客删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = useCallback((tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsEditOpen(true);
  }, []);

  const handleDelete = useCallback((tenant: Tenant) => {
    deleteConfirm.openFor(tenant);
  }, [deleteConfirm]);

  const openCreateDialog = useCallback(() => setIsCreateOpen(true), []);
  const closeCreateDialog = useCallback(() => setIsCreateOpen(false), []);
  const closeEditDialog = useCallback(() => {
    setIsEditOpen(false);
    setSelectedTenant(null);
  }, []);

  return {
    tenants,
    tenantsLoading,
    canCreateTenant,
    canEditTenant,
    canDeleteTenant,
    isCreateOpen,
    isEditOpen,
    selectedTenant,
    deleteConfirm,
    createMutation,
    updateMutation,
    deleteMutation,
    handleEdit,
    handleDelete,
    openCreateDialog,
    closeCreateDialog,
    closeEditDialog,
  };
}
