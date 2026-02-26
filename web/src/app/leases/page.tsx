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
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
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
import { leasesApi, apartmentsApi, roomsApi, tenantsApi, organizationsApi } from '@/lib/api';
import { Lease } from '@/types';
import { Plus, MoreHorizontal, Pencil, Trash2, Ban } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const leaseSchema = z.object({
  room_id: z.number().min(1, '请选择房间'),
  tenant_id: z.number().min(1, '请选择租客'),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().optional(),
  monthly_rent: z.number().min(0, '月租不能为负'),
  deposit: z.number().min(0, '押金不能为负').optional(),
  water_rate: z.number().min(0).optional(),
  electricity_rate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type LeaseFormData = z.infer<typeof leaseSchema>;

export default function LeasesPage() {
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
  });

  const { data: apartments } = useQuery({
    queryKey: ['apartments', selectedOrgId],
    queryFn: () => apartmentsApi.list(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', selectedOrgId, selectedApartmentId],
    queryFn: () => roomsApi.list(selectedOrgId!, selectedApartmentId || undefined),
    enabled: !!selectedOrgId,
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants', selectedOrgId],
    queryFn: () => tenantsApi.list(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  const { data: leases, isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', selectedOrgId],
    queryFn: () => leasesApi.list(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  const createForm = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      room_id: 0,
      tenant_id: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      monthly_rent: 0,
      deposit: 0,
      water_rate: 0,
      electricity_rate: 0,
      notes: '',
    },
  });

  const editForm = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: LeaseFormData) => leasesApi.create(selectedOrgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', selectedOrgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', selectedOrgId] });
      setIsCreateOpen(false);
      createForm.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeaseFormData }) =>
      leasesApi.update(selectedOrgId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', selectedOrgId] });
      setIsEditOpen(false);
      setSelectedLease(null);
    },
  });

  const terminateMutation = useMutation({
    mutationFn: (id: number) => leasesApi.terminate(selectedOrgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', selectedOrgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', selectedOrgId] });
      setIsTerminateOpen(false);
      setSelectedLease(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leasesApi.delete(selectedOrgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', selectedOrgId] });
      setIsDeleteOpen(false);
      setSelectedLease(null);
    },
  });

  const handleEdit = (lease: Lease) => {
    setSelectedLease(lease);
    editForm.reset({
      room_id: lease.room_id,
      tenant_id: lease.tenant_id,
      start_date: lease.start_date,
      end_date: lease.end_date || '',
      monthly_rent: lease.monthly_rent,
      deposit: lease.deposit || 0,
      water_rate: lease.water_rate || 0,
      electricity_rate: lease.electricity_rate || 0,
      notes: lease.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleTerminate = (lease: Lease) => {
    setSelectedLease(lease);
    setIsTerminateOpen(true);
  };

  const handleDelete = (lease: Lease) => {
    setSelectedLease(lease);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<Lease>[] = [
    {
      accessorKey: 'room',
      header: '房间',
      cell: ({ row }) => {
        const room = row.original.room;
        return room ? `${room.apartment?.name || ''} - ${room.room_number}` : '-';
      },
    },
    {
      accessorKey: 'tenant',
      header: '租客',
      cell: ({ row }) => row.original.tenant?.name || '-',
    },
    {
      accessorKey: 'start_date',
      header: '开始日期',
    },
    {
      accessorKey: 'end_date',
      header: '结束日期',
      cell: ({ row }) => row.original.end_date || '长期',
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      cell: ({ row }) => `¥${row.original.monthly_rent.toLocaleString()}`,
    },
    {
      accessorKey: 'is_active',
      header: '状态',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? '生效中' : '已终止'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const lease = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(lease)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              {lease.is_active && (
                <DropdownMenuItem onClick={() => handleTerminate(lease)}>
                  <Ban className="mr-2 h-4 w-4" />
                  终止租约
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(lease)}
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
          <h1 className="text-3xl font-bold">租约管理</h1>
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
              新增租约
            </Button>
          </div>
        </div>

        {leasesLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={leases || []} />
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增租约</DialogTitle>
            <DialogDescription>创建新的租约</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>选择公寓</Label>
                <Select
                  value={selectedApartmentId?.toString() || ''}
                  onValueChange={(value) => setSelectedApartmentId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择公寓" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments?.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id.toString()}>
                        {apt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_id">选择房间 *</Label>
                <Select
                  value={createForm.watch('room_id')?.toString() || ''}
                  onValueChange={(value) =>
                    createForm.setValue('room_id', Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择房间" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms
                      ?.filter((r) => r.status === 'available')
                      .map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.room_number} - ¥{room.monthly_rent}/月
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.room_id && (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.room_id.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant_id">选择租客 *</Label>
              <Select
                value={createForm.watch('tenant_id')?.toString() || ''}
                onValueChange={(value) =>
                  createForm.setValue('tenant_id', Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择租客" />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name} - {tenant.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.formState.errors.tenant_id && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.tenant_id.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">开始日期 *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...createForm.register('start_date')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">结束日期</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...createForm.register('end_date')}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_rent">月租 (元) *</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  step="0.01"
                  {...createForm.register('monthly_rent', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">押金 (元)</Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  {...createForm.register('deposit', { valueAsNumber: true })}
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
            <DialogTitle>编辑租约</DialogTitle>
            <DialogDescription>修改租约信息</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateMutation.mutate({ id: selectedLease!.id, data })
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>房间</Label>
                <Input
                  value={
                    selectedLease?.room
                      ? `${selectedLease.room.apartment?.name || ''} - ${selectedLease.room.room_number}`
                      : ''
                  }
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>租客</Label>
                <Input value={selectedLease?.tenant?.name || ''} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start_date">开始日期 *</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  {...editForm.register('start_date')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end_date">结束日期</Label>
                <Input
                  id="edit-end_date"
                  type="date"
                  {...editForm.register('end_date')}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-monthly_rent">月租 (元) *</Label>
                <Input
                  id="edit-monthly_rent"
                  type="number"
                  step="0.01"
                  {...editForm.register('monthly_rent', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deposit">押金 (元)</Label>
                <Input
                  id="edit-deposit"
                  type="number"
                  step="0.01"
                  {...editForm.register('deposit', { valueAsNumber: true })}
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

      {/* Terminate Alert Dialog */}
      <AlertDialog open={isTerminateOpen} onOpenChange={setIsTerminateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认终止租约</AlertDialogTitle>
            <AlertDialogDescription>
              确定要终止此租约吗？终止后房间将变为空置状态。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => terminateMutation.mutate(selectedLease!.id)}
            >
              {terminateMutation.isPending ? '处理中...' : '确认终止'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此租约吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedLease!.id)}
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
