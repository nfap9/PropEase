'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
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
import { leasesApi, apartmentsApi, roomsApi, utilityConfigApi, feeTypesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { Room, Apartment } from '@/types';
import type { FeeType, FeeSpecification, UtilityConfig } from '@apartment-ultra/api-contract';

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

/** 选中的费用项 */
export interface SelectedFee {
  fee_type_id: string;
  specification_id: string;
  fee_type_name: string;
  spec_name: string;
  price: number;
}

export interface LeaseCreatedParams {
  room_id: string;
  room_display: string;
  start_date: string;
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
  const [selectedFees, setSelectedFees] = useState<SelectedFee[]>([]);

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

  // 获取费用类型列表
  const { data: feeTypes } = useQuery({
    queryKey: ['fee-types', orgId],
    queryFn: () => feeTypesApi.list(orgId),
    enabled: !!orgId && open,
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
        monthly_rent: room.monthly_rent,
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
    // 重置选中的费用
    setSelectedFees([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, open, isRoomSpecified]);

  const createMutation = useMutation({
    mutationFn: (data: LeaseFormData) => leasesApi.create(orgId, filterEmptyStrings(data)),
    onSuccess: (createdLease, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['all-rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
      onOpenChange(false);
      form.reset();
      appToast.success('签约成功');
      const roomId = createdLease.room_id;
      const startDate = createdLease.start_date;
      const matchedRoom = room ?? rooms?.find((r) => r.id === variables.room_id);
      const aptName =
        matchedRoom?.apartment?.name ??
        apartments?.find((a) => a.id === matchedRoom?.apartment_id)?.name ??
        '';
      const roomDisplay = matchedRoom ? `${aptName} - ${matchedRoom.room_number}` : '';
      onLeaseCreated?.({ room_id: roomId, room_display: roomDisplay, start_date: startDate });
      onSuccess?.();
    },
    onError: (error) => appToast.error(getErrorMessage(error, '签约失败，请重试')),
  });

  const handleSubmit = (data: LeaseFormData) => {
    createMutation.mutate(data);
  };

  const setDateFieldValue = (field: 'start_date' | 'end_date', value: string) => {
    form.setValue(field, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // 添加费用到选中列表（同一费用类型只能选择一个规格）
  const handleAddFee = (feeType: FeeType, spec: FeeSpecification) => {
    const exists = selectedFees.some((f) => f.specification_id === spec.id);
    if (exists) {
      // 已存在则移除
      handleRemoveFee(spec.id);
      return;
    }
    // 移除同一费用类型的其他规格，添加新规格
    setSelectedFees((prev) => {
      const filtered = prev.filter((f) => f.fee_type_id !== feeType.id);
      return [
        ...filtered,
        {
          fee_type_id: feeType.id,
          specification_id: spec.id,
          fee_type_name: feeType.name,
          spec_name: spec.name,
          price: spec.price_monthly,
        },
      ];
    });
  };

  // 从选中列表移除费用
  const handleRemoveFee = (specificationId: string) => {
    setSelectedFees((prev) => prev.filter((f) => f.specification_id !== specificationId));
  };

  // 更新选中费用的价格
  const handleUpdateFeePrice = (specificationId: string, price: number) => {
    setSelectedFees((prev) =>
      prev.map((f) => (f.specification_id === specificationId ? { ...f, price } : f))
    );
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
                <Label htmlFor="room_id">选择房间 *</Label>
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
              <Label htmlFor="start_date">开始日期 *</Label>
              <DateTimePicker
                id="start_date"
                mode="date"
                value={form.watch('start_date')}
                onChange={(value) => setDateFieldValue('start_date', value)}
                data-testid="leases-start-date-input"
                placeholder="选择开始日期"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">结束日期</Label>
              <DateTimePicker
                id="end_date"
                mode="date"
                value={form.watch('end_date')}
                onChange={(value) => setDateFieldValue('end_date', value)}
                data-testid="leases-end-date-input"
                placeholder="选择结束日期"
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
                data-testid="leases-monthly-rent-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">押金 (元)</Label>
              <Input
                id="deposit"
                type="number"
                step="0.01"
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
                placeholder={utilityConfig?.water_price_per_unit?.toString() ?? '0'}
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
                placeholder={utilityConfig?.electricity_price_per_unit?.toString() ?? '0'}
                {...form.register('electricity_rate', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 费用选择 */}
          {feeTypes && feeTypes.length > 0 && (
            <div className="space-y-3 border rounded-lg p-4">
              <Label className="text-base">额外费用（可选）</Label>
              <p className="text-sm text-muted-foreground">选择需要添加的费用，可修改价格</p>

              {/* 已选择的费用列表 */}
              {selectedFees.length > 0 && (
                <div className="space-y-2">
                  {selectedFees.map((fee) => (
                    <div key={fee.specification_id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleRemoveFee(fee.specification_id)}
                      />
                      <span className="flex-1 text-sm">
                        {fee.fee_type_name} - {fee.spec_name}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={fee.price}
                        onChange={(e) => handleUpdateFeePrice(fee.specification_id, parseFloat(e.target.value) || 0)}
                        className="w-24 h-8"
                      />
                      <span className="text-sm text-muted-foreground">元/月</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 费用类型选择 */}
              <div className="space-y-2">
                {feeTypes.map((feeType) => {
                  const specs = feeType.specifications?.filter((s) => s.is_active) || [];
                  if (specs.length === 0) return null;

                  return (
                    <div key={feeType.id} className="space-y-1">
                      <div className="text-sm font-medium">{feeType.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {specs.map((spec) => {
                          const isSelected = selectedFees.some((f) => f.specification_id === spec.id);
                          return (
                            <Button
                              key={spec.id}
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                if (isSelected) {
                                  handleRemoveFee(spec.id);
                                } else {
                                  handleAddFee(feeType, spec);
                                }
                              }}
                            >
                              {spec.name} (¥{spec.price_monthly}/月)
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Input id="notes" {...form.register('notes')} />
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
