'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { tenantsApi, organizationsApi } from '@/lib/api';
import { Tenant } from '@/types';
import { Plus, MoreHorizontal, Pencil, Trash2, Phone, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const tenantSchema = z.object({
  name: z.string().min(1, '请输入租客姓名'),
  phone: z.string().min(1, '请输入联系电话'),
  id_card: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  email: z.string().email('请输入有效的邮箱').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', selectedOrgId],
    queryFn: () => tenantsApi.list(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  const createForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      phone: '',
      id_card: '',
      emergency_contact: '',
      emergency_phone: '',
      email: '',
      notes: '',
    },
  });

  const editForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: TenantFormData) => tenantsApi.create(selectedOrgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', selectedOrgId] });
      setIsCreateOpen(false);
      createForm.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TenantFormData }) =>
      tenantsApi.update(selectedOrgId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', selectedOrgId] });
      setIsEditOpen(false);
      setSelectedTenant(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tenantsApi.delete(selectedOrgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', selectedOrgId] });
      setIsDeleteOpen(false);
      setSelectedTenant(null);
    },
  });

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    editForm.reset({
      name: tenant.name,
      phone: tenant.phone ?? '',
      id_card: tenant.id_card ?? '',
      emergency_contact: tenant.emergency_contact ?? '',
      emergency_phone: tenant.emergency_phone ?? '',
      email: tenant.email ?? '',
      notes: tenant.notes ?? '',
    });
    setIsEditOpen(true);
  };

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: 'name',
      header: '姓名',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: '电话',
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
      cell: ({ row }) => row.original.id_card || '-',
    },
    {
      accessorKey: 'emergency_contact',
      header: '紧急联系人',
      cell: ({ row }) => row.original.emergency_contact || '-',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(tenant)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (orgsLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">租客管理</h1>
          <div className="flex items-center gap-4">
            <Select
              value={selectedOrgId?.toString() || ''}
              onValueChange={(value) => setSelectedOrgId(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择组织" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateOpen(true)} disabled={!selectedOrgId}>
              <Plus className="mr-2 h-4 w-4" />
              新增租客
            </Button>
          </div>
        </div>

        {tenantsLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={tenants || []} />
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增租客</DialogTitle>
            <DialogDescription>填写租客信息</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input id="name" {...createForm.register('name')} />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">联系电话 *</Label>
                <Input id="phone" {...createForm.register('phone')} />
                {createForm.formState.errors.phone && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_card">身份证号</Label>
                <Input id="id_card" {...createForm.register('id_card')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" {...createForm.register('email')} />
                {createForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">紧急联系人</Label>
                <Input
                  id="emergency_contact"
                  {...createForm.register('emergency_contact')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">紧急联系电话</Label>
                <Input
                  id="emergency_phone"
                  {...createForm.register('emergency_phone')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">备注</Label>
              <Input id="notes" {...createForm.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑租客</DialogTitle>
            <DialogDescription>修改租客信息</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateMutation.mutate({ id: selectedTenant!.id, data })
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">姓名 *</Label>
                <Input id="edit-name" {...editForm.register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">联系电话 *</Label>
                <Input id="edit-phone" {...editForm.register('phone')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-id_card">身份证号</Label>
                <Input id="edit-id_card" {...editForm.register('id_card')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">邮箱</Label>
                <Input id="edit-email" type="email" {...editForm.register('email')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-emergency_contact">紧急联系人</Label>
                <Input
                  id="edit-emergency_contact"
                  {...editForm.register('emergency_contact')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-emergency_phone">紧急联系电话</Label>
                <Input
                  id="edit-emergency_phone"
                  {...editForm.register('emergency_phone')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">备注</Label>
              <Input id="edit-notes" {...editForm.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除租客 &ldquo;{selectedTenant?.name}&rdquo; 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedTenant!.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
