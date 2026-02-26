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
import { ColumnDef } from '@tanstack/react-table';
import { apartmentsApi, organizationsApi } from '@/lib/api';
import { Apartment } from '@/types';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const apartmentSchema = z.object({
  name: z.string().min(1, '请输入公寓名称'),
  address: z.string().min(1, '请输入公寓地址'),
  description: z.string().optional(),
});

type ApartmentFormData = z.infer<typeof apartmentSchema>;

export default function ApartmentsPage() {
  const { } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });

  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', selectedOrgId],
    queryFn: () => apartmentsApi.list(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  const createForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: { name: '', address: '', description: '' },
  });

  const editForm = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: ApartmentFormData) =>
      apartmentsApi.create(selectedOrgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', selectedOrgId] });
      setIsCreateOpen(false);
      createForm.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApartmentFormData }) =>
      apartmentsApi.update(selectedOrgId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', selectedOrgId] });
      setIsEditOpen(false);
      setSelectedApartment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apartmentsApi.delete(selectedOrgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', selectedOrgId] });
      setIsDeleteOpen(false);
      setSelectedApartment(null);
    },
  });

  const handleEdit = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    editForm.reset({
      name: apartment.name,
      address: apartment.address ?? '',
      description: apartment.description ?? '',
    });
    setIsEditOpen(true);
  };

  const handleDelete = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<Apartment>[] = [
    {
      accessorKey: 'name',
      header: '公寓名称',
    },
    {
      accessorKey: 'address',
      header: '地址',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const apartment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(apartment)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(apartment)}
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

  if (!organizations || organizations.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">请先创建组织</h2>
          <p className="text-muted-foreground mb-4">
            您需要先创建一个组织才能管理公寓
          </p>
          <Button onClick={() => (window.location.href = '/settings/team')}>
            前往创建组织
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">公寓管理</h1>
          <div className="flex items-center gap-4">
            <Select
              value={selectedOrgId?.toString() || ''}
              onValueChange={(value) => setSelectedOrgId(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择组织" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateOpen(true)} disabled={!selectedOrgId}>
              <Plus className="mr-2 h-4 w-4" />
              新增公寓
            </Button>
          </div>
        </div>

        {apartmentsLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={apartments || []} />
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增公寓</DialogTitle>
            <DialogDescription>填写公寓信息创建新的公寓</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">公寓名称</Label>
              <Input
                id="name"
                {...createForm.register('name')}
                placeholder="例如：阳光公寓A栋"
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                {...createForm.register('address')}
                placeholder="例如：北京市朝阳区xxx路xxx号"
              />
              {createForm.formState.errors.address && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.address.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input id="description" {...createForm.register('description')} />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑公寓</DialogTitle>
            <DialogDescription>修改公寓信息</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateMutation.mutate({ id: selectedApartment!.id, data })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">公寓名称</Label>
              <Input id="edit-name" {...editForm.register('name')} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">地址</Label>
              <Input id="edit-address" {...editForm.register('address')} />
              {editForm.formState.errors.address && (
                <p className="text-sm text-destructive">
                  {editForm.formState.errors.address.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Input id="edit-description" {...editForm.register('description')} />
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
              确定要删除公寓 &ldquo;{selectedApartment?.name}&rdquo; 吗？此操作不可撤销，关联的房间数据也将被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedApartment!.id)}
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
