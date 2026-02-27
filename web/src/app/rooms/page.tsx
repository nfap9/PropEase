'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/common/data-table';
import { TableActions, TableAction } from '@/components/common/table-actions';
import { LeaseFormDialog } from '@/components/common/lease-form-dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { roomsApi, apartmentsApi, leasesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { useAuth } from '@/lib/auth/context';
import { Room, RoomStatus } from '@/types';
import {
  Pencil,
  Trash2,
  Building2,
  Search,
  FileText,
  Ban,
  Wrench,
  CheckCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RoomStatsCards } from './components/room-stats-cards';
import { RoomFilters, RoomFiltersState } from './components/room-filters';

const roomSchema = z.object({
  room_number: z.string().min(1, '请输入房间号'),
  layout: z.string().optional(),
  area: z.number().min(0, '面积不能为负').optional(),
  monthly_rent: z.number().min(0, '租金不能为负'),
  status: z.enum(['available', 'occupied', 'maintenance']),
  notes: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

const STATUS_MAP: Record<RoomStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: '空置', variant: 'secondary' },
  occupied: { label: '已租', variant: 'default' },
  maintenance: { label: '维修中', variant: 'destructive' },
};

// 常用户型选项
const LAYOUT_OPTIONS = [
  '单间',
  '一室一厅',
  '两室一厅',
  '三室一厅',
  '三室两厅',
  '四室两厅',
  '复式',
  'Loft',
];

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  // 筛选状态
  const [filters, setFilters] = useState<RoomFiltersState>({
    apartmentId: null,
    status: null,
    rentMin: null,
    rentMax: null,
    areaMin: null,
    areaMax: null,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // 对话框状态
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaseOpen, setIsLeaseOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // 签约成功后清理选中状态
  const handleLeaseSuccess = () => {
    setSelectedRoom(null);
    setIsLeaseOpen(false);
  };

  // 获取公寓列表
  const { data: apartments, isLoading: apartmentsLoading } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  // 获取租约列表（用于判断房间是否有活跃租约）
  const { data: leases } = useQuery({
    queryKey: ['leases', orgId],
    queryFn: () => leasesApi.list(orgId!, true),
    enabled: !!orgId,
  });

  // 获取所有房间（跨公寓）
  const { data: allRooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['all-rooms', orgId, apartments],
    queryFn: async () => {
      if (!apartments || apartments.length === 0) return [];
      const apartmentIds = apartments.map((apt) => apt.id);
      const rooms = await roomsApi.listAll(orgId!, apartmentIds);
      // 映射公寓信息到房间
      const apartmentMap = new Map(apartments.map((apt) => [apt.id, apt]));
      return rooms.map((room) => ({
        ...room,
        apartment: apartmentMap.get(room.apartment_id),
      }));
    },
    enabled: !!orgId && !!apartments && apartments.length > 0,
  });

  // 客户端过滤
  const filteredRooms = useMemo(() => {
    if (!allRooms) return [];

    return allRooms.filter((room) => {
      // 公寓筛选
      if (filters.apartmentId && room.apartment_id !== filters.apartmentId) {
        return false;
      }
      // 状态筛选
      if (filters.status && room.status !== filters.status) {
        return false;
      }
      // 月租范围
      if (filters.rentMin !== null && room.monthly_rent < filters.rentMin) {
        return false;
      }
      if (filters.rentMax !== null && room.monthly_rent > filters.rentMax) {
        return false;
      }
      // 面积范围
      if (filters.areaMin !== null && (room.area === null || room.area < filters.areaMin)) {
        return false;
      }
      if (filters.areaMax !== null && (room.area === null || room.area > filters.areaMax)) {
        return false;
      }
      // 搜索
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchRoomNumber = room.room_number.toLowerCase().includes(query);
        const matchNotes = room.notes?.toLowerCase().includes(query) || false;
        if (!matchRoomNumber && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [allRooms, filters, searchQuery]);

  // 处理筛选变化
  const handleFilterChange = (key: keyof RoomFiltersState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 清除筛选
  const handleClearFilters = () => {
    setFilters({
      apartmentId: null,
      status: null,
      rentMin: null,
      rentMax: null,
      areaMin: null,
      areaMax: null,
    });
    setSearchQuery('');
  };

  const editForm = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoomFormData }) =>
      roomsApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsEditOpen(false);
      setSelectedRoom(null);
      toast.success('房间更新成功');
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roomsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsDeleteOpen(false);
      setSelectedRoom(null);
      toast.success('房间删除成功');
    },
    onError: () => {
      toast.error('删除失败，请重试');
    },
  });

  const terminateLeaseMutation = useMutation({
    mutationFn: (leaseId: number) => leasesApi.terminate(orgId!, leaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsTerminateOpen(false);
      setSelectedRoom(null);
      toast.success('退租成功');
    },
    onError: () => {
      toast.error('退租失败，请重试');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: RoomStatus }) =>
      roomsApi.update(orgId!, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      toast.success('状态更新成功');
    },
    onError: () => {
      toast.error('状态更新失败，请重试');
    },
  });

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    editForm.reset({
      room_number: room.room_number,
      layout: room.layout || '',
      area: room.area || 0,
      monthly_rent: room.monthly_rent,
      status: room.status,
      notes: room.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleDelete = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteOpen(true);
  };

  const handleLease = (room: Room) => {
    setSelectedRoom(room);
    setIsLeaseOpen(true);
  };

  const handleTerminate = (room: Room) => {
    setSelectedRoom(room);
    setIsTerminateOpen(true);
  };

  const handleStatusChange = (room: Room, status: RoomStatus) => {
    updateStatusMutation.mutate({ id: room.id, status });
  };

  // 获取房间的当前活跃租约
  const getActiveLease = (roomId: number) => {
    return leases?.find((lease) => lease.room_id === roomId && lease.is_active);
  };

  const columns: ColumnDef<Room>[] = [
    {
      accessorKey: 'room_number',
      header: '房间号',
      enableSorting: true,
    },
    {
      accessorKey: 'apartment_name',
      header: '所属公寓',
      enableSorting: true,
      cell: ({ row }) => {
        const apartment = row.original.apartment;
        return apartment ? (
          <Link
            href={`/apartments/${apartment.id}`}
            className="text-primary hover:underline"
          >
            {apartment.name}
          </Link>
        ) : (
          '-'
        );
      },
    },
    {
      accessorKey: 'layout',
      header: '户型',
      enableSorting: true,
      cell: ({ row }) => row.original.layout || '-',
    },
    {
      accessorKey: 'area',
      header: '面积',
      enableSorting: true,
      cell: ({ row }) => (row.original.area ? `${row.original.area} m²` : '-'),
    },
    {
      accessorKey: 'monthly_rent',
      header: '月租',
      enableSorting: true,
      cell: ({ row }) => `¥${row.original.monthly_rent.toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: '状态',
      enableSorting: true,
      cell: ({ row }) => {
        const status = STATUS_MAP[row.original.status];
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      accessorKey: 'notes',
      header: '备注',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.notes || '-'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const room = row.original;
        const isAvailable = room.status === 'available';
        const isOccupied = room.status === 'occupied';
        const isMaintenance = room.status === 'maintenance';

        const actions: TableAction[] = [
          {
            label: '编辑',
            icon: Pencil,
            onClick: () => handleEdit(room),
          },
          {
            label: '签约',
            icon: FileText,
            onClick: () => handleLease(room),
            show: isAvailable,
          },
          {
            label: '退租',
            icon: Ban,
            onClick: () => handleTerminate(room),
            show: isOccupied,
          },
          {
            label: '开始维修',
            icon: Wrench,
            onClick: () => handleStatusChange(room, 'maintenance'),
            show: isAvailable,
          },
          {
            label: '完成维修',
            icon: CheckCircle,
            onClick: () => handleStatusChange(room, 'available'),
            show: isMaintenance,
          },
          {
            label: '删除',
            icon: Trash2,
            onClick: () => handleDelete(room),
            variant: 'destructive',
          },
        ];
        return <TableActions actions={actions} maxInline={2} />;
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
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold">全部房间</h1>
          <p className="text-muted-foreground mt-1">
            查看和管理所有公寓的房间
          </p>
        </div>

        {/* 统计卡片 */}
        {allRooms && <RoomStatsCards rooms={allRooms} />}

        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索房间号或备注..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 筛选器 */}
        {apartments && apartments.length > 0 && (
          <RoomFilters
            apartments={apartments}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}

        {/* 结果统计 */}
        <div className="text-sm text-muted-foreground">
          显示 {filteredRooms.length} / {allRooms?.length || 0} 个房间
        </div>

        {/* 房间表格 */}
        {roomsLoading || apartmentsLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={filteredRooms} />
        )}
      </div>

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
              <div className="space-y-2">
                <Label htmlFor="edit-layout">户型</Label>
                <Select
                  value={editForm.watch('layout') || ''}
                  onValueChange={(value) => editForm.setValue('layout', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择户型" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUT_OPTIONS.map((layout) => (
                      <SelectItem key={layout} value={layout}>
                        {layout}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Lease Dialog */}
      <LeaseFormDialog
        orgId={orgId!}
        open={isLeaseOpen}
        onOpenChange={setIsLeaseOpen}
        room={selectedRoom}
        onSuccess={handleLeaseSuccess}
      />

      {/* Terminate Dialog */}
      <AlertDialog open={isTerminateOpen} onOpenChange={setIsTerminateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退租</AlertDialogTitle>
            <AlertDialogDescription>
              确定要为房间 &ldquo;{selectedRoom?.room_number}&rdquo; 办理退租吗？退租后房间将变为空置状态。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRoom) {
                  const activeLease = getActiveLease(selectedRoom.id);
                  if (activeLease) {
                    terminateLeaseMutation.mutate(activeLease.id);
                  }
                }
              }}
            >
              {terminateLeaseMutation.isPending ? '处理中...' : '确认退租'}
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
