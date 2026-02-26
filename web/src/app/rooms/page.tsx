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
import { roomsApi, apartmentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { Room, RoomStatus } from '@/types';
import { Plus, MoreHorizontal, Pencil, Trash2, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const roomSchema = z.object({
  room_number: z.string().min(1, '请输入房间号'),
  area: z.number().min(0, '面积不能为负').optional(),
  monthly_rent: z.number().min(0, '租金不能为负'),
  status: z.enum(['available', 'occupied', 'maintenance']),
  apartment_id: z.number().min(1, '请选择公寓'),
  notes: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

const STATUS_MAP: Record<RoomStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: '空置', variant: 'secondary' },
  occupied: { label: '已租', variant: 'default' },
  maintenance: { label: '维修中', variant: 'destructive' },
};

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(orgId!, selectedApartmentId || undefined),
    enabled: !!orgId,
  });

  const createForm = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      room_number: '',
      area: 0,
      monthly_rent: 0,
      status: 'available',
      apartment_id: 0,
      notes: '',
    },
  });

  const editForm = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: RoomFormData) => roomsApi.create(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoomFormData }) =>
      roomsApi.update(orgId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      setIsEditOpen(false);
      setSelectedRoom(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roomsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      setIsDeleteOpen(false);
      setSelectedRoom(null);
    },
  });

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    editForm.reset({
      room_number: room.room_number,
      area: room.area || 0,
      monthly_rent: room.monthly_rent,
      status: room.status,
      apartment_id: room.apartment_id,
      notes: room.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteOpen(true);
  };

  const columns: ColumnDef<Room>[] = [
    {
      accessorKey: 'room_number',
      header: '房间号',
    },
    {
      accessorKey: 'apartment_name',
      header: '所属公寓',
      cell: ({ row }) => row.original.apartment?.name || '-',
    },
    {
      accessorKey: 'area',
      header: '面积',
      cell: ({ row }) => (row.original.area ? `${row.original.area} m²` : '-'),
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      cell: ({ row }) => `¥${row.original.monthly_rent.toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = STATUS_MAP[row.original.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const room = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(room)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(room)}
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
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">请先创建或加入组织</h2>
          <p className="text-muted-foreground">在顶部导航栏选择或创建一个组织开始使用</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">房间管理</h1>
          <div className="flex items-center gap-4">
            <Select
              value={selectedApartmentId?.toString() || 'all'}
              onValueChange={(value) =>
                setSelectedApartmentId(value === 'all' ? null : Number(value))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="全部公寓" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部公寓</SelectItem>
                {apartments?.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id.toString()}>
                    {apt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增房间
            </Button>
          </div>
        </div>

        {roomsLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={rooms || []} />
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增房间</DialogTitle>
            <DialogDescription>填写房间信息</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="apartment_id">所属公寓</Label>
              <Select
                value={createForm.watch('apartment_id')?.toString() || ''}
                onValueChange={(value) =>
                  createForm.setValue('apartment_id', Number(value))
                }
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
              {createForm.formState.errors.apartment_id && (
                <p className="text-sm text-destructive">
                  {createForm.formState.errors.apartment_id.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room_number">房间号</Label>
                <Input id="room_number" {...createForm.register('room_number')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="area">面积 (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  {...createForm.register('area', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={createForm.watch('status')}
                  onValueChange={(value: RoomStatus) =>
                    createForm.setValue('status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">空置</SelectItem>
                    <SelectItem value="occupied">已租</SelectItem>
                    <SelectItem value="maintenance">维修中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_rent">月租 (元)</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  step="0.01"
                  {...createForm.register('monthly_rent', { valueAsNumber: true })}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑房间</DialogTitle>
            <DialogDescription>修改房间信息</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateMutation.mutate({ id: selectedRoom!.id, data })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>所属公寓</Label>
              <Input value={selectedRoom?.apartment?.name || ''} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-room_number">房间号</Label>
                <Input id="edit-room_number" {...editForm.register('room_number')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-area">面积 (m²)</Label>
                <Input
                  id="edit-area"
                  type="number"
                  step="0.01"
                  {...editForm.register('area', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">状态</Label>
                <Select
                  value={editForm.watch('status')}
                  onValueChange={(value: RoomStatus) =>
                    editForm.setValue('status', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">空置</SelectItem>
                    <SelectItem value="occupied">已租</SelectItem>
                    <SelectItem value="maintenance">维修中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-monthly_rent">月租 (元)</Label>
              <Input
                id="edit-monthly_rent"
                type="number"
                step="0.01"
                {...editForm.register('monthly_rent', { valueAsNumber: true })}
              />
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
              确定要删除房间 &ldquo;{selectedRoom?.room_number}&rdquo; 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(selectedRoom!.id)}
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
