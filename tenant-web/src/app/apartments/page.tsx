'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<ApartmentWithStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      operating_cost: undefined,
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
      toast.success('公寓创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApartmentFormData }) =>
      apartmentsApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsEditOpen(false);
      setSelectedApartment(null);
      toast.success('公寓更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apartmentsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsDeleteOpen(false);
      setSelectedApartment(null);
      toast.success('公寓删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
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
      contract_start: apartment.contract_start
        ? new Date(apartment.contract_start).toISOString().split('T')[0]
        : '',
      contract_end: apartment.contract_end
        ? new Date(apartment.contract_end).toISOString().split('T')[0]
        : '',
      landlord_rent: apartment.landlord_rent ?? undefined,
      operating_cost: apartment.operating_cost ?? undefined,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (apartment: ApartmentWithStats) => {
    setSelectedApartment(apartment);
    setIsDeleteOpen(true);
  };

  const filteredApartments = apartments?.filter((apartment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      apartment.name.toLowerCase().includes(query) ||
      (apartment.address?.toLowerCase().includes(query) ?? false)
    );
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" data-testid="apartments-heading">
                公寓管理
              </h1>
              <p className="mt-1 text-muted-foreground">管理您的所有公寓和房间</p>
            </div>
            <PermissionGuard permission={PERMISSIONS.APARTMENT_CREATE}>
              <Button
                onClick={() => setIsCreateOpen(true)}
                data-testid="apartments-new-btn"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增公寓
              </Button>
            </PermissionGuard>
          </div>

          <ApartmentSearchBar value={searchQuery} onChange={setSearchQuery} />

          {apartmentsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : filteredApartments && filteredApartments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="apartments-list">
              {filteredApartments.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
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
          <DialogContent data-testid="apartments-create-dialog">
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
          <DialogContent data-testid="apartments-edit-dialog">
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

        {/* Delete Alert Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent data-testid="apartments-delete-confirm-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除公寓 &quot;{selectedApartment?.name}&quot;
                吗？此操作不可撤销，关联的房间数据也将被删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="apartments-cancel-btn">取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(selectedApartment!.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="apartments-confirm-delete-btn"
              >
                {deleteMutation.isPending ? '删除中...' : '删除'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MainLayout>
    </PermissionPageGuard>
  );
}
