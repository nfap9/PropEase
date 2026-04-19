
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { TenantSelectWithCreate } from '@/components/common/tenant-select-with-create';
import { FeeItemsEditor, type FeeItem } from '@/components/common/fee-items-editor';
import { leasesApi, apartmentsApi, roomsApi, utilityConfigApi } from '@/api';
import { toDateInputValue } from '@/utils/date';
import { filterEmptyStrings } from '@/utils/form';
import { getErrorMessage } from '@/utils/error';
import { Room, Apartment } from '@/types';
import type { UtilityConfig } from '@apartment-ultra/api-contract';

const leaseSchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  tenant_id: z.string().min(1, '请选择租客'),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().optional(),
  monthly_rent: z.coerce.number().min(0, '月租不能为负'),
  deposit: z.coerce.number().min(0, '押金不能为负').optional(),
  water_rate: z.coerce.number().min(0).optional(),
  electricity_rate: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export type LeaseFormData = z.infer<typeof leaseSchema>;

export interface LeaseCreatedParams {
  room_id: string;
  room_display: string;
  start_date: string;
  is_historical_entry: boolean;
}

export interface LeaseFormDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 指定房间时使用（房间列表页），房间信息只读 */
  room?: Room | null;
  /** 成功回调 */
  onSuccess?: () => void;
  /** 签约成功回调，用于后续录入初始水电等 */
  onLeaseCreated?: (params: LeaseCreatedParams) => void;
}

export function LeaseFormDialog({
  orgId,
  open,
  onOpenChange,
  room,
  onSuccess,
  onLeaseCreated,
}: LeaseFormDialogProps) {
  const queryClient = useQueryClient();
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [utilityConfig, setUtilityConfig] = useState<UtilityConfig | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);

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

  // 当选择房间后，获取水电配置
  const currentRoomId = form.watch('room_id');
  const effectiveApartmentId = isRoomSpecified
    ? room?.apartment_id
    : rooms?.find((r) => r.id === currentRoomId)?.apartment_id;

  useEffect(() => {
    if (effectiveApartmentId && open) {
      utilityConfigApi.get(orgId, effectiveApartmentId).then(setUtilityConfig).catch(() => {
        // 如果没有配置，忽略错误
        setUtilityConfig(null);
      });
    } else {
      setUtilityConfig(null);
    }
  }, [effectiveApartmentId, orgId, open]);

  // 当水电配置加载后，更新表单默认值
  const updateFormWithUtilityConfig = useCallback(() => {
    if (utilityConfig) {
      const waterPrice = utilityConfig.water_price_per_unit;
      const elecPrice = utilityConfig.electricity_price_per_unit;
      if (waterPrice !== undefined && waterPrice !== null) {
        form.setValue('water_rate', waterPrice);
      }
      if (elecPrice !== undefined && elecPrice !== null) {
        form.setValue('electricity_rate', elecPrice);
      }
    }
  }, [utilityConfig, form]);

  useEffect(() => {
    updateFormWithUtilityConfig();
  }, [updateFormWithUtilityConfig]);

  // 当指定房间时，初始化表单
  useEffect(() => {
    if (room && open) {
      const waterPrice = utilityConfig?.water_price_per_unit ?? 0;
      const elecPrice = utilityConfig?.electricity_price_per_unit ?? 0;
      form.reset({
        room_id: room.id,
        tenant_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_rent: room.pricing?.monthly_rent ?? 0,
        deposit: 0,
        water_rate: waterPrice,
        electricity_rate: elecPrice,
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
    // 重置费用项目
    setFeeItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, open, isRoomSpecified]);

  const createMutation = useMutation({
    mutationFn: (data: LeaseFormData & { fee_items?: FeeItem[] }) => {
      const { fee_items, ...rest } = data;
      const payload = filterEmptyStrings(rest);
      // 添加费用项目
      if (fee_items && fee_items.length > 0) {
        (payload as Record<string, unknown>).fee_items = fee_items.map((item) => ({
          fee_name: item.name,
          fee_amount: item.amount,
          fee_cycle: item.cycle,
          quantity: 1,
          notes: item.notes || undefined,
        }));
      }
      return leasesApi.create(orgId, payload as Parameters<typeof leasesApi.create>[1]);
    },
    onSuccess: (createdLease, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      onOpenChange(false);
      form.reset();
      toast.success('签约成功');
      const roomId = createdLease.room_id;
      const startDate = createdLease.start_date;
      const isHistoricalEntry = variables.start_date < toDateInputValue(new Date());
      const matchedRoom = room ?? rooms?.find((r) => r.id === variables.room_id);
      const aptName =
        matchedRoom?.apartment?.name ??
        apartments?.find((a) => a.id === matchedRoom?.apartment_id)?.name ??
        '';
      const roomDisplay = matchedRoom ? `${aptName} - ${matchedRoom.room_number}` : '';
      onLeaseCreated?.({
        room_id: roomId,
        room_display: roomDisplay,
        start_date: startDate,
        is_historical_entry: isHistoricalEntry,
      });
      onSuccess?.();
    },
    onError: (error) => toast.error(getErrorMessage(error, '签约失败，请重试')),
  });

  const handleSubmit = (data: LeaseFormData) => {
    createMutation.mutate({ ...data, fee_items: feeItems });
  };

  const setDateFieldValue = (field: 'start_date' | 'end_date', value: string) => {
    form.setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="leases-create-dialog">
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
                value={room ? `${room.apartment?.name || ''} - ${room.room_number}` : ''}
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
                  <SelectTrigger className="min-w-[140px]" data-testid="leases-apartment-select">
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
                <Label htmlFor="room_id" required>
                  选择房间
                </Label>
                <Select
                  value={form.watch('room_id') || ''}
                  onValueChange={(value) => form.setValue('room_id', value)}
                >
                  <SelectTrigger className="min-w-[140px]" data-testid="leases-room-select">
                    <SelectValue placeholder="选择房间" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms
                      ?.filter((r) => r.status === 'available')
                      .map((r: Room) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.room_number} {r.pricing?.monthly_rent ? `- ¥${r.pricing.monthly_rent}/月` : '- 暂无定价'}
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
            <Label htmlFor="tenant_id" required>
              选择租客
            </Label>
            <div data-testid="leases-tenant-select">
              <TenantSelectWithCreate
                orgId={orgId}
                value={form.watch('tenant_id')}
                onValueChange={(value) => form.setValue('tenant_id', value)}
                error={form.formState.errors.tenant_id?.message}
              />
            </div>
          </div>

          {/* 日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" required>
                开始日期
              </Label>
              <Input
                id="start_date"
                type="date"
                value={form.watch('start_date') || ''}
                onChange={(e) => setDateFieldValue('start_date', e.target.value)}
                data-testid="leases-start-date-input"
              />
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">结束日期</Label>
              <Input
                id="end_date"
                type="date"
                value={form.watch('end_date') || ''}
                onChange={(e) => setDateFieldValue('end_date', e.target.value)}
                data-testid="leases-end-date-input"
              />
            </div>
          </div>

          {/* 月租和押金 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_rent" required>
                月租 (元)
              </Label>
              <Input
                id="monthly_rent"
                type="number"
                step="0.01"
                placeholder="请输入月租金额"
                {...form.register('monthly_rent', { valueAsNumber: true })}
                data-testid="leases-monthly-rent-input"
              />
              {form.formState.errors.monthly_rent && (
                <p className="text-sm text-destructive">{form.formState.errors.monthly_rent.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">押金 (元)</Label>
              <Input
                id="deposit"
                type="number"
                step="0.01"
                placeholder="请输入押金金额"
                {...form.register('deposit', { valueAsNumber: true })}
                data-testid="leases-deposit-input"
              />
            </div>
          </div>

          {/* 水电单价 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="water_rate">
                水费单价（元/吨）
                {utilityConfig?.water_price_per_unit !== undefined && utilityConfig?.water_price_per_unit !== null && (
                  <span className="text-muted-foreground text-xs ml-1">
                    (公寓配置: ¥{utilityConfig.water_price_per_unit}/吨)
                  </span>
                )}
              </Label>
              <Input
                id="water_rate"
                type="number"
                step="0.01"
                placeholder="请输入水费单价"
                {...form.register('water_rate', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity_rate">
                电费单价（元/度）
                {utilityConfig?.electricity_price_per_unit !== undefined && utilityConfig?.electricity_price_per_unit !== null && (
                  <span className="text-muted-foreground text-xs ml-1">
                    (公寓配置: ¥{utilityConfig.electricity_price_per_unit}/度)
                  </span>
                )}
              </Label>
              <Input
                id="electricity_rate"
                type="number"
                step="0.01"
                placeholder="请输入电费单价"
                {...form.register('electricity_rate', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 费用项目编辑器 */}
          <FeeItemsEditor items={feeItems} onChange={setFeeItems} />

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Input id="notes" placeholder="请输入备注" {...form.register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="leases-cancel-btn">
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending} data-testid="leases-confirm-btn">
              {createMutation.isPending ? '创建中...' : '确认签约'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
