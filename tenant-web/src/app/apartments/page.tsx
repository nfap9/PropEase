'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { useConfirmAction } from '@apartment-ultra/shared-ui';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';
import { apartmentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { ApartmentWithStats } from '@/types';
import { Building2, Plus } from 'lucide-react';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import {
  ApartmentCard,
  ApartmentEmptyState,
  ApartmentForm,
  ApartmentSearchBar,
  apartmentSchema,
  type ApartmentFormData,
} from '@/components/apartments';
import { PermissionGuard } from '@/components/common/permission-guard';
import { PERMISSIONS } from '@/hooks/use-permissions';

export default function ApartmentsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentWithStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deleteConfirm = useConfirmAction<ApartmentWithStats>();

  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const createForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      name: '',
      address: '',
      description: '',
      floors: undefined,
      land_area: undefined,
      total_area: undefined,
      landlord_name: '',
      landlord_contact: '',
      contract_start: '',
      contract_end: '',
      landlord_rent: undefined,
    },
  });

  const editForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: ApartmentFormData) => apartmentsApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
      appToast.success('公寓创建成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApartmentFormData }) =>
      apartmentsApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsEditOpen(false);
      setSelectedApartment(null);
      appToast.success('公寓更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apartmentsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      deleteConfirm.close();
      appToast.success('公寓删除成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    editForm.reset({
      name: apartment.name,
      address: apartment.address ?? '',
      description: apartment.description ?? '',
      floors: apartment.floors ?? undefined,
      land_area: apartment.land_area ?? undefined,
      total_area: apartment.total_area ?? undefined,
      landlord_name: apartment.landlord_name ?? '',
      landlord_contact: apartment.landlord_contact ?? '',
      contract_start: apartment.contract_start ? new Date(apartment.contract_start).toISOString().split('T')[0] : '',
      contract_end: apartment.contract_end ? new Date(apartment.contract_end).toISOString().split('T')[0] : '',
      landlord_rent: apartment.landlord_rent ?? undefined,
    });
    setIsEditOpen(true);
  };

  const handleDelete = deleteConfirm.openFor;

  const filteredApartments = apartments?.filter((apartment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return apartment.name.toLowerCase().includes(query) || (apartment.address?.toLowerCase().includes(query) ?? false);
  });

  if (authLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
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
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ApartmentSearchBar value={searchQuery} onChange={setSearchQuery} />
            <PermissionGuard permission={PERMISSIONS.APARTMENT_CREATE}>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="apartments-new-btn" className="shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                新增公寓
              </Button>
            </PermissionGuard>
          </div>

          {apartmentsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : filteredApartments && filteredApartments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto" data-testid="apartments-list">
              {filteredApartments.map((apartment) => (
                <ApartmentCard key={apartment.id} apartment={apartment} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <ApartmentEmptyState
              hasApartments={!!apartments && apartments.length > 0}
              onCreateClick={() => setIsCreateOpen(true)}
            />
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="apartments-create-dialog">
            <DialogHeader>
              <DialogTitle>新增公寓</DialogTitle>
              <DialogDescription>填写公寓信息创建新的公寓</DialogDescription>
            </DialogHeader>
            <ApartmentForm
              form={createForm}
              mode="create"
              formId="create-apartment-form"
              onSubmit={(data) => createMutation.mutate(data)}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                data-testid="apartments-cancel-btn"
              >
                取消
              </Button>
              <Button
                type="submit"
                form="create-apartment-form"
                disabled={createMutation.isPending}
                data-testid="apartments-confirm-btn"
              >
                {createMutation.isPending ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="apartments-edit-dialog">
            <DialogHeader>
              <DialogTitle>编辑公寓</DialogTitle>
              <DialogDescription>修改公寓信息</DialogDescription>
            </DialogHeader>
            <ApartmentForm
              form={editForm}
              mode="edit"
              formId="edit-apartment-form"
              onSubmit={(data) => updateMutation.mutate({ id: selectedApartment!.id, data })}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                data-testid="apartments-cancel-btn"
              >
                取消
              </Button>
              <Button
                type="submit"
                form="edit-apartment-form"
                disabled={updateMutation.isPending}
                data-testid="apartments-confirm-btn"
              >
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          {...deleteConfirm.dialogProps}
          title="确认删除"
          description={`确定要删除公寓 "${deleteConfirm.selectedItem?.name ?? ''}" 吗？此操作不可撤销，关联的房间数据也将被删除。`}
          cancelLabel="取消"
          confirmLabel={deleteMutation.isPending ? '删除中...' : '删除'}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.selectedItem!.id)}
          isPending={deleteMutation.isPending}
          intent="destructive"
          contentTestId="apartments-delete-confirm-dialog"
          cancelTestId="apartments-cancel-btn"
          confirmTestId="apartments-confirm-delete-btn"
        />
      </MainLayout>
    </PermissionPageGuard>
  );
}
