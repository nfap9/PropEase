'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import { DataTable } from '@/components/common/data-table';
import { TableActions, TableAction } from '@/components/common/table-actions';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { apartmentsApi, roomsApi, utilitiesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { useAuth } from '@/lib/auth/context';
import { UtilityReading } from '@/types';
import { Plus, Pencil, Zap, Droplets, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const utilitySchema = z.object({
  room_id: z.number().min(1, '请选择房间'),
  period_year: z.number().min(2020).max(2100),
  period_month: z.number().min(1).max(12),
  reading_date: z.string().min(1, '请选择读数日期'),
  water_reading: z.number().min(0).optional(),
  electricity_reading: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type UtilityFormData = z.infer<typeof utilitySchema>;

export default function UtilitiesPage() {
  const queryClient = useQueryClient();
  const { organization, isLoading: authLoading } = useAuth();
  const orgId = organization?.id;

  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUtility, setSelectedUtility] = useState<UtilityReading | null>(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId!),
    enabled: !!orgId,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(orgId!, selectedApartmentId!),
    enabled: !!orgId && selectedApartmentId !== null,
  });

  const { data: utilities, isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities', orgId],
    queryFn: () => utilitiesApi.list(orgId!),
    enabled: !!orgId,
  });

  const createForm = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
    defaultValues: {
      room_id: 0,
      period_year: currentYear,
      period_month: currentMonth,
      reading_date: today.toISOString().split('T')[0],
      water_reading: 0,
      electricity_reading: 0,
      notes: '',
    },
  });

  const editForm = useForm<UtilityFormData>({
    resolver: zodResolver(utilitySchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: UtilityFormData) => utilitiesApi.create(orgId!, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      setIsCreateOpen(false);
      createForm.reset();
      toast.success('水电读数录入成功');
    },
    onError: () => {
      toast.error('录入失败，请重试');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UtilityFormData }) =>
      utilitiesApi.update(orgId!, id, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities', orgId] });
      setIsEditOpen(false);
      setSelectedUtility(null);
      toast.success('水电读数更新成功');
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const occupiedRooms = rooms?.filter((r) => r.status === 'occupied');

  const handleEdit = (utility: UtilityReading) => {
    setSelectedUtility(utility);
    editForm.reset({
      room_id: utility.room_id,
      period_year: utility.period_year,
      period_month: utility.period_month,
      reading_date: utility.reading_date,
      water_reading: utility.water_reading || 0,
      electricity_reading: utility.electricity_reading || 0,
      notes: utility.notes || '',
    });
    setIsEditOpen(true);
  };

  const columns: ColumnDef<UtilityReading>[] = [
    {
      accessorKey: 'period_month',
      header: '月份',
      cell: ({ row }) => `${row.original.period_year}年${row.original.period_month}月`,
    },
    {
      accessorKey: 'room',
      header: '房间',
      cell: ({ row }) => {
        const room = row.original.room;
        return room ? `${room.apartment?.name || ''} - ${room.room_number}` : '-';
      },
    },
    {
      accessorKey: 'reading_date',
      header: '记录日期',
      cell: ({ row }) => row.original.reading_date,
    },
    {
      accessorKey: 'water_reading',
      header: '水表读数',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          {row.original.water_reading !== null && row.original.water_reading !== undefined
            ? row.original.water_reading
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'electricity_reading',
      header: '电表读数',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          {row.original.electricity_reading !== null &&
          row.original.electricity_reading !== undefined
            ? row.original.electricity_reading
            : '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const utility = row.original;
        const actions: TableAction[] = [
          {
            label: '编辑',
            icon: Pencil,
            onClick: () => handleEdit(utility),
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
          <h1 className="text-3xl font-bold">水电录入</h1>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            录入读数
          </Button>
        </div>

        {utilitiesLoading ? (
          <Skeleton className="h-96" />
        ) : (
          <DataTable columns={columns} data={utilities || []} />
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>录入水电读数</DialogTitle>
            <DialogDescription>录入房间的水电表读数</DialogDescription>
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
                    {occupiedRooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_year">年份</Label>
                <Select
                  value={createForm.watch('period_year')?.toString() || currentYear.toString()}
                  onValueChange={(value) =>
                    createForm.setValue('period_year', Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period_month">月份</Label>
                <Select
                  value={createForm.watch('period_month')?.toString() || currentMonth.toString()}
                  onValueChange={(value) =>
                    createForm.setValue('period_month', Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {month}月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reading_date">读数日期 *</Label>
                <Input
                  id="reading_date"
                  type="date"
                  {...createForm.register('reading_date')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="water_reading">
                  <span className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    水表读数 (m³)
                  </span>
                </Label>
                <Input
                  id="water_reading"
                  type="number"
                  step="0.01"
                  {...createForm.register('water_reading', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="electricity_reading">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    电表读数 (kWh)
                  </span>
                </Label>
                <Input
                  id="electricity_reading"
                  type="number"
                  step="0.01"
                  {...createForm.register('electricity_reading', { valueAsNumber: true })}
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
                {createMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑水电读数</DialogTitle>
            <DialogDescription>修改水电表读数</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateMutation.mutate({ id: selectedUtility!.id, data })
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>年份</Label>
                <Input value={selectedUtility?.period_year} disabled />
              </div>
              <div className="space-y-2">
                <Label>月份</Label>
                <Input value={`${selectedUtility?.period_month}月`} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reading_date">读数日期</Label>
                <Input
                  id="edit-reading_date"
                  type="date"
                  {...editForm.register('reading_date')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>房间</Label>
              <Input
                value={
                  selectedUtility
                    ? selectedUtility.room
                      ? `${selectedUtility.room.apartment?.name || ''} - ${selectedUtility.room.room_number}`
                      : ''
                    : ''
                }
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-water_reading">
                  <span className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    水表读数 (m³)
                  </span>
                </Label>
                <Input
                  id="edit-water_reading"
                  type="number"
                  step="0.01"
                  {...editForm.register('water_reading', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-electricity_reading">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    电表读数 (kWh)
                  </span>
                </Label>
                <Input
                  id="edit-electricity_reading"
                  type="number"
                  step="0.01"
                  {...editForm.register('electricity_reading', { valueAsNumber: true })}
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
    </MainLayout>
  );
}
