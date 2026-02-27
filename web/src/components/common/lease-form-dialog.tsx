'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { TenantSelect } from '@/components/common/tenant-select';
import { leasesApi, apartmentsApi, roomsApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { Room, Apartment } from '@/types';

const leaseSchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  tenant_id: z.string().min(1, '请选择租客'),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().optional(),
  monthly_rent: z.number().min(0, '月租不能为负'),
  deposit: z.number().min(0, '押金不能为负').optional(),
  water_rate: z.number().min(0).optional(),
  electricity_rate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type LeaseFormData = z.infer<typeof leaseSchema>;

export interface LeaseFormDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 指定房间时使用（房间列表页），房间信息只读 */
  room?: Room | null;
  /** 成功回调 */
  onSuccess?: () => void;
}

export function LeaseFormDialog({
  orgId,
  open,
  onOpenChange,
  room,
  onSuccess,
}: LeaseFormDialogProps) {
  const queryClient = useQueryClient();
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

  const isRoomSpecified = !!room;

  const form = useForm<LeaseFormData>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      room_id: '',
      tenant_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      monthly_rent: 0,
      deposit: 0,
      water_rate: 0,
      electricity_rate: 0,
      notes: '',
    },
  });

  // 获取公寓列表（需要选择房间时）
  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
    enabled: !!orgId && !isRoomSpecified,
  });

  // 获取房间列表（需要选择房间时）
  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(orgId, selectedApartmentId!),
    enabled: !!orgId && !isRoomSpecified && selectedApartmentId !== null,
  });

  // 当指定房间时，初始化表单
  useEffect(() => {
    if (room && open) {
      form.reset({
        room_id: room.id,
        tenant_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_rent: room.monthly_rent,
        deposit: 0,
        water_rate: 0,
        electricity_rate: 0,
        notes: '',
      });
    } else if (!isRoomSpecified && open) {
      // 需要选择房间的场景，重置表单
      form.reset({
        room_id: '',
        tenant_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_rent: 0,
        deposit: 0,
        water_rate: 0,
        electricity_rate: 0,
        notes: '',
      });
      setSelectedApartmentId(null);
    }
  }, [room, open, isRoomSpecified, form]);

  const createMutation = useMutation({
    mutationFn: (data: LeaseFormData) => leasesApi.create(orgId, filterEmptyStrings(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      onOpenChange(false);
      form.reset();
      toast.success('签约成功');
      onSuccess?.();
    },
    onError: () => {
      toast.error('签约失败，请重试');
    },
  });

  const handleSubmit = (data: LeaseFormData) => {
    createMutation.mutate(data);
  };

  const getDialogTitle = () => {
    if (isRoomSpecified) {
      return '签约';
    }
    return '新增租约';
  };

  const getDialogDescription = () => {
    if (isRoomSpecified && room) {
      return `为房间 ${room.room_number} 创建租约`;
    }
    return '创建新的租约';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* 房间选择区域 */}
          {isRoomSpecified ? (
            <div className="space-y-2">
              <Label>房间</Label>
              <Input
                value={
                  room
                    ? `${room.apartment?.name || ''} - ${room.room_number}`
                    : ''
                }
                disabled
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>选择公寓</Label>
                <Select
                  value={selectedApartmentId || ''}
                  onValueChange={(value) => setSelectedApartmentId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择公寓" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments?.map((apt: Apartment) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room_id">选择房间 *</Label>
                <Select
                  value={form.watch('room_id') || ''}
                  onValueChange={(value) => form.setValue('room_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择房间" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms
                      ?.filter((r) => r.status === 'available')
                      .map((r: Room) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.room_number} - ¥{r.monthly_rent}/月
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.room_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.room_id.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 租客选择 */}
          <div className="space-y-2">
            <Label htmlFor="tenant_id">选择租客 *</Label>
            <TenantSelect
              orgId={orgId}
              value={form.watch('tenant_id')}
              onValueChange={(value) => form.setValue('tenant_id', value)}
              error={form.formState.errors.tenant_id?.message}
            />
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">开始日期 *</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register('start_date')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">结束日期</Label>
              <Input
                id="end_date"
                type="date"
                {...form.register('end_date')}
              />
            </div>
          </div>

          {/* 月租和押金 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_rent">月租 (元) *</Label>
              <Input
                id="monthly_rent"
                type="number"
                step="0.01"
                {...form.register('monthly_rent', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">押金 (元)</Label>
              <Input
                id="deposit"
                type="number"
                step="0.01"
                {...form.register('deposit', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 水电单价 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="water_rate">水费单价</Label>
              <Input
                id="water_rate"
                type="number"
                step="0.01"
                {...form.register('water_rate', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity_rate">电费单价</Label>
              <Input
                id="electricity_rate"
                type="number"
                step="0.01"
                {...form.register('electricity_rate', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Input id="notes" {...form.register('notes')} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? '创建中...' : '确认签约'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
