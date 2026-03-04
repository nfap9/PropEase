'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { apartmentsApi, roomsApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuth } from '@/lib/auth/context';
import { Room, RoomStatus } from '@/types';
import {
  ArrowLeft,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Home,
  Users,
  Wrench,
  FileText,
  Receipt,
  Zap,
  Loader2,
  Layers,
  Check,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  CheckCircle,
  X,
  Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ROOM_STATUS_CONFIG } from '@/lib/status-config';
import { UtilityConfigDialog } from './components/UtilityConfigDialog';

const roomSchema = z.object({
  room_number: z.string().min(1, '请输入房间号'),
  layout: z.string().optional(),
  area: z.number().min(0, '面积不能为负').optional(),
  monthly_rent: z.number().min(0, '租金不能为负'),
  status: z.enum(['available', 'occupied', 'maintenance']),
  notes: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

// 批量创建的配置schema
const roomBatchConfigSchema = z
  .object({
    floors: z.string().min(1, '请输入楼层'), // 支持多楼层，如 "1,2,3" 或 "1-5"
    start_number: z.number().min(1, '起始号最小为1').max(99, '起始号最大为99'),
    end_number: z.number().min(1, '结束号最小为1').max(99, '结束号最大为99'),
    layout: z.string().optional(),
    monthly_rent: z.number().min(0, '租金不能为负'),
    area: z.number().min(0, '面积不能为负').optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.end_number >= data.start_number, {
    message: '结束号必须大于等于起始号',
    path: ['end_number'],
  });

type RoomBatchConfigData = z.infer<typeof roomBatchConfigSchema>;

// 批量编辑房间的 schema
const batchEditSchema = z.object({
  layout: z.string().optional(),
  area: z.number().min(0, '面积不能为负').optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
});

type BatchEditFormData = z.infer<typeof batchEditSchema>;

// 状态边框颜色映射
const STATUS_BORDER_COLORS: Record<RoomStatus, string> = {
  available: 'border-green-500',
  occupied: 'border-blue-500',
  maintenance: 'border-orange-500',
};

// 从房间号提取楼层（假设格式为 {楼层}{房间序号:02d}，如 101、305）
const extractFloor = (roomNumber: string): number => {
  if (roomNumber.length <= 2) return 1;
  return parseInt(roomNumber.slice(0, -2), 10) || 1;
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

export default function ApartmentDetailPage({ params }: { params: { id: string } }) {
  const apartmentId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [isEditApartmentOpen, setIsEditApartmentOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isBatchCreateRoomOpen, setIsBatchCreateRoomOpen] = useState(false);
  const [batchStep, setBatchStep] = useState<'config' | 'confirm'>('config');
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isDeleteRoomOpen, setIsDeleteRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  // 批量操作状态
  const [isBatchEditMode, setIsBatchEditMode] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set());
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isUtilityConfigOpen, setIsUtilityConfigOpen] = useState(false);

  // 获取公寓信息
  const { data: apartment, isLoading: apartmentLoading } = useQuery({
    queryKey: ['apartment', orgId, apartmentId],
    queryFn: () => apartmentsApi.get(orgId!, apartmentId),
    enabled: !!orgId,
  });

  // 获取该公寓的房间列表
  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', orgId, apartmentId],
    queryFn: () => roomsApi.list(orgId!, apartmentId),
    enabled: !!orgId,
  });

  // 公寓编辑表单
  const apartmentForm = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, '请输入公寓名称'),
        address: z.string().min(1, '请输入公寓地址'),
        description: z.string().optional(),
      })
    ),
    defaultValues: {
      name: '',
      address: '',
      description: '',
    },
  });

  // 当公寓数据加载完成后，设置表单默认值
  useState(() => {
    if (apartment) {
      apartmentForm.reset({
        name: apartment.name,
        address: apartment.address ?? '',
        description: apartment.description ?? '',
      });
    }
  });

  // 房间创建表单
  const createRoomForm = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      room_number: '',
      layout: '',
      area: 0,
      monthly_rent: 0,
      status: 'available',
      notes: '',
    },
  });

  // 批量创建房间表单
  const batchCreateRoomForm = useForm<RoomBatchConfigData>({
    resolver: zodResolver(roomBatchConfigSchema),
    defaultValues: {
      floors: '1',
      start_number: 1,
      end_number: 10,
      layout: '',
      monthly_rent: 0,
      area: 0,
      notes: '',
    },
  });

  // 解析楼层字符串，支持 "1,2,3" 或 "1-5" 格式
  const parseFloors = (floorsStr: string): number[] => {
    const floors: Set<number> = new Set();
    const parts = floorsStr.split(',').map((s) => s.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map((s) => parseInt(s.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            floors.add(i);
          }
        }
      } else {
        const floor = parseInt(part, 10);
        if (!isNaN(floor)) {
          floors.add(floor);
        }
      }
    }
    return Array.from(floors).sort((a, b) => a - b);
  };

  // 根据配置生成房间列表（依赖表单字段以触发重新计算）
  const batchFloors = batchCreateRoomForm.watch('floors');
  const batchStartNumber = batchCreateRoomForm.watch('start_number');
  const batchEndNumber = batchCreateRoomForm.watch('end_number');
  const generatedRooms = useMemo(() => {
    const floors = parseFloors(batchFloors || '1');
    const startNum = batchStartNumber || 1;
    const endNum = batchEndNumber || 10;

    const rooms: { floor: number; rooms: string[] }[] = [];
    for (const floor of floors) {
      const floorRooms: string[] = [];
      for (let num = startNum; num <= endNum; num++) {
        floorRooms.push(`${floor}${String(num).padStart(2, '0')}`);
      }
      rooms.push({ floor, rooms: floorRooms });
    }
    return rooms;
  }, [batchFloors, batchStartNumber, batchEndNumber]);

  // 初始化选中房间（全部选中）
  const initializeSelectedRooms = useCallback(() => {
    const allRooms = generatedRooms.flatMap((f) => f.rooms);
    setSelectedRooms(new Set(allRooms));
  }, [generatedRooms]);

  // 切换房间选中状态
  const toggleRoom = (roomNumber: string) => {
    setSelectedRooms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roomNumber)) {
        newSet.delete(roomNumber);
      } else {
        newSet.add(roomNumber);
      }
      return newSet;
    });
  };

  // 切换整层楼
  const toggleFloor = (floorRooms: string[], select: boolean) => {
    setSelectedRooms((prev) => {
      const newSet = new Set(prev);
      if (select) {
        floorRooms.forEach((r) => newSet.add(r));
      } else {
        floorRooms.forEach((r) => newSet.delete(r));
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleAll = (select: boolean) => {
    if (select) {
      const allRooms = generatedRooms.flatMap((f) => f.rooms);
      setSelectedRooms(new Set(allRooms));
    } else {
      setSelectedRooms(new Set());
    }
  };

  // 房间编辑表单
  const editRoomForm = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  // 批量编辑表单
  const batchEditForm = useForm<BatchEditFormData>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      layout: '',
      area: undefined,
      status: undefined,
    },
  });

  // 更新公寓
  const updateApartmentMutation = useMutation({
    mutationFn: (data: { name: string; address: string; description?: string }) =>
      apartmentsApi.update(orgId!, apartmentId, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment', orgId, apartmentId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsEditApartmentOpen(false);
      toast.success('公寓信息更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  // 创建房间
  const createRoomMutation = useMutation({
    mutationFn: (data: RoomFormData) =>
      roomsApi.create(orgId!, apartmentId, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId, apartmentId] });
      setIsCreateRoomOpen(false);
      createRoomForm.reset();
      toast.success('房间创建成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '创建失败，请重试')),
  });

  // 批量创建房间
  const batchCreateRoomMutation = useMutation({
    mutationFn: (roomNumbers: string[]) => {
      const config = batchCreateRoomForm.getValues();
      return roomsApi.batchCreate(orgId!, apartmentId, {
        room_numbers: roomNumbers,
        layout: config.layout || undefined,
        monthly_rent: config.monthly_rent,
        area: config.area || undefined,
        notes: config.notes || undefined,
      });
    },
    onSuccess: (rooms) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId, apartmentId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      setIsBatchCreateRoomOpen(false);
      setBatchStep('config');
      batchCreateRoomForm.reset();
      setSelectedRooms(new Set());
      toast.success(`成功创建 ${rooms.length} 个房间`);
    },
    onError: (error) => toast.error(getErrorMessage(error, '批量创建失败，请重试')),
  });

  // 更新房间
  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoomFormData }) =>
      roomsApi.update(orgId!, id, filterEmptyStrings({ ...data, apartment_id: apartmentId })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId, apartmentId] });
      setIsEditRoomOpen(false);
      setSelectedRoom(null);
      toast.success('房间信息更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '更新失败，请重试')),
  });

  // 删除房间
  const deleteRoomMutation = useMutation({
    mutationFn: (id: string) => roomsApi.delete(orgId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId, apartmentId] });
      setIsDeleteRoomOpen(false);
      setSelectedRoom(null);
      toast.success('房间删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '删除失败，请重试')),
  });

  // 批量更新房间
  const batchUpdateMutation = useMutation({
    mutationFn: async (data: BatchEditFormData) => {
      const updates = Array.from(selectedRoomIds).map((id) => {
        const updateData: Partial<Room> = {};
        if (data.layout !== undefined && data.layout !== '') {
          updateData.layout = data.layout;
        }
        if (data.area !== undefined) {
          updateData.area = data.area;
        }
        if (data.status !== undefined) {
          updateData.status = data.status;
        }
        return roomsApi.update(orgId!, id, updateData);
      });
      return Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId, apartmentId] });
      setIsBatchEditOpen(false);
      setIsBatchEditMode(false);
      setSelectedRoomIds(new Set());
      batchEditForm.reset();
      toast.success('批量更新成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '批量更新失败，请重试')),
  });

  // 批量删除房间
  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      const deletes = Array.from(selectedRoomIds).map((id) => roomsApi.delete(orgId!, id));
      return Promise.all(deletes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId, apartmentId] });
      setIsBatchEditMode(false);
      setSelectedRoomIds(new Set());
      toast.success('批量删除成功');
    },
    onError: (error) => toast.error(getErrorMessage(error, '批量删除失败，请重试')),
  });

  // 切换房间选中状态（批量模式）
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  // 全选/取消全选当前楼层
  const toggleFloorSelection = (floorRooms: Room[], select: boolean) => {
    setSelectedRoomIds((prev) => {
      const newSet = new Set(prev);
      if (select) {
        floorRooms.forEach((r) => newSet.add(r.id));
      } else {
        floorRooms.forEach((r) => newSet.delete(r.id));
      }
      return newSet;
    });
  };

  // 全选/取消全选所有房间
  const toggleAllRoomSelection = (select: boolean) => {
    if (select && rooms) {
      setSelectedRoomIds(new Set(rooms.map((r) => r.id)));
    } else {
      setSelectedRoomIds(new Set());
    }
  };

  // 退出批量模式
  const exitBatchMode = () => {
    setIsBatchEditMode(false);
    setSelectedRoomIds(new Set());
  };

  const handleEditApartment = () => {
    if (apartment) {
      apartmentForm.reset({
        name: apartment.name,
        address: apartment.address ?? '',
        description: apartment.description ?? '',
      });
      setIsEditApartmentOpen(true);
    }
  };

  const handleDeleteRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteRoomOpen(true);
  };

  // 计算统计数据
  const stats = {
    total: rooms?.length || 0,
    available: rooms?.filter((r) => r.status === 'available').length || 0,
    occupied: rooms?.filter((r) => r.status === 'occupied').length || 0,
    maintenance: rooms?.filter((r) => r.status === 'maintenance').length || 0,
  };

  // 按楼层分组房间
  const roomsByFloor = useMemo(() => {
    if (!rooms) return {};
    const grouped: Record<number, Room[]> = {};
    for (const room of rooms) {
      const floor = extractFloor(room.room_number);
      if (!grouped[floor]) {
        grouped[floor] = [];
      }
      grouped[floor].push(room);
    }
    // 对每层楼内的房间按房间号排序
    for (const floor of Object.keys(grouped)) {
      grouped[Number(floor)].sort((a, b) => a.room_number.localeCompare(b.room_number));
    }
    return grouped;
  }, [rooms]);

  // 获取排序后的楼层列表
  const sortedFloors = useMemo(() => {
    return Object.keys(roomsByFloor)
      .map(Number)
      .sort((a, b) => a - b);
  }, [roomsByFloor]);

  // 房间卡片点击处理
  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    editRoomForm.reset({
      room_number: room.room_number,
      layout: room.layout || '',
      area: room.area || 0,
      monthly_rent: room.monthly_rent,
      status: room.status,
      notes: room.notes || '',
    });
    setIsEditRoomOpen(true);
  };

  if (authLoading || apartmentLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (!apartment) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">公寓不存在</h2>
          <Button onClick={() => router.push('/apartments')}>返回公寓列表</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <PermissionPageGuard>
      <MainLayout>
        <div className="space-y-6">
          {/* 返回按钮和标题 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/apartments')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{apartment.name}</h1>
                <p className="text-muted-foreground">{apartment.address}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleEditApartment}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </Button>
          </div>

          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总房间数</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已出租</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.occupied}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">空置</CardTitle>
                <Home className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">维修中</CardTitle>
                <Wrench className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.maintenance}</div>
              </CardContent>
            </Card>
          </div>

          {/* 快捷操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
              <CardDescription>快速跳转到相关功能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link href={`/leases?apartment=${apartmentId}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    查看租约
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/bills?apartment=${apartmentId}`}>
                    <Receipt className="mr-2 h-4 w-4" />
                    查看账单
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/utilities?apartment=${apartmentId}`}>
                    <Zap className="mr-2 h-4 w-4" />
                    水电录入
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => setIsUtilityConfigOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  费用配置
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 房间列表 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>房间列表</CardTitle>
                <CardDescription>管理该公寓的所有房间</CardDescription>
              </div>
              <div className="flex gap-2">
                {isBatchEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllRoomSelection(true)}
                    >
                      全选
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAllRoomSelection(false)}
                    >
                      取消全选
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedRoomIds.size === 0}
                      onClick={() => setIsBatchEditOpen(true)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      批量编辑 ({selectedRoomIds.size})
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedRoomIds.size === 0}
                      onClick={() => {
                        if (confirm(`确定要删除选中的 ${selectedRoomIds.size} 个房间吗？`)) {
                          batchDeleteMutation.mutate();
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除 ({selectedRoomIds.size})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={exitBatchMode}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsBatchEditMode(true)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      批量操作
                    </Button>
                    <Button variant="outline" onClick={() => setIsBatchCreateRoomOpen(true)}>
                      <Layers className="mr-2 h-4 w-4" />
                      批量添加
                    </Button>
                    <Button onClick={() => setIsCreateRoomOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      新增房间
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {roomsLoading ? (
                <Skeleton className="h-64" />
              ) : rooms && rooms.length > 0 ? (
                <>
                  {/* 状态图例 */}
                  <div className="mb-4 flex items-center gap-2">
                    {(Object.keys(ROOM_STATUS_CONFIG) as RoomStatus[]).map((status) => (
                      <Badge
                        key={status}
                        variant={ROOM_STATUS_CONFIG[status].variant}
                        className="text-xs"
                      >
                        {ROOM_STATUS_CONFIG[status].label}
                      </Badge>
                    ))}
                  </div>
                  {/* 楼层分组 */}
                  <div className="space-y-6">
                    {sortedFloors.map((floor) => {
                      const floorRooms = roomsByFloor[floor];
                      const selectedCount = floorRooms.filter((r) =>
                        selectedRoomIds.has(r.id)
                      ).length;
                      return (
                        <div key={floor} className="space-y-2">
                          <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            {isBatchEditMode && (
                              <button
                                onClick={() =>
                                  toggleFloorSelection(
                                    floorRooms,
                                    selectedCount !== floorRooms.length
                                  )
                                }
                                className="rounded p-0.5 hover:bg-accent"
                              >
                                <div
                                  className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                                    selectedCount === floorRooms.length
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : selectedCount > 0
                                        ? 'border-primary bg-primary/20'
                                        : 'border-muted-foreground'
                                  }`}
                                >
                                  {selectedCount === floorRooms.length && (
                                    <Check className="h-3 w-3" />
                                  )}
                                </div>
                              </button>
                            )}
                            <Layers className="h-4 w-4" />
                            {floor} 楼
                            <span className="text-xs">
                              ({floorRooms.length} 间
                              {isBatchEditMode && selectedCount > 0 && `，已选 ${selectedCount}`})
                            </span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {floorRooms.map((room) => {
                              const borderClass = STATUS_BORDER_COLORS[room.status];
                              const isSelected = selectedRoomIds.has(room.id);
                              return (
                                <div
                                  key={room.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    if (isBatchEditMode) {
                                      toggleRoomSelection(room.id);
                                    } else {
                                      handleRoomClick(room);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      if (isBatchEditMode) {
                                        toggleRoomSelection(room.id);
                                      } else {
                                        handleRoomClick(room);
                                      }
                                    }
                                  }}
                                  className={`group relative flex min-w-[72px] cursor-pointer flex-col items-center rounded-lg border-2 bg-card p-2 transition-all hover:bg-accent ${borderClass} ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                >
                                  {isBatchEditMode && (
                                    <div className="absolute -left-1 -top-1">
                                      <div
                                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                          isSelected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-muted-foreground bg-background'
                                        }`}
                                      >
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                    </div>
                                  )}
                                  <span className="font-mono text-sm font-medium">
                                    {room.room_number}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    ¥{room.monthly_rent.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-muted-foreground/70">
                                    {room.layout || '-'}
                                  </span>
                                  {/* 悬停时显示删除按钮（非批量模式） */}
                                  {!isBatchEditMode && (
                                    <div className="absolute -right-1 -top-1 opacity-0 transition-opacity group-hover:opacity-100">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteRoom(room);
                                        }}
                                        className="rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/80"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Home className="mb-4 h-12 w-12" />
                  <p>暂无房间，点击上方按钮添加</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 编辑公寓对话框 */}
        <Dialog open={isEditApartmentOpen} onOpenChange={setIsEditApartmentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑公寓</DialogTitle>
              <DialogDescription>修改公寓信息</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={apartmentForm.handleSubmit((data) => updateApartmentMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">公寓名称</Label>
                <Input id="name" {...apartmentForm.register('name')} />
                {apartmentForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {apartmentForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">地址</Label>
                <Input id="address" {...apartmentForm.register('address')} />
                {apartmentForm.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {apartmentForm.formState.errors.address.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Input id="description" {...apartmentForm.register('description')} />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditApartmentOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={updateApartmentMutation.isPending}>
                  {updateApartmentMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 新增房间对话框 */}
        <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>新增房间</DialogTitle>
              <DialogDescription>在 {apartment.name} 添加新房间</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={createRoomForm.handleSubmit((data) => createRoomMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room_number">房间号 *</Label>
                  <Input id="room_number" {...createRoomForm.register('room_number')} />
                  {createRoomForm.formState.errors.room_number && (
                    <p className="text-sm text-destructive">
                      {createRoomForm.formState.errors.room_number.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="layout">户型</Label>
                  <Select
                    value={createRoomForm.watch('layout') || ''}
                    onValueChange={(value) => createRoomForm.setValue('layout', value)}
                  >
                    <SelectTrigger className="min-w-[120px]">
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
                  <Label htmlFor="area">面积 (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.01"
                    {...createRoomForm.register('area', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_rent">月租 (元) *</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    step="0.01"
                    {...createRoomForm.register('monthly_rent', { valueAsNumber: true })}
                  />
                  {createRoomForm.formState.errors.monthly_rent && (
                    <p className="text-sm text-destructive">
                      {createRoomForm.formState.errors.monthly_rent.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select
                    value={createRoomForm.watch('status')}
                    onValueChange={(value: RoomStatus) => createRoomForm.setValue('status', value)}
                  >
                    <SelectTrigger className="min-w-[120px]">
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
                <Label htmlFor="notes">备注</Label>
                <Input id="notes" {...createRoomForm.register('notes')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateRoomOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createRoomMutation.isPending}>
                  {createRoomMutation.isPending ? '创建中...' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 批量创建房间对话框 */}
        <Dialog
          open={isBatchCreateRoomOpen}
          onOpenChange={(open) => {
            setIsBatchCreateRoomOpen(open);
            if (!open) {
              setBatchStep('config');
              setSelectedRooms(new Set());
            }
          }}
        >
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {batchStep === 'config' ? '批量添加房间 - 配置' : '批量添加房间 - 确认选择'}
              </DialogTitle>
              <DialogDescription>
                {batchStep === 'config'
                  ? '设置楼层和房间号范围，支持多楼层（如 1,2,3 或 1-5）'
                  : '点击房间号切换选中状态，只添加激活的房间'}
              </DialogDescription>
            </DialogHeader>

            {batchStep === 'config' ? (
              <form
                onSubmit={batchCreateRoomForm.handleSubmit(() => {
                  initializeSelectedRooms();
                  setBatchStep('confirm');
                })}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="floors">楼层</Label>
                    <Input
                      id="floors"
                      placeholder="如: 1,2,3 或 1-5"
                      {...batchCreateRoomForm.register('floors')}
                    />
                    {batchCreateRoomForm.formState.errors.floors && (
                      <p className="text-sm text-destructive">
                        {batchCreateRoomForm.formState.errors.floors.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_number">起始号</Label>
                    <Input
                      id="start_number"
                      type="number"
                      min="1"
                      max="99"
                      {...batchCreateRoomForm.register('start_number', { valueAsNumber: true })}
                    />
                    {batchCreateRoomForm.formState.errors.start_number && (
                      <p className="text-sm text-destructive">
                        {batchCreateRoomForm.formState.errors.start_number.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_number">结束号</Label>
                    <Input
                      id="end_number"
                      type="number"
                      min="1"
                      max="99"
                      {...batchCreateRoomForm.register('end_number', { valueAsNumber: true })}
                    />
                    {batchCreateRoomForm.formState.errors.end_number && (
                      <p className="text-sm text-destructive">
                        {batchCreateRoomForm.formState.errors.end_number.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 预览 */}
                <div className="rounded-md bg-muted p-3">
                  <p className="mb-2 text-sm text-muted-foreground">
                    将生成 {generatedRooms.reduce((sum, f) => sum + f.rooms.length, 0)} 个房间 （
                    {generatedRooms.length} 层 × {generatedRooms[0]?.rooms.length || 0} 间/层）
                  </p>
                  <div className="max-h-24 space-y-1 overflow-y-auto font-mono text-sm">
                    {generatedRooms.map(({ floor, rooms }) => (
                      <div key={floor}>
                        {floor}楼: {rooms[0]} - {rooms[rooms.length - 1]}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-layout">户型</Label>
                    <Select
                      value={batchCreateRoomForm.watch('layout') || ''}
                      onValueChange={(value) => batchCreateRoomForm.setValue('layout', value)}
                    >
                      <SelectTrigger className="min-w-[120px]">
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
                  <div className="space-y-2">
                    <Label htmlFor="batch-area">面积 (m²)</Label>
                    <Input
                      id="batch-area"
                      type="number"
                      step="0.01"
                      {...batchCreateRoomForm.register('area', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-monthly_rent">月租 (元) *</Label>
                    <Input
                      id="batch-monthly_rent"
                      type="number"
                      step="0.01"
                      {...batchCreateRoomForm.register('monthly_rent', { valueAsNumber: true })}
                    />
                    {batchCreateRoomForm.formState.errors.monthly_rent && (
                      <p className="text-sm text-destructive">
                        {batchCreateRoomForm.formState.errors.monthly_rent.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-notes">备注</Label>
                  <Input id="batch-notes" {...batchCreateRoomForm.register('notes')} />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBatchCreateRoomOpen(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit">
                    下一步
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <div className="space-y-4">
                {/* 操作栏 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                      全选
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                      取消全选
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    已选择 <span className="font-medium text-foreground">{selectedRooms.size}</span>{' '}
                    个房间
                  </p>
                </div>

                {/* 每层楼的房间展示 */}
                <div className="max-h-[400px] space-y-4 overflow-y-auto">
                  {generatedRooms.map(({ floor, rooms }) => {
                    const selectedCount = rooms.filter((r) => selectedRooms.has(r)).length;
                    const allSelected = selectedCount === rooms.length;
                    const someSelected = selectedCount > 0 && !allSelected;

                    return (
                      <div key={floor} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={allSelected ? 'default' : 'outline'}
                              size="sm"
                              className="h-7"
                              onClick={() => toggleFloor(rooms, !allSelected)}
                            >
                              {allSelected ? (
                                <Check className="mr-1 h-4 w-4" />
                              ) : someSelected ? (
                                <span className="mr-1 flex h-4 w-4 items-center justify-center text-xs">
                                  -
                                </span>
                              ) : (
                                <span className="mr-1 h-4 w-4" />
                              )}
                              {floor}楼
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              ({selectedCount}/{rooms.length})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleFloor(rooms, !allSelected)}
                          >
                            {allSelected ? '取消整层' : '选择整层'}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rooms.map((room) => {
                            const isSelected = selectedRooms.has(room);
                            return (
                              <button
                                key={room}
                                type="button"
                                onClick={() => toggleRoom(room)}
                                className={`rounded-md px-3 py-1.5 font-mono text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                              >
                                {room}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setBatchStep('config')}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    上一步
                  </Button>
                  <Button
                    type="button"
                    disabled={selectedRooms.size === 0 || batchCreateRoomMutation.isPending}
                    onClick={() => {
                      batchCreateRoomMutation.mutate(Array.from(selectedRooms));
                    }}
                  >
                    {batchCreateRoomMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        创建中...
                      </>
                    ) : (
                      <>确认添加 ({selectedRooms.size} 个房间)</>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 编辑房间对话框 */}
        <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>编辑房间</DialogTitle>
              <DialogDescription>修改房间信息</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editRoomForm.handleSubmit((data) =>
                updateRoomMutation.mutate({ id: selectedRoom!.id, data })
              )}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-room_number">房间号 *</Label>
                  <Input id="edit-room_number" {...editRoomForm.register('room_number')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-layout">户型</Label>
                  <Select
                    value={editRoomForm.watch('layout') || ''}
                    onValueChange={(value) => editRoomForm.setValue('layout', value)}
                  >
                    <SelectTrigger className="min-w-[120px]">
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
                    {...editRoomForm.register('area', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-monthly_rent">月租 (元) *</Label>
                  <Input
                    id="edit-monthly_rent"
                    type="number"
                    step="0.01"
                    {...editRoomForm.register('monthly_rent', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">状态</Label>
                  <Select
                    value={editRoomForm.watch('status')}
                    onValueChange={(value: RoomStatus) => editRoomForm.setValue('status', value)}
                  >
                    <SelectTrigger className="min-w-[120px]">
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
                <Label htmlFor="edit-notes">备注</Label>
                <Input id="edit-notes" {...editRoomForm.register('notes')} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditRoomOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={updateRoomMutation.isPending}>
                  {updateRoomMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 删除房间确认对话框 */}
        <AlertDialog open={isDeleteRoomOpen} onOpenChange={setIsDeleteRoomOpen}>
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
                onClick={() => deleteRoomMutation.mutate(selectedRoom!.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteRoomMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    删除中...
                  </>
                ) : (
                  '删除'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 批量编辑对话框 */}
        <Dialog open={isBatchEditOpen} onOpenChange={setIsBatchEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>批量编辑</DialogTitle>
              <DialogDescription>
                为选中的 {selectedRoomIds.size} 个房间设置属性（留空则不修改）
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={batchEditForm.handleSubmit((data) => batchUpdateMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="batch-edit-layout">户型</Label>
                <Select
                  value={batchEditForm.watch('layout') || '__none__'}
                  onValueChange={(value) =>
                    batchEditForm.setValue('layout', value === '__none__' ? undefined : value)
                  }
                >
                  <SelectTrigger className="min-w-[120px]">
                    <SelectValue placeholder="不修改" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">不修改</SelectItem>
                    {LAYOUT_OPTIONS.map((layout) => (
                      <SelectItem key={layout} value={layout}>
                        {layout}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-edit-area">面积 (m²)</Label>
                <Input
                  id="batch-edit-area"
                  type="number"
                  step="0.01"
                  placeholder="不修改"
                  value={batchEditForm.watch('area') ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      batchEditForm.setValue('area', undefined);
                    } else {
                      const num = parseFloat(value);
                      batchEditForm.setValue('area', isNaN(num) ? undefined : num);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-edit-status">状态</Label>
                <Select
                  value={batchEditForm.watch('status') || '__none__'}
                  onValueChange={(value) =>
                    batchEditForm.setValue(
                      'status',
                      value === '__none__' ? undefined : (value as RoomStatus)
                    )
                  }
                >
                  <SelectTrigger className="min-w-[120px]">
                    <SelectValue placeholder="不修改" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">不修改</SelectItem>
                    <SelectItem value="available">空置</SelectItem>
                    <SelectItem value="occupied">已租</SelectItem>
                    <SelectItem value="maintenance">维修中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBatchEditOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={batchUpdateMutation.isPending}>
                  {batchUpdateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 费用配置对话框 */}
        <UtilityConfigDialog
          open={isUtilityConfigOpen}
          onOpenChange={setIsUtilityConfigOpen}
          orgId={orgId!}
          apartmentId={apartmentId}
          apartmentName={apartment?.name || ''}
        />
      </MainLayout>
    </PermissionPageGuard>
  );
}
