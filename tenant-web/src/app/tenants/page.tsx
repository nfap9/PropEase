'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import Link from 'next/link';
import { useConfirmAction } from '@apartment-ultra/shared-ui';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { DataTable } from '@/components/common/data-table';
import { TableActions, TableAction } from '@/components/common/table-actions';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@apartment-ultra/shared-ui/components/ui';
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';
import { ColumnDef } from '@tanstack/react-table';
import { tenantsApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import { Tenant } from '@/types';
import { Plus, Pencil, Trash2, Phone, User, Building2 } from 'lucide-react';
import { Skeleton } from '@apartment-ultra/shared-ui/components/ui';

// 注意: 实际使用时从 testids 导入 TENANTS 常量
const TENANTS = {
  HEADING: 'tenants-heading',
  NEW_BUTTON: 'tenants-new-btn',
  LIST: 'tenants-list',
  SEARCH_INPUT: 'tenants-search-input',
  CREATE_DIALOG: 'tenants-create-dialog',
  NAME_INPUT: 'tenants-name-input',
  PHONE_INPUT: 'tenants-phone-input',
  ID_CARD_INPUT: 'tenants-id-card-input',
  EMERGENCY_CONTACT_INPUT: 'tenants-emergency-contact-input',
  EMERGENCY_PHONE_INPUT: 'tenants-emergency-phone-input',
  NOTES_INPUT: 'tenants-notes-input',
  CANCEL_BUTTON: 'tenants-cancel-btn',
  CONFIRM_BUTTON: 'tenants-confirm-btn',
  EDIT_DIALOG: 'tenants-edit-dialog',
  DELETE_DIALOG: 'tenants-delete-dialog',
  CONFIRM_DELETE_BTN: 'tenants-confirm-delete-btn',
  EDIT_BUTTON: 'tenants-edit-btn',
  DELETE_BUTTON: 'tenants-delete-btn',
} as const;

const tenantSchema = z.object({
  name: z.string().min(1, '请输入租客姓名'),
  phone: z.string().min(1, '请输入联系电话'),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const deleteConfirm = useConfirmAction<Tenant>();

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(orgId!),
    enabled: !!orgId,
  });

  const createForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      phone: '',
      id_card: '',
      emergency_contact: '',
      emergency_phone: '',
      notes: '',
    },
  });

  const editForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: TenantFormData) => tenantsApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
      appToast.success('租客创建成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantFormData }) =>
      tenantsApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      setIsEditOpen(false);
      setSelectedTenant(null);
      appToast.success('租客信息更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      deleteConfirm.close();
      appToast.success('租客删除成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    editForm.reset({
      name: tenant.name,
      phone: tenant.phone ?? '',
      id_card: tenant.id_card ?? '',
      emergency_contact: tenant.emergency_contact ?? '',
      emergency_phone: tenant.emergency_phone ?? '',
      notes: tenant.notes ?? '',
    });
    setIsEditOpen(true);
  };

  const handleDelete = deleteConfirm.openFor;

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
      header: '姓名',
      size: 140,
      minSize: 120,
      cell: ({ row }) => (
        <Link
          href={`/tenants/${row.original.id}`}
          className="flex items-center gap-2 font-medium text-primary hover:underline"
        >
          <User className="h-4 w-4 text-muted-foreground" />
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'phone',
      header: '电话',
      size: 140,
      minSize: 120,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {row.original.phone}
        </div>
      ),
    },
    {
      accessorKey: 'id_card',
      header: '身份证号',
      size: 180,
      minSize: 150,
      cell: ({ row }) => row.original.id_card || '-',
    },
    {
      accessorKey: 'emergency_contact',
      header: '紧急联系人',
      size: 140,
      minSize: 100,
      cell: ({ row }) => row.original.emergency_contact || '-',
    },
    {
      id: 'actions',
      size: 100,
      minSize: 80,
      cell: ({ row }) => {
        const tenant = row.original;
        const actions: TableAction[] = [
          {
            label: '编辑',
            icon: Pencil,
            onClick: () => handleEdit(tenant),
            testId: TENANTS.EDIT_BUTTON,
          },
          {
            label: '删除',
            icon: Trash2,
            onClick: () => handleDelete(tenant),
            variant: 'destructive',
            testId: TENANTS.DELETE_BUTTON,
          },
        ];
        return <TableActions actions={actions} />;
      },
    },
  ];

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

  // 无组织时的提示
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
            <h1 className="text-2xl font-semibold tracking-tight" data-testid={TENANTS.HEADING}>
              租客管理
            </h1>
            <Button onClick={() => setIsCreateOpen(true)} data-testid={TENANTS.NEW_BUTTON}>
              <Plus className="mr-2 h-4 w-4" />
              新增租客
            </Button>
          </div>

          {tenantsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <DataTable columns={columns} data={tenants || []} testid={TENANTS.LIST} />
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg" data-testid={TENANTS.CREATE_DIALOG}>
            <DialogHeader>
              <DialogTitle>新增租客</DialogTitle>
              <DialogDescription>填写租客信息</DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    姓名 <span aria-hidden="true">*</span>
                  </Label>
                  <Input id="name" aria-required {...createForm.register('name')} data-testid={TENANTS.NAME_INPUT} />
                  {createForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    联系电话 <span aria-hidden="true">*</span>
                  </Label>
                  <Input id="phone" aria-required {...createForm.register('phone')} data-testid={TENANTS.PHONE_INPUT} />
                  {createForm.formState.errors.phone && (
                    <p className="text-sm text-destructive">{createForm.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="id_card">身份证号</Label>
                  <Input id="id_card" {...createForm.register('id_card')} data-testid={TENANTS.ID_CARD_INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">紧急联系人</Label>
                  <Input
                    id="emergency_contact"
                    {...createForm.register('emergency_contact')}
                    data-testid={TENANTS.EMERGENCY_CONTACT_INPUT}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">紧急联系电话</Label>
                  <Input
                    id="emergency_phone"
                    {...createForm.register('emergency_phone')}
                    data-testid={TENANTS.EMERGENCY_PHONE_INPUT}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Input id="notes" {...createForm.register('notes')} data-testid={TENANTS.NOTES_INPUT} />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  data-testid={TENANTS.CANCEL_BUTTON}
                >
                  取消
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid={TENANTS.CONFIRM_BUTTON}>
                  {createMutation.isPending ? '创建中...' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg" data-testid={TENANTS.EDIT_DIALOG}>
            <DialogHeader>
              <DialogTitle>编辑租客</DialogTitle>
              <DialogDescription>修改租客信息</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editForm.handleSubmit((data) => updateMutation.mutate({ id: selectedTenant!.id, data }))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    姓名 <span aria-hidden="true">*</span>
                  </Label>
                  <Input id="edit-name" aria-required {...editForm.register('name')} data-testid={TENANTS.NAME_INPUT} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">
                    联系电话 <span aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="edit-phone"
                    aria-required
                    {...editForm.register('phone')}
                    data-testid={TENANTS.PHONE_INPUT}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-id_card">身份证号</Label>
                  <Input id="edit-id_card" {...editForm.register('id_card')} data-testid={TENANTS.ID_CARD_INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-emergency_contact">紧急联系人</Label>
                  <Input
                    id="edit-emergency_contact"
                    {...editForm.register('emergency_contact')}
                    data-testid={TENANTS.EMERGENCY_CONTACT_INPUT}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emergency_phone">紧急联系电话</Label>
                  <Input
                    id="edit-emergency_phone"
                    {...editForm.register('emergency_phone')}
                    data-testid={TENANTS.EMERGENCY_PHONE_INPUT}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">备注</Label>
                <Input id="edit-notes" {...editForm.register('notes')} data-testid={TENANTS.NOTES_INPUT} />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  data-testid={TENANTS.CANCEL_BUTTON}
                >
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid={TENANTS.CONFIRM_BUTTON}>
                  {updateMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          {...deleteConfirm.dialogProps}
          title="确认删除"
          description={`确定要删除租客 "${deleteConfirm.selectedItem?.name ?? ''}" 吗？此操作不可撤销。`}
          cancelLabel="取消"
          confirmLabel={deleteMutation.isPending ? '删除中...' : '删除'}
          onConfirm={() => deleteMutation.mutate(deleteConfirm.selectedItem!.id)}
          isPending={deleteMutation.isPending}
          intent="destructive"
          contentTestId={TENANTS.DELETE_DIALOG}
          cancelTestId={TENANTS.CANCEL_BUTTON}
          confirmTestId={TENANTS.CONFIRM_DELETE_BTN}
        />
      </MainLayout>
    </PermissionPageGuard>
  );
}
