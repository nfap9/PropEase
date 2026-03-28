# 签约抽屉组件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将签约对话框改为抽屉组件，分为房间信息、租客信息、合同信息三个区域；签约时自动创建首个账单。

**Architecture:** 使用 React Hook Form + Zod 管理表单状态，通过 Sheet 组件实现右侧抽屉布局。租客搜索使用独立抽屉，选择后回填表单。签约时按身份证号判断租客是否已存在，决定创建或更新。

**Tech Stack:** Next.js, TanStack Query, React Hook Form, Zod, shadcn/ui (Sheet, Separator, Input, Select, Button, Checkbox)

---

## 文件结构

```
tenant-web/src/features/leases/
├── components/
│   ├── lease-signing-drawer.tsx      # 主抽屉（新建）
│   ├── tenant-search-drawer.tsx      # 租客搜索抽屉（新建）
│   └── leases-page-content.tsx       # 修改：替换对话框为抽屉
├── leases.schemas.ts                  # 修改：新增签约表单 schema
└── leases.hooks.ts                   # 修改：新增签约相关 hooks

packages/api-contract/src/leases.ts   # 修改：LeaseCreate 新增字段
api/src/services/lease.service.ts      # 修改：创建租约时自动创建首个账单
```

---

## Task 1: 定义签约表单 Schema

**Files:**
- Modify: `tenant-web/src/features/leases/leases.schemas.ts`

- [ ] **Step 1: 添加 LeaseSigningSchema**

```typescript
export const leaseSigningSchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  tenant_name: z.string().min(1, '请输入租客姓名'),
  tenant_phone: z.string().min(1, '请输入联系电话'),
  tenant_id_card: z.string().optional(),
  tenant_emergency_contact: z.string().optional(),
  tenant_emergency_phone: z.string().optional(),
  tenant_notes: z.string().optional(),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().optional(),
  monthly_rent: z.coerce.number().min(0, '月租不能为负'),
  deposit: z.coerce.number().min(0, '押金不能为负').optional(),
  water_rate: z.coerce.number().min(0).optional(),
  electricity_rate: z.coerce.number().min(0).optional(),
  extra_fees: z.array(z.object({
    fee_type_id: z.string(),
    specification_id: z.string(),
    price: z.number(),
  })).optional(),
  notes: z.string().optional(),
});

export type LeaseSigningFormData = z.infer<typeof leaseSigningSchema>;
```

- [ ] **Step 2: 导出类型**

在 `leases.schemas.ts` 底部添加导出：
```typescript
export type { LeaseSigningFormData };
```

---

## Task 2: 创建租客搜索抽屉组件

**Files:**
- Create: `tenant-web/src/features/leases/components/tenant-search-drawer.tsx`

- [ ] **Step 1: 编写 TenantSearchDrawer 组件**

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { tenantsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Tenant } from '@apartment-ultra/api-contract';

interface TenantSearchDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tenant: Tenant) => void;
}

export function TenantSearchDrawer({
  orgId,
  open,
  onOpenChange,
  onSelect,
}: TenantSearchDrawerProps) {
  const [search, setSearch] = useState('');

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', orgId, search],
    queryFn: () => tenantsApi.list(orgId, search || undefined),
    enabled: !!orgId,
  });

  const handleSelect = (tenant: Tenant) => {
    onSelect(tenant);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>选择已有租客</SheetTitle>
          <SheetDescription>搜索并选择已有租客，信息将自动回填到表单</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名或电话..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 租客列表 */}
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">加载中...</p>
            ) : tenants?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">未找到租客</p>
            ) : (
              tenants?.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelect(tenant)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {tenant.phone || '无电话'} {tenant.id_card ? `· ${tenant.id_card}` : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Task 3: 创建签约抽屉主组件

**Files:**
- Create: `tenant-web/src/features/leases/components/lease-signing-drawer.tsx`

- [ ] **Step 1: 编写 LeaseSigningDrawer 组件**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Separator } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Checkbox } from '@apartment-ultra/shared-ui/components/ui';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@apartment-ultra/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@apartment-ultra/shared-ui/components/ui';
import { leaseSigningSchema, type LeaseSigningFormData } from '../leases.schemas';
import { leasesApi, apartmentsApi, roomsApi, tenantsApi, utilityConfigApi, feeTypesApi } from '@/lib/api';
import { filterEmptyStrings } from '@/lib/utils/form';
import { getErrorMessage } from '@/lib/utils/error';
import { TenantSearchDrawer } from './tenant-search-drawer';
import type { Room, Apartment, Tenant, FeeType, FeeSpecification, UtilityConfig } from '@apartment-ultra/api-contract';

interface LeaseSigningDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSuccess?: () => void;
}

export function LeaseSigningDrawer({
  orgId,
  open,
  onOpenChange,
  room,
  onSuccess,
}: LeaseSigningDrawerProps) {
  const queryClient = useQueryClient();
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [utilityConfig, setUtilityConfig] = useState<UtilityConfig | null>(null);
  const [selectedFees, setSelectedFees] = useState<{ fee_type_id: string; specification_id: string; fee_type_name: string; spec_name: string; price: number }[]>([]);
  const [tenantSearchOpen, setTenantSearchOpen] = useState(false);

  const isRoomSpecified = !!room;

  const form = useForm<LeaseSigningFormData>({
    resolver: zodResolver(leaseSigningSchema),
    defaultValues: {
      room_id: '',
      tenant_name: '',
      tenant_phone: '',
      tenant_id_card: '',
      tenant_emergency_contact: '',
      tenant_emergency_phone: '',
      tenant_notes: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      monthly_rent: 0,
      deposit: 0,
      water_rate: 0,
      electricity_rate: 0,
      extra_fees: [],
      notes: '',
    },
  });

  // 获取公寓列表
  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
    enabled: !!orgId && !isRoomSpecified,
  });

  // 获取房间列表
  const { data: rooms } = useQuery({
    queryKey: ['rooms', orgId, selectedApartmentId],
    queryFn: () => roomsApi.list(orgId, selectedApartmentId!),
    enabled: !!orgId && !isRoomSpecified && selectedApartmentId !== null,
  });

  // 获取费用类型
  const { data: feeTypes } = useQuery({
    queryKey: ['fee-types', orgId],
    queryFn: () => feeTypesApi.list(orgId),
    enabled: !!orgId && open,
  });

  // 监听公寓/房间变化获取水电配置
  const currentRoomId = form.watch('room_id');
  const effectiveApartmentId = isRoomSpecified
    ? room?.apartment_id
    : rooms?.find((r) => r.id === currentRoomId)?.apartment_id;

  useEffect(() => {
    if (effectiveApartmentId && open) {
      utilityConfigApi.get(orgId, effectiveApartmentId).then(setUtilityConfig).catch(() => {
        setUtilityConfig(null);
      });
    } else {
      setUtilityConfig(null);
    }
  }, [effectiveApartmentId, orgId, open]);

  // 更新水电费率表单默认值
  useEffect(() => {
    if (utilityConfig && open) {
      const waterPrice = utilityConfig.water_price_per_unit ?? 0;
      const elecPrice = utilityConfig.electricity_price_per_unit ?? 0;
      if (form.getValues('water_rate') === 0) {
        form.setValue('water_rate', waterPrice);
      }
      if (form.getValues('electricity_rate') === 0) {
        form.setValue('electricity_rate', elecPrice);
      }
    }
  }, [utilityConfig, open, form]);

  // 初始化/重置表单
  useEffect(() => {
    if (room && open) {
      form.reset({
        room_id: room.id,
        tenant_name: '',
        tenant_phone: '',
        tenant_id_card: '',
        tenant_emergency_contact: '',
        tenant_emergency_phone: '',
        tenant_notes: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_rent: room.monthly_rent,
        deposit: 0,
        water_rate: utilityConfig?.water_price_per_unit ?? 0,
        electricity_rate: utilityConfig?.electricity_price_per_unit ?? 0,
        extra_fees: [],
        notes: '',
      });
    } else if (!isRoomSpecified && open) {
      form.reset({
        room_id: '',
        tenant_name: '',
        tenant_phone: '',
        tenant_id_card: '',
        tenant_emergency_contact: '',
        tenant_emergency_phone: '',
        tenant_notes: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        monthly_rent: 0,
        deposit: 0,
        water_rate: 0,
        electricity_rate: 0,
        extra_fees: [],
        notes: '',
      });
      setSelectedApartmentId(null);
    }
    setSelectedFees([]);
  }, [room, open, isRoomSpecified]);

  // 租客选择回填
  const handleTenantSelect = (tenant: Tenant) => {
    form.setValue('tenant_name', tenant.name || '');
    form.setValue('tenant_phone', tenant.phone || '');
    form.setValue('tenant_id_card', tenant.id_card || '');
    form.setValue('tenant_emergency_contact', tenant.emergency_contact || '');
    form.setValue('tenant_emergency_phone', tenant.emergency_phone || '');
    form.setValue('tenant_notes', tenant.notes || '');
  };

  // 签约提交：先处理租客，再创建租约
  const createMutation = useMutation({
    mutationFn: async (data: LeaseSigningFormData) => {
      // 1. 按身份证号查询租客
      let tenantId = '';
      if (data.tenant_id_card) {
        const existingTenants = await tenantsApi.list(orgId, data.tenant_id_card);
        const found = existingTenants.find(t => t.id_card === data.tenant_id_card);
        if (found) {
          // 更新已有租客
          const { data: updated } = await tenantsApi.update(orgId, found.id, {
            name: data.tenant_name,
            phone: data.tenant_phone,
            id_card: data.tenant_id_card,
            emergency_contact: data.tenant_emergency_contact,
            emergency_phone: data.tenant_emergency_phone,
            notes: data.tenant_notes,
          });
          tenantId = updated.id;
        } else {
          // 创建新租客
          const { data: created } = await tenantsApi.create(orgId, {
            name: data.tenant_name,
            phone: data.tenant_phone,
            id_card: data.tenant_id_card,
            emergency_contact: data.tenant_emergency_contact,
            emergency_phone: data.tenant_emergency_phone,
            notes: data.tenant_notes,
          });
          tenantId = created.id;
        }
      } else {
        // 无身份证号，直接创建新租客
        const { data: created } = await tenantsApi.create(orgId, {
          name: data.tenant_name,
          phone: data.tenant_phone,
          id_card: data.tenant_id_card,
          emergency_contact: data.tenant_emergency_contact,
          emergency_phone: data.tenant_emergency_phone,
          notes: data.tenant_notes,
        });
        tenantId = created.id;
      }

      // 2. 创建租约（后端自动创建首个账单）
      const leaseData = {
        room_id: data.room_id,
        tenant_id: tenantId,
        start_date: data.start_date,
        end_date: data.end_date || undefined,
        monthly_rent: data.monthly_rent,
        deposit: data.deposit,
        water_rate: data.water_rate,
        electricity_rate: data.electricity_rate,
        notes: data.notes,
      };
      const lease = await leasesApi.create(orgId, filterEmptyStrings(leaseData));
      return lease;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', orgId] });
      onOpenChange(false);
      form.reset();
      toast.success('签约成功');
      onSuccess?.();
    },
    onError: (error) => toast.error(getErrorMessage(error, '签约失败，请重试')),
  });

  const handleSubmit = (data: LeaseSigningFormData) => {
    createMutation.mutate(data);
  };

  // 费用选择
  const handleAddFee = (feeType: FeeType, spec: FeeSpecification) => {
    setSelectedFees((prev) => {
      const exists = prev.some((f) => f.specification_id === spec.id);
      if (exists) return prev.filter((f) => f.specification_id !== spec.id);
      return [
        ...prev.filter((f) => f.fee_type_id !== feeType.id),
        { fee_type_id: feeType.id, specification_id: spec.id, fee_type_name: feeType.name, spec_name: spec.name, price: spec.price_monthly },
      ];
    });
  };

  const handleUpdateFeePrice = (specId: string, price: number) => {
    setSelectedFees((prev) => prev.map((f) => f.specification_id === specId ? { ...f, price } : f));
  };

  const getDialogTitle = () => isRoomSpecified ? '签约' : '新增租约';
  const getDialogDescription = () => isRoomSpecified && room
    ? `为房间 ${room.room_number} 创建租约`
    : '创建新的租约';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{getDialogTitle()}</SheetTitle>
            <SheetDescription>{getDialogDescription()}</SheetDescription>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-6">
            {/* ===== 区域一：房间信息 ===== */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">房间信息</h3>
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
                    <Select value={selectedApartmentId || ''} onValueChange={setSelectedApartmentId}>
                      <SelectTrigger><SelectValue placeholder="选择公寓" /></SelectTrigger>
                      <SelectContent>
                        {apartments?.map((apt: Apartment) => (
                          <SelectItem key={apt.id} value={apt.id}>{apt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>选择房间 *</Label>
                    <Select value={form.watch('room_id') || ''} onValueChange={(v) => form.setValue('room_id', v)}>
                      <SelectTrigger><SelectValue placeholder="选择房间" /></SelectTrigger>
                      <SelectContent>
                        {rooms?.filter((r: Room) => r.status === 'available').map((r: Room) => (
                          <SelectItem key={r.id} value={r.id}>{r.room_number} - ¥{r.monthly_rent}/月</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.room_id && (
                      <p className="text-sm text-destructive">{form.formState.errors.room_id.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* ===== 区域二：租客信息 ===== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">租客信息</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setTenantSearchOpen(true)}>
                  选择已有租客
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant_name">租客姓名 *</Label>
                  <Input id="tenant_name" {...form.register('tenant_name')} />
                  {form.formState.errors.tenant_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.tenant_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant_phone">联系电话 *</Label>
                  <Input id="tenant_phone" {...form.register('tenant_phone')} />
                  {form.formState.errors.tenant_phone && (
                    <p className="text-sm text-destructive">{form.formState.errors.tenant_phone.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant_id_card">身份证号</Label>
                  <Input id="tenant_id_card" {...form.register('tenant_id_card')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant_emergency_contact">紧急联系人</Label>
                  <Input id="tenant_emergency_contact" {...form.register('tenant_emergency_contact')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant_emergency_phone">紧急联系人电话</Label>
                  <Input id="tenant_emergency_phone" {...form.register('tenant_emergency_phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant_notes">备注</Label>
                  <Input id="tenant_notes" {...form.register('tenant_notes')} />
                </div>
              </div>
            </div>

            <Separator />

            {/* ===== 区域三：合同信息 ===== */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">合同信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">开始日期 *</Label>
                  <Input id="start_date" type="date" {...form.register('start_date')} />
                  {form.formState.errors.start_date && (
                    <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">结束日期</Label>
                  <Input id="end_date" type="date" {...form.register('end_date')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_rent">月租 (元) *</Label>
                  <Input id="monthly_rent" type="number" step="0.01" {...form.register('monthly_rent', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">押金 (元)</Label>
                  <Input id="deposit" type="number" step="0.01" {...form.register('deposit', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="water_rate">水费单价（元/吨）</Label>
                  <Input id="water_rate" type="number" step="0.01" {...form.register('water_rate', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electricity_rate">电费单价（元/度）</Label>
                  <Input id="electricity_rate" type="number" step="0.01" {...form.register('electricity_rate', { valueAsNumber: true })} />
                </div>
              </div>

              {/* 额外费用 */}
              {feeTypes && feeTypes.length > 0 && (
                <div className="space-y-3 border rounded-lg p-4">
                  <Label className="text-base">额外费用（可选）</Label>
                  {selectedFees.length > 0 && (
                    <div className="space-y-2">
                      {selectedFees.map((fee) => (
                        <div key={fee.specification_id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => handleAddFee({ id: fee.fee_type_id, name: fee.fee_type_name } as FeeType, { id: fee.specification_id, name: fee.spec_name, price_monthly: fee.price } as FeeSpecification)}
                          />
                          <span className="flex-1 text-sm">{fee.fee_type_name} - {fee.spec_name}</span>
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
                  <div className="space-y-2">
                    {feeTypes.map((feeType) => {
                      const specs = feeType.specifications?.filter((s: any) => s.is_active) || [];
                      if (specs.length === 0) return null;
                      return (
                        <div key={feeType.id} className="space-y-1">
                          <div className="text-sm font-medium">{feeType.name}</div>
                          <div className="flex flex-wrap gap-2">
                            {specs.map((spec: any) => {
                              const isSelected = selectedFees.some((f) => f.specification_id === spec.id);
                              return (
                                <Button
                                  key={spec.id}
                                  type="button"
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleAddFee(feeType, spec)}
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

              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Input id="notes" {...form.register('notes')} />
              </div>
            </div>

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '创建中...' : '确认签约'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* 租客搜索抽屉 */}
      <TenantSearchDrawer
        orgId={orgId}
        open={tenantSearchOpen}
        onOpenChange={setTenantSearchOpen}
        onSelect={handleTenantSelect}
      />
    </>
  );
}
```

---

## Task 4: 修改 leases.schemas.ts 导出新类型

**Files:**
- Modify: `tenant-web/src/features/leases/leases.schemas.ts`

- [ ] **Step 1: 在文件末尾添加导出**

```typescript
export type { LeaseSigningFormData } from './leases.schemas';
```

实际上类型已经在 Task 1 中定义了，确保 `LeaseSigningFormData` 可从 `../leases.schemas` 导出。

---

## Task 5: 在页面中使用新抽屉替换旧对话框

**Files:**
- Modify: `tenant-web/src/features/leases/components/leases-page-content.tsx`

- [ ] **Step 1: 导入新组件，替换 LeaseFormDialog**

找到 `LeaseFormDialog` 的导入和使用，替换为 `LeaseSigningDrawer`：

```typescript
import { LeaseSigningDrawer } from './components/lease-signing-drawer';

// 替换原来的 LeaseFormDialog 使用
<LeaseSigningDrawer
  orgId={orgId}
  open={isCreateDialogOpen}
  onOpenChange={setIsCreateDialogOpen}
  room={selectedRoom}
  onSuccess={() => {
    setIsCreateDialogOpen(false);
    refetch();
  }}
/>
```

---

## Task 6: 租客 API 添加 search 参数支持

**Files:**
- Modify: `tenant-web/src/lib/api/tenants.ts`

- [ ] **Step 1: 确保 list 函数支持 search 参数**

```typescript
list: async (orgId: string, search?: string): Promise<Tenant[]> => {
  const response = await api.get<Tenant[]>('/tenants', {
    params: { org_id: orgId, search },
  });
  return response.data;
},
```

确认 `search` 参数已支持（已有 tenantsApi 需要检查是否已实现）。

---

## Task 7: 后端租约服务自动创建首个账单

**Files:**
- Modify: `api/src/services/lease.service.ts`

- [ ] **Step 1: 在 createLease 函数中，创建租约后自动创建首个账单**

```typescript
import { createBill } from './bill.service';

async function createLease(orgId: string, data: LeaseCreate): Promise<Lease> {
  // ... 现有创建租约逻辑 ...

  const lease = await leaseRepo.create(data);

  // 自动创建首个账单（租金 + 押金 + 额外费用）
  const startDate = new Date(lease.start_date);
  const billYear = startDate.getFullYear();
  const billMonth = startDate.getMonth() + 1;

  // 计算额外费用月总价
  let extraFeesTotal = 0;
  // extra_fees 从 data 中获取，如果有的话

  const totalAmount = lease.monthly_rent + (lease.deposit || 0) + extraFeesTotal;

  await createBill(orgId, {
    lease_id: lease.id,
    bill_year: billYear,
    bill_month: billMonth,
    due_date: lease.start_date,
    rent_amount: lease.monthly_rent,
    deposit_amount: lease.deposit || 0,
    other_amount: extraFeesTotal,
    total_amount: totalAmount,
  });

  return lease;
}
```

注意：`BillCreate` 接口需要新增 `deposit_amount` 字段。

---

## Task 8: API Contract 更新

**Files:**
- Modify: `packages/api-contract/src/bills.ts`

- [ ] **Step 1: 在 BillCreate 中添加 deposit_amount 字段**

```typescript
export interface BillCreate {
  lease_id: string;
  bill_year: number;
  bill_month: number;
  due_date: string;
  rent_amount?: number;
  deposit_amount?: number;
  water_amount?: number;
  electricity_amount?: number;
  other_amount?: number;
  total_amount: number;
  notes?: string;
}
```

---

## 验证清单

- [ ] 签约抽屉可以正确打开和关闭
- [ ] 房间信息区域：公寓和房间选择器工作正常
- [ ] 租客信息区域：所有字段正确显示，选择已有租客后回填所有字段
- [ ] 合同信息区域：日期、月租、押金、水电单价、额外费用正确
- [ ] 签约成功时自动创建首个账单
- [ ] 签约成功后抽屉关闭，列表刷新
- [ ] 错误处理正确（toast 提示）

---

**Plan complete.** 请选择执行方式：
1. **Subagent-Driven (recommended)** - 任务分配给子 agent 执行
2. **Inline Execution** - 当前会话逐步执行
