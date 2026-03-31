# 租约高级操作前端实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 tenant-web 实现租约详情页 + 7 个高级操作界面，对齐后端已实现的 API

**Architecture:** 新建 `/leases/[id]` 路由页面，单页 + Tab 切换（详情/费用项目/变更历史）；操作入口统一用「操作」Dropdown Menu；换房/续约/房租变更/水电变更/退租结算用 Sheet；押金/租客变更用 Dialog

**Tech Stack:** Next.js 14 App Router, TanStack Query, React Hook Form, Zod, shadcn/ui (Sheet/Dialog)

---

## 文件结构

### 新增文件
- `tenant-web/src/app/leases/[id]/page.tsx` — 详情页路由入口
- `tenant-web/src/features/leases/components/lease-detail-page.tsx` — 详情页主容器（需要补充 `useAuth` import）
- `tenant-web/src/features/leases/components/lease-detail-tabs.tsx` — Tab 切换
- `tenant-web/src/features/leases/components/lease-detail-info.tsx` — 详情 Tab 内容
- `tenant-web/src/features/leases/components/lease-fee-items-tab.tsx` — 费用项目 Tab
- `tenant-web/src/features/leases/components/lease-change-history-tab.tsx` — 变更历史 Tab
- `tenant-web/src/features/leases/components/lease-change-logs.tsx` — 变更时间线组件
- `tenant-web/src/features/leases/components/operations-dropdown.tsx` — 操作下拉菜单
- `tenant-web/src/features/leases/components/operation-sheets/change-room-sheet.tsx`
- `tenant-web/src/features/leases/components/operation-sheets/renew-sheet.tsx`
- `tenant-web/src/features/leases/components/operation-sheets/change-rent-sheet.tsx`
- `tenant-web/src/features/leases/components/operation-sheets/change-utility-rates-sheet.tsx`
- `tenant-web/src/features/leases/components/operation-sheets/update-fee-items-sheet.tsx`
- `tenant-web/src/features/leases/components/operation-sheets/settle-lease-sheet.tsx`
- `tenant-web/src/features/leases/components/operation-dialogs/update-tenant-dialog.tsx`
- `tenant-web/src/features/leases/components/operation-dialogs/change-deposit-dialog.tsx`
- `tenant-web/src/features/leases/hooks/use-lease-operations.ts` — 高级操作 hooks
- `tenant-web/src/features/leases/schemas/lease-operations.schemas.ts` — Zod schemas

### 修改文件
- `tenant-web/src/lib/api/leases.ts` — 新增 8 个 API 方法
- `tenant-web/src/features/leases/leases.columns.tsx` — 列表跳转链接改为指向详情页

---

## Task 1: API 层扩展

**Files:**
- Modify: `tenant-web/src/lib/api/leases.ts`

- [ ] **Step 1: 扩展 leasesApi 新增 8 个方法**

替换整个文件内容：

```typescript
import api from './client';
import { Lease } from '@/types';

export interface LeaseChangeLog {
  id: string;
  lease_id: string;
  change_type: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  effective_from_year: number | null;
  effective_from_month: number | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LeaseFeeItem {
  id: string;
  lease_id: string;
  fee_type_id: string;
  specification_id: string | null;
  quantity: number;
  feeType: { id: string; name: string; code: string };
  specification: { id: string; name: string; price_monthly: number } | null;
}

export const leasesApi = {
  list: async (orgId: string, isActive?: boolean): Promise<Lease[]> => {
    const response = await api.get<Lease[]>('/leases', {
      params: { org_id: orgId, is_active: isActive },
    });
    return response.data;
  },

  get: async (orgId: string, id: string): Promise<Lease> => {
    const response = await api.get<Lease>(`/leases/${id}`, { params: { org_id: orgId } });
    return response.data;
  },

  create: async (orgId: string, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.post<Lease>('/leases', data, { params: { org_id: orgId } });
    return response.data;
  },

  update: async (orgId: string, id: string, data: Partial<Lease>): Promise<Lease> => {
    const response = await api.put<Lease>(`/leases/${id}`, data, { params: { org_id: orgId } });
    return response.data;
  },

  terminate: async (orgId: string, id: string): Promise<void> => {
    await api.post(`/leases/${id}/terminate`, {}, { params: { org_id: orgId } });
  },

  delete: async (orgId: string, id: string): Promise<void> => {
    await api.delete(`/leases/${id}`, { params: { org_id: orgId } });
  },

  // --- 高级操作 ---

  changeRoom: async (
    orgId: string,
    leaseId: string,
    data: { new_roomId: string; changeDate: string; reason?: string }
  ) => {
    const response = await api.post(`/leases/${leaseId}/change-room`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  renew: async (
    orgId: string,
    leaseId: string,
    data: { newEndDate: string; reason?: string }
  ) => {
    const response = await api.post(`/leases/${leaseId}/renew`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  updateTenant: async (
    orgId: string,
    leaseId: string,
    data: { newTenantId: string }
  ) => {
    const response = await api.post(`/leases/${leaseId}/update-tenant`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  changeRent: async (
    orgId: string,
    leaseId: string,
    data: { newRent: number; effectiveFromYear: number; effectiveFromMonth: number; reason?: string }
  ) => {
    const response = await api.post(`/leases/${leaseId}/change-rent`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  changeUtilityRates: async (
    orgId: string,
    leaseId: string,
    data: { waterRate: number; electricityRate: number; effectiveFromYear: number; effectiveFromMonth: number }
  ) => {
    const response = await api.post(`/leases/${leaseId}/change-utility-rates`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  changeDeposit: async (
    orgId: string,
    leaseId: string,
    data: { newDeposit: number; reason?: string }
  ) => {
    const response = await api.post(`/leases/${leaseId}/change-deposit`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  updateFeeItems: async (
    orgId: string,
    leaseId: string,
    data: { feeItems: Array<{ fee_type_id: string; specification_id?: string; quantity: number }>; effectiveFromYear: number; effectiveFromMonth: number; reason?: string }
  ) => {
    const response = await api.post(`/leases/${leaseId}/update-fee-items`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  settleLease: async (
    orgId: string,
    leaseId: string,
    data: { finalWaterReading?: number; finalElectricityReading?: number; penaltyAmount?: number; remarks?: string }
  ) => {
    const response = await api.post(`/leases/${leaseId}/settle`, data, {
      params: { org_id: orgId },
    });
    return response.data;
  },

  getChangeLogs: async (orgId: string, leaseId: string): Promise<LeaseChangeLog[]> => {
    const response = await api.get<LeaseChangeLog[]>(`/leases/${leaseId}/change-logs`, {
      params: { org_id: orgId },
    });
    return response.data;
  },
};

export default leasesApi;
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/lib/api/leases.ts
git commit -m "feat(leases): 扩展 API 支持高级操作

- changeRoom, renew, updateTenant, changeRent
- changeUtilityRates, changeDeposit, updateFeeItems
- settleLease, getChangeLogs

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Zod Schemas

**Files:**
- Create: `tenant-web/src/features/leases/schemas/lease-operations.schemas.ts`

- [ ] **Step 1: 创建 schemas 文件**

```typescript
import { z } from 'zod';

// 换房
export const changeRoomSchema = z.object({
  new_roomId: z.string().min(1, '请选择目标房间'),
  changeDate: z.string().min(1, '请选择变更日期'),
  reason: z.string().optional(),
});
export type ChangeRoomFormData = z.infer<typeof changeRoomSchema>;

// 续约
export const renewSchema = z.object({
  newEndDate: z.string().min(1, '请选择新结束日期'),
  reason: z.string().optional(),
});
export type RenewFormData = z.infer<typeof renewSchema>;

// 编辑租客
export const updateTenantSchema = z.object({
  newTenantId: z.string().min(1, '请选择新租客'),
});
export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;

// 房租变更
export const changeRentSchema = z.object({
  newRent: z.coerce.number().min(0, '月租不能为负'),
  effectiveFromYear: z.coerce.number().min(2020),
  effectiveFromMonth: z.coerce.number().min(1).max(12),
  reason: z.string().optional(),
});
export type ChangeRentFormData = z.infer<typeof changeRentSchema>;

// 水电单价变更
export const changeUtilityRatesSchema = z.object({
  waterRate: z.coerce.number().min(0, '水价不能为负'),
  electricityRate: z.coerce.number().min(0, '电价不能为负'),
  effectiveFromYear: z.coerce.number().min(2020),
  effectiveFromMonth: z.coerce.number().min(1).max(12),
});
export type ChangeUtilityRatesFormData = z.infer<typeof changeUtilityRatesSchema>;

// 押金变更
export const changeDepositSchema = z.object({
  newDeposit: z.coerce.number().min(0, '押金不能为负'),
  reason: z.string().optional(),
});
export type ChangeDepositFormData = z.infer<typeof changeDepositSchema>;

// 编辑费用项目
export const feeItemRowSchema = z.object({
  fee_type_id: z.string().min(1, '请选择费用类型'),
  specification_id: z.string().optional(),
  quantity: z.coerce.number().min(1, '数量至少为1'),
});

export const updateFeeItemsSchema = z.object({
  feeItems: z.array(feeItemRowSchema).min(1, '至少添加一个费用项目'),
  effectiveFromYear: z.coerce.number().min(2020),
  effectiveFromMonth: z.coerce.number().min(1).max(12),
  reason: z.string().optional(),
});
export type UpdateFeeItemsFormData = z.infer<typeof updateFeeItemsSchema>;

// 退租结算
export const settleLeaseSchema = z.object({
  finalWaterReading: z.coerce.number().min(0).optional(),
  finalElectricityReading: z.coerce.number().min(0).optional(),
  penaltyAmount: z.coerce.number().min(0).optional(),
  remarks: z.string().optional(),
});
export type SettleLeaseFormData = z.infer<typeof settleLeaseSchema>;
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/features/leases/schemas/lease-operations.schemas.ts
git commit -m "feat: 新增租约高级操作 Zod schemas

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: useLeaseOperations Hooks

**Files:**
- Create: `tenant-web/src/features/leases/hooks/use-lease-operations.ts`

- [ ] **Step 1: 创建 hooks 文件**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appToast } from '@apartment-ultra/shared-ui/components/ui';
import { leasesApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error';
import type {
  ChangeRoomFormData,
  RenewFormData,
  UpdateTenantFormData,
  ChangeRentFormData,
  ChangeUtilityRatesFormData,
  ChangeDepositFormData,
  UpdateFeeItemsFormData,
  SettleLeaseFormData,
} from '../schemas/lease-operations.schemas';

export function useLeaseDetail(orgId: string, leaseId: string) {
  return useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(orgId, leaseId),
    enabled: Boolean(orgId) && Boolean(leaseId),
  });
}

export function useLeaseChangeLogs(orgId: string, leaseId: string) {
  return useQuery({
    queryKey: ['lease-change-logs', leaseId],
    queryFn: () => leasesApi.getChangeLogs(orgId, leaseId),
    enabled: Boolean(orgId) && Boolean(leaseId),
  });
}

export function useChangeRoom(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeRoomFormData) =>
      leasesApi.changeRoom(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      appToast.success('换房成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '换房失败')),
  });
}

export function useRenew(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RenewFormData) =>
      leasesApi.renew(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('续约成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '续约失败')),
  });
}

export function useUpdateTenant(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTenantFormData) =>
      leasesApi.updateTenant(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('租客更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新租客失败')),
  });
}

export function useChangeRent(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeRentFormData) =>
      leasesApi.changeRent(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('房租变更成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '变更房租失败')),
  });
}

export function useChangeUtilityRates(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeUtilityRatesFormData) =>
      leasesApi.changeUtilityRates(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('水电单价变更成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '变更水电单价失败')),
  });
}

export function useChangeDeposit(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangeDepositFormData) =>
      leasesApi.changeDeposit(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('押金变更成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '变更押金失败')),
  });
}

export function useUpdateFeeItems(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFeeItemsFormData) =>
      leasesApi.updateFeeItems(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      appToast.success('费用项目更新成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '更新费用项目失败')),
  });
}

export function useSettleLease(orgId: string, leaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SettleLeaseFormData) =>
      leasesApi.settleLease(orgId, leaseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases', orgId] });
      queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['rooms', orgId] });
      appToast.success('退租结算成功');
    },
    onError: (error) => appToast.error(getErrorMessage(error, '退租结算失败')),
  });
}
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/features/leases/hooks/use-lease-operations.ts
git commit -m "feat: 新增租约高级操作 TanStack Query hooks

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 详情页路由入口

**Files:**
- Create: `tenant-web/src/app/leases/[id]/page.tsx`

- [ ] **Step 1: 创建页面路由**

```tsx
'use client';

import { LeaseDetailPage } from '@/features/leases/components/lease-detail-page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaseDetailPageRoute({ params }: PageProps) {
  const { id } = await params;
  return <LeaseDetailPage leaseId={id} />;
}
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/app/leases/[id]/page.tsx
git commit -m "feat: 新增租约详情页路由 /leases/[id]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 详情页主容器

**Files:**
- Create: `tenant-web/src/features/leases/components/lease-detail-page.tsx`

- [ ] **Step 1: 创建主容器组件**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { leasesApi, apartmentsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/context';
import { LeaseDetailTabs } from './lease-detail-tabs';
import { OperationsDropdown } from './operations-dropdown';

interface LeaseDetailPageProps {
  leaseId: string;
}

export function LeaseDetailPage({ leaseId }: LeaseDetailPageProps) {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [activeTab, setActiveTab] = useState<'info' | 'fee-items' | 'history'>('info');

  const { data: lease, isLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(orgId!, leaseId),
    enabled: Boolean(orgId) && Boolean(leaseId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">租约不存在</p>
        <Link href="/leases">
          <Button variant="outline">返回列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-4">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leases">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">租约详情</h1>
            <p className="text-sm text-muted-foreground">
              {lease.room?.apartment?.name} - {lease.room?.room_number}
            </p>
          </div>
        </div>
        {orgId && (
          <OperationsDropdown
            orgId={orgId}
            leaseId={leaseId}
            lease={lease}
          />
        )}
      </div>

      {/* Tab 切换 */}
      <LeaseDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab 内容 */}
      {activeTab === 'info' && <LeaseDetailInfo lease={lease} orgId={orgId!} />}
      {activeTab === 'fee-items' && <LeaseFeeItemsTab leaseId={leaseId} orgId={orgId!} />}
      {activeTab === 'history' && <LeaseChangeHistoryTab leaseId={leaseId} orgId={orgId!} />}
    </div>
  );
}

// 占位导入，后续 Task 会创建
import { LeaseDetailInfo } from './lease-detail-info';
import { LeaseFeeItemsTab } from './lease-fee-items-tab';
import { LeaseChangeHistoryTab } from './lease-change-history-tab';
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/features/leases/components/lease-detail-page.tsx
git commit -m "feat: 租约详情页主容器

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Tab 切换组件

**Files:**
- Create: `tenant-web/src/features/leases/components/lease-detail-tabs.tsx`

- [ ] **Step 1: 创建 Tab 组件**

```tsx
'use client';

import { Tabs, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui/components/ui';

interface LeaseDetailTabsProps {
  activeTab: 'info' | 'fee-items' | 'history';
  onTabChange: (tab: 'info' | 'fee-items' | 'history') => void;
}

export function LeaseDetailTabs({ activeTab, onTabChange }: LeaseDetailTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as typeof activeTab)}>
      <TabsList>
        <TabsTrigger value="info">详情</TabsTrigger>
        <TabsTrigger value="fee-items">费用项目</TabsTrigger>
        <TabsTrigger value="history">变更历史</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/features/leases/components/lease-detail-tabs.tsx
git commit -m "feat: 详情页 Tab 切换组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 详情 Tab

**Files:**
- Create: `tenant-web/src/features/leases/components/lease-detail-info.tsx`

- [ ] **Step 1: 创建详情 Tab 内容**

```tsx
'use client';

import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { formatDate } from '@/lib/date-utils';
import { LEASE_STATUS_CONFIG } from '@/lib/status-config';
import type { Lease } from '@/types';

interface LeaseDetailInfoProps {
  lease: Lease;
  orgId: string;
}

export function LeaseDetailInfo({ lease, orgId }: LeaseDetailInfoProps) {
  const statusConfig = lease.is_active
    ? LEASE_STATUS_CONFIG.active
    : LEASE_STATUS_CONFIG.inactive;

  return (
    <div className="grid gap-4">
      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">公寓</dt>
              <dd className="font-medium">{lease.room?.apartment?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">房间</dt>
              <dd className="font-medium">{lease.room?.room_number || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">租客</dt>
              <dd className="font-medium">{lease.tenant?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">状态</dt>
              <dd>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">开始日期</dt>
              <dd className="font-medium">{formatDate(lease.start_date)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">结束日期</dt>
              <dd className="font-medium">
                {lease.end_date ? formatDate(lease.end_date) : '长期'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">月租</dt>
              <dd className="font-medium">¥{Number(lease.monthly_rent).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">押金</dt>
              <dd className="font-medium">¥{Number(lease.deposit || 0).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">水费单价</dt>
              <dd className="font-medium">
                ¥{Number(lease.water_rate || 0).toLocaleString()}/吨
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">电费单价</dt>
              <dd className="font-medium">
                ¥{Number(lease.electricity_rate || 0).toLocaleString()}/度
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">账单日</dt>
              <dd className="font-medium">每月 {lease.billing_day || 1} 日</dd>
            </div>
            {lease.notes && (
              <div className="col-span-2">
                <dt className="text-sm text-muted-foreground">备注</dt>
                <dd className="font-medium">{lease.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 费用项目摘要 */}
      <Card>
        <CardHeader>
          <CardTitle>费用项目</CardTitle>
        </CardHeader>
        <CardContent>
          {lease.fee_items && lease.fee_items.length > 0 ? (
            <ul className="space-y-2">
              {lease.fee_items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.feeType?.name}
                    {item.specification && ` - ${item.specification.name}`}
                  </span>
                  <span className="text-muted-foreground">
                    × {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">暂无费用项目</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/features/leases/components/lease-detail-info.tsx
git commit -m "feat: 详情 Tab 内容组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: 操作下拉菜单

**Files:**
- Create: `tenant-web/src/features/leases/components/operations-dropdown.tsx`

- [ ] **Step 1: 创建操作下拉菜单**

```tsx
'use client';

import { useState } from 'react';
import type { Lease } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@apartment-ultra/shared-ui/components/ui';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { MoreHorizontal, Home, RefreshCw, User, TrendingUp, Droplets, DollarSign, Layers, LogOut } from 'lucide-react';
import { ChangeRoomSheet } from './operation-sheets/change-room-sheet';
import { RenewSheet } from './operation-sheets/renew-sheet';
import { ChangeRentSheet } from './operation-sheets/change-rent-sheet';
import { ChangeUtilityRatesSheet } from './operation-sheets/change-utility-rates-sheet';
import { UpdateFeeItemsSheet } from './operation-sheets/update-fee-items-sheet';
import { SettleLeaseSheet } from './operation-sheets/settle-lease-sheet';
import { UpdateTenantDialog } from './operation-dialogs/update-tenant-dialog';
import { ChangeDepositDialog } from './operation-dialogs/change-deposit-dialog';

interface OperationsDropdownProps {
  orgId: string;
  leaseId: string;
  lease: Lease;
}

export function OperationsDropdown({ orgId, leaseId, lease }: OperationsDropdownProps) {
  const [openSheet, setOpenSheet] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const isActive = lease.is_active;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            操作
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenSheet('change-room')}>
            <Home className="h-4 w-4 mr-2" />换房
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSheet('renew')}>
            <RefreshCw className="h-4 w-4 mr-2" />续约
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('update-tenant')}>
            <User className="h-4 w-4 mr-2" />编辑租客
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenSheet('change-rent')}>
            <TrendingUp className="h-4 w-4 mr-2" />房租变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSheet('change-utility-rates')}>
            <Droplets className="h-4 w-4 mr-2" />水电单价变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDialog('change-deposit')}>
            <DollarSign className="h-4 w-4 mr-2" />押金变更
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSheet('update-fee-items')}>
            <Layers className="h-4 w-4 mr-2" />编辑费用项目
          </DropdownMenuItem>
          {isActive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenSheet('settle')}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />退租结算
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sheet 组件 */}
      <ChangeRoomSheet
        open={openSheet === 'change-room'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-room' : null)}
        orgId={orgId}
        leaseId={leaseId}
      />
      <RenewSheet
        open={openSheet === 'renew'}
        onOpenChange={(open) => setOpenSheet(open ? 'renew' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentEndDate={lease.end_date}
      />
      <ChangeRentSheet
        open={openSheet === 'change-rent'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-rent' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentRent={Number(lease.monthly_rent)}
      />
      <ChangeUtilityRatesSheet
        open={openSheet === 'change-utility-rates'}
        onOpenChange={(open) => setOpenSheet(open ? 'change-utility-rates' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentWaterRate={Number(lease.water_rate || 0)}
        currentElectricityRate={Number(lease.electricity_rate || 0)}
      />
      <UpdateFeeItemsSheet
        open={openSheet === 'update-fee-items'}
        onOpenChange={(open) => setOpenSheet(open ? 'update-fee-items' : null)}
        orgId={orgId}
        leaseId={leaseId}
      />
      <SettleLeaseSheet
        open={openSheet === 'settle'}
        onOpenChange={(open) => setOpenSheet(open ? 'settle' : null)}
        orgId={orgId}
        leaseId={leaseId}
      />

      {/* Dialog 组件 */}
      <UpdateTenantDialog
        open={openDialog === 'update-tenant'}
        onOpenChange={(open) => setOpenDialog(open ? 'update-tenant' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentTenantId={lease.tenant_id}
      />
      <ChangeDepositDialog
        open={openDialog === 'change-deposit'}
        onOpenChange={(open) => setOpenDialog(open ? 'change-deposit' : null)}
        orgId={orgId}
        leaseId={leaseId}
        currentDeposit={Number(lease.deposit || 0)}
      />
    </>
  );
}
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/features/leases/components/operations-dropdown.tsx
git commit -m "feat: 操作下拉菜单组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Sheet 表单组件（换房/续约）

**Files:**
- Create: `tenant-web/src/features/leases/components/operation-sheets/change-room-sheet.tsx`
- Create: `tenant-web/src/features/leases/components/operation-sheets/renew-sheet.tsx`

- [ ] **Step 1: 创建 change-room-sheet.tsx**

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { changeRoomSchema, type ChangeRoomFormData } from '../../schemas/lease-operations.schemas';
import { useChangeRoom } from '../../hooks/use-lease-operations';
import { roomsApi, apartmentsApi } from '@/lib/api';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Label } from '@apartment-ultra/shared-ui/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@apartment-ultra/shared-ui/components/ui';

interface ChangeRoomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function ChangeRoomSheet({ open, onOpenChange, orgId, leaseId }: ChangeRoomSheetProps) {
  const form = useForm<ChangeRoomFormData>({
    resolver: zodResolver(changeRoomSchema),
    defaultValues: { new_roomId: '', changeDate: '', reason: '' },
  });

  const changeRoom = useChangeRoom(orgId, leaseId);

  const { data: apartments } = useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
    enabled: open,
  });

  const { data: rooms } = useQuery({
    queryKey: ['all-rooms', orgId, apartments?.map((a) => a.id)],
    queryFn: () => roomsApi.listAll(orgId, apartments?.map((a) => a.id) || []),
    enabled: open && !!apartments,
  });

  const availableRooms = rooms?.filter((r) => r.status === 'available') || [];

  const onSubmit = (data: ChangeRoomFormData) => {
    changeRoom.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>换房</SheetTitle>
          <SheetDescription>将租约切换到其他房间</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="new_roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>目标房间 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择目标房间" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.apartment?.name} - {room.room_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="changeDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>变更日期 *</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      mode="date"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="选择变更日期"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原因备注</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="可选" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={changeRoom.isPending}>
                {changeRoom.isPending ? '提交中...' : '确认换房'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 创建 renew-sheet.tsx**

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { renewSchema, type RenewFormData } from '../../schemas/lease-operations.schemas';
import { useRenew } from '../../hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { DateTimePicker } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';

interface RenewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentEndDate?: string | null;
}

export function RenewSheet({ open, onOpenChange, orgId, leaseId, currentEndDate }: RenewSheetProps) {
  const form = useForm<RenewFormData>({
    resolver: zodResolver(renewSchema),
    defaultValues: { newEndDate: '', reason: '' },
  });

  const renew = useRenew(orgId, leaseId);

  const onSubmit = (data: RenewFormData) => {
    renew.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>续约</SheetTitle>
          <SheetDescription>
            当前结束日期：{currentEndDate ? new Date(currentEndDate).toLocaleDateString() : '长期'}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="newEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新结束日期 *</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      mode="date"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="选择新结束日期"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原因备注</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="可选" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={renew.isPending}>
                {renew.isPending ? '提交中...' : '确认续约'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd tenant-web
git add src/features/leases/components/operation-sheets/change-room-sheet.tsx
git add src/features/leases/components/operation-sheets/renew-sheet.tsx
git commit -m "feat: 换房和续约 Sheet 表单组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Sheet 表单组件（房租变更/水电单价变更）

**Files:**
- Create: `tenant-web/src/features/leases/components/operation-sheets/change-rent-sheet.tsx`
- Create: `tenant-web/src/features/leases/components/operation-sheets/change-utility-rates-sheet.tsx`

- [ ] **Step 1: 创建 change-rent-sheet.tsx**

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeRentSchema, type ChangeRentFormData } from '../../schemas/lease-operations.schemas';
import { useChangeRent } from '../../hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@apartment-ultra/shared-ui/components/ui';

interface ChangeRentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentRent: number;
}

export function ChangeRentSheet({ open, onOpenChange, orgId, leaseId, currentRent }: ChangeRentSheetProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const form = useForm<ChangeRentFormData>({
    resolver: zodResolver(changeRentSchema),
    defaultValues: {
      newRent: currentRent,
      effectiveFromYear: currentYear,
      effectiveFromMonth: currentMonth,
      reason: '',
    },
  });

  const changeRent = useChangeRent(orgId, leaseId);

  const onSubmit = (data: ChangeRentFormData) => {
    changeRent.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>房租变更</SheetTitle>
          <SheetDescription>当前月租：¥{currentRent.toLocaleString()}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="newRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新月租 (元) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveFromYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生效年份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveFromMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生效月份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={String(m)}>{m} 月</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原因备注</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="可选" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={changeRent.isPending}>
                {changeRent.isPending ? '提交中...' : '确认变更'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 创建 change-utility-rates-sheet.tsx**

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeUtilityRatesSchema, type ChangeUtilityRatesFormData } from '../../schemas/lease-operations.schemas';
import { useChangeUtilityRates } from '../../hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@apartment-ultra/shared-ui/components/ui';

interface ChangeUtilityRatesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentWaterRate: number;
  currentElectricityRate: number;
}

export function ChangeUtilityRatesSheet({
  open,
  onOpenChange,
  orgId,
  leaseId,
  currentWaterRate,
  currentElectricityRate,
}: ChangeUtilityRatesSheetProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const form = useForm<ChangeUtilityRatesFormData>({
    resolver: zodResolver(changeUtilityRatesSchema),
    defaultValues: {
      waterRate: currentWaterRate,
      electricityRate: currentElectricityRate,
      effectiveFromYear: currentYear,
      effectiveFromMonth: currentMonth,
    },
  });

  const changeUtilityRates = useChangeUtilityRates(orgId, leaseId);

  const onSubmit = (data: ChangeUtilityRatesFormData) => {
    changeUtilityRates.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>水电单价变更</SheetTitle>
          <SheetDescription>
            当前：水 ¥{currentWaterRate}/吨 · 电 ¥{currentElectricityRate}/度
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="waterRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新水价 (元/吨) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="electricityRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新电价 (元/度) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveFromYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生效年份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveFromMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生效月份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={String(m)}>{m} 月</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={changeUtilityRates.isPending}>
                {changeUtilityRates.isPending ? '提交中...' : '确认变更'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd tenant-web
git add src/features/leases/components/operation-sheets/change-rent-sheet.tsx
git add src/features/leases/components/operation-sheets/change-utility-rates-sheet.tsx
git commit -m "feat: 房租变更和水电单价变更 Sheet 表单

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Sheet 表单组件（编辑费用项目/退租结算）

**Files:**
- Create: `tenant-web/src/features/leases/components/operation-sheets/update-fee-items-sheet.tsx`
- Create: `tenant-web/src/features/leases/components/operation-sheets/settle-lease-sheet.tsx`

- [ ] **Step 1: 创建 update-fee-items-sheet.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { updateFeeItemsSchema, type UpdateFeeItemsFormData } from '../../schemas/lease-operations.schemas';
import { useUpdateFeeItems } from '../../hooks/use-lease-operations';
import { feeTypesApi } from '@/lib/api';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@apartment-ultra/shared-ui/components/ui';
import { Plus, Trash2 } from 'lucide-react';

interface UpdateFeeItemsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function UpdateFeeItemsSheet({ open, onOpenChange, orgId, leaseId }: UpdateFeeItemsSheetProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const form = useForm<UpdateFeeItemsFormData>({
    resolver: zodResolver(updateFeeItemsSchema),
    defaultValues: {
      feeItems: [{ fee_type_id: '', specification_id: '', quantity: 1 }],
      effectiveFromYear: currentYear,
      effectiveFromMonth: currentMonth,
      reason: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'feeItems',
  });

  const updateFeeItems = useUpdateFeeItems(orgId, leaseId);

  const { data: feeTypes } = useQuery({
    queryKey: ['fee-types', orgId],
    queryFn: () => feeTypesApi.list(orgId),
    enabled: open,
  });

  const onSubmit = (data: UpdateFeeItemsFormData) => {
    updateFeeItems.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>编辑费用项目</SheetTitle>
          <SheetDescription>设置租约的费用项目，生效后从指定账期开始计费</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* 费用项目列表 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <FormLabel>费用项目</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ fee_type_id: '', specification_id: '', quantity: 1 })}
                >
                  <Plus className="h-4 w-4 mr-1" /> 添加
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`feeItems.${index}.fee_type_id`}
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="费用类型" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {feeTypes?.map((ft) => (
                                <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`feeItems.${index}.specification_id`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="规格（可选）" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">无</SelectItem>
                                {feeTypes
                                  ?.find((ft) => ft.id === form.watch(`feeItems.${index}.fee_type_id`))
                                  ?.specifications?.filter((s) => s.is_active)
                                  .map((spec) => (
                                    <SelectItem key={spec.id} value={spec.id}>
                                      {spec.name} (¥{spec.price_monthly}/月)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`feeItems.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" min="1" {...field} placeholder="数量" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* 生效期 */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effectiveFromYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生效年份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="effectiveFromMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生效月份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={String(m)}>{m} 月</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原因备注</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="可选" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateFeeItems.isPending}>
                {updateFeeItems.isPending ? '提交中...' : '确认更新'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: 创建 settle-lease-sheet.tsx**

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settleLeaseSchema, type SettleLeaseFormData } from '../../schemas/lease-operations.schemas';
import { useSettleLease } from '../../hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Alert, AlertDescription } from '@apartment-ultra/shared-ui/components/ui';
import { AlertTriangle } from 'lucide-react';

interface SettleLeaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
}

export function SettleLeaseSheet({ open, onOpenChange, orgId, leaseId }: SettleLeaseSheetProps) {
  const form = useForm<SettleLeaseFormData>({
    resolver: zodResolver(settleLeaseSchema),
    defaultValues: {
      finalWaterReading: undefined,
      finalElectricityReading: undefined,
      penaltyAmount: undefined,
      remarks: '',
    },
  });

  const settleLease = useSettleLease(orgId, leaseId);
  const watchForm = form.watch();

  const onSubmit = (data: SettleLeaseFormData) => {
    settleLease.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>退租结算</SheetTitle>
          <SheetDescription>完成租约的最终结算，包括最后一期账单和押金处理</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                退租结算后，租约将自动终止，房间将变为空置状态
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="finalWaterReading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最终水表读数</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="请输入" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="finalElectricityReading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最终电表读数</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} placeholder="请输入" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="penaltyAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>违约金金额</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} placeholder="如有违约金请输入" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="可选备注" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 结算预览 */}
            {(watchForm.finalWaterReading !== undefined || watchForm.finalElectricityReading !== undefined) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">结算预览</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最终水表读数</span>
                    <span>{watchForm.finalWaterReading ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最终电表读数</span>
                    <span>{watchForm.finalElectricityReading ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">违约金</span>
                    <span>¥{(watchForm.penaltyAmount || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={settleLease.isPending} variant="destructive">
                {settleLease.isPending ? '处理中...' : '确认退租结算'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd tenant-web
git add src/features/leases/components/operation-sheets/update-fee-items-sheet.tsx
git add src/features/leases/components/operation-sheets/settle-lease-sheet.tsx
git commit -m "feat: 编辑费用项目和退租结算 Sheet 表单

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Dialog 组件（编辑租客/押金变更）

**Files:**
- Create: `tenant-web/src/features/leases/components/operation-dialogs/update-tenant-dialog.tsx`
- Create: `tenant-web/src/features/leases/components/operation-dialogs/change-deposit-dialog.tsx`

- [ ] **Step 1: 创建 update-tenant-dialog.tsx**

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { updateTenantSchema, type UpdateTenantFormData } from '../../schemas/lease-operations.schemas';
import { useUpdateTenant } from '../../hooks/use-lease-operations';
import { tenantsApi } from '@/lib/api';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@apartment-ultra/shared-ui/components/ui';

interface UpdateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentTenantId?: string | null;
}

export function UpdateTenantDialog({ open, onOpenChange, orgId, leaseId, currentTenantId }: UpdateTenantDialogProps) {
  const form = useForm<UpdateTenantFormData>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: { newTenantId: '' },
  });

  const updateTenant = useUpdateTenant(orgId, leaseId);

  const { data: tenants } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(orgId),
    enabled: open,
  });

  const onSubmit = (data: UpdateTenantFormData) => {
    updateTenant.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑租客</DialogTitle>
          <DialogDescription>将租约的租客更换为其他已存在的租客</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newTenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新租客 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择新租客" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants?.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} {tenant.phone && `(${tenant.phone})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateTenant.isPending}>
                {updateTenant.isPending ? '提交中...' : '确认更换'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: 创建 change-deposit-dialog.tsx**

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeDepositSchema, type ChangeDepositFormData } from '../../schemas/lease-operations.schemas';
import { useChangeDeposit } from '../../hooks/use-lease-operations';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@apartment-ultra/shared-ui/components/ui';
import { Input } from '@apartment-ultra/shared-ui/components/ui';

interface ChangeDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  leaseId: string;
  currentDeposit: number;
}

export function ChangeDepositDialog({ open, onOpenChange, orgId, leaseId, currentDeposit }: ChangeDepositDialogProps) {
  const form = useForm<ChangeDepositFormData>({
    resolver: zodResolver(changeDepositSchema),
    defaultValues: { newDeposit: currentDeposit, reason: '' },
  });

  const changeDeposit = useChangeDeposit(orgId, leaseId);

  const onSubmit = (data: ChangeDepositFormData) => {
    changeDeposit.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>押金变更</DialogTitle>
          <DialogDescription>当前押金：¥{currentDeposit.toLocaleString()}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新押金 (元) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>原因备注</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="可选" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={changeDeposit.isPending}>
                {changeDeposit.isPending ? '提交中...' : '确认变更'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd tenant-web
git add src/features/leases/components/operation-dialogs/update-tenant-dialog.tsx
git add src/features/leases/components/operation-dialogs/change-deposit-dialog.tsx
git commit -m "feat: 编辑租客和押金变更 Dialog 组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 13: 变更历史 Tab

**Files:**
- Create: `tenant-web/src/features/leases/components/lease-change-history-tab.tsx`
- Create: `tenant-web/src/features/leases/components/lease-change-logs.tsx`

- [ ] **Step 1: 创建 lease-change-logs.tsx（时间线组件）**

```tsx
'use client';

import { formatDate } from '@/lib/date-utils';
import type { LeaseChangeLog } from '@/lib/api/leases';
import { Badge } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent } from '@apartment-ultra/shared-ui/components/ui';
import { ArrowRight, Calendar, User } from 'lucide-react';

const CHANGE_TYPE_LABELS: Record<string, string> = {
  room_change: '换房',
  renew: '续约',
  update_tenant: '编辑租客',
  rent_change: '房租变更',
  utility_rate_change: '水电单价变更',
  deposit_change: '押金变更',
  fee_items_change: '费用项目变更',
  settle: '退租结算',
};

const CHANGE_TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  room_change: 'secondary',
  renew: 'secondary',
  update_tenant: 'outline',
  rent_change: 'default',
  utility_rate_change: 'default',
  deposit_change: 'outline',
  fee_items_change: 'default',
  settle: 'destructive',
};

interface LeaseChangeLogsProps {
  logs: LeaseChangeLog[];
}

export function LeaseChangeLogs({ logs }: LeaseChangeLogsProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <p>暂无变更记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={CHANGE_TYPE_VARIANTS[log.change_type] || 'default'}>
                    {CHANGE_TYPE_LABELS[log.change_type] || log.change_type}
                  </Badge>
                  {log.effective_from_year && log.effective_from_month && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {log.effective_from_year} 年 {log.effective_from_month} 月生效
                    </span>
                  )}
                </div>

                {/* 变更内容 */}
                {log.old_value && log.new_value && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {JSON.stringify(log.old_value)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground font-mono bg-muted px-2 py-1 rounded">
                      {JSON.stringify(log.new_value)}
                    </span>
                  </div>
                )}

                {log.reason && (
                  <p className="text-sm text-muted-foreground">原因：{log.reason}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.created_by || '系统'}
                  </span>
                  <span>{formatDate(log.created_at)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 创建 lease-change-history-tab.tsx**

```tsx
'use client';

import { useLeaseChangeLogs } from '../hooks/use-lease-operations';
import { LeaseChangeLogs } from './lease-change-logs';
import { Loader2 } from 'lucide-react';

interface LeaseChangeHistoryTabProps {
  leaseId: string;
  orgId: string;
}

export function LeaseChangeHistoryTab({ leaseId, orgId }: LeaseChangeHistoryTabProps) {
  const { data: logs, isLoading } = useLeaseChangeLogs(orgId, leaseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <LeaseChangeLogs logs={logs || []} />
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
cd tenant-web
git add src/features/leases/components/lease-change-history-tab.tsx
git add src/features/leases/components/lease-change-logs.tsx
git commit -m "feat: 变更历史 Tab 和时间线组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 14: 费用项目 Tab

**Files:**
- Create: `tenant-web/src/features/leases/components/lease-fee-items-tab.tsx`

- [ ] **Step 1: 创建费用项目 Tab**

```tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leasesApi } from '@/lib/api';
import { Button } from '@apartment-ultra/shared-ui/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@apartment-ultra/shared-ui/components/ui';
import { Loader2, Pencil } from 'lucide-react';
import { UpdateFeeItemsSheet } from './operation-sheets/update-fee-items-sheet';

interface LeaseFeeItemsTabProps {
  leaseId: string;
  orgId: string;
}

export function LeaseFeeItemsTab({ leaseId, orgId }: LeaseFeeItemsTabProps) {
  const [openSheet, setOpenSheet] = useState(false);

  const { data: lease, isLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => leasesApi.get(orgId, leaseId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const feeItems = lease?.fee_items || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">费用项目</h2>
        <Button variant="outline" size="sm" onClick={() => setOpenSheet(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          编辑
        </Button>
      </div>

      {feeItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>暂无费用项目</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">费用明细</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 font-medium">费用类型</th>
                  <th className="pb-2 font-medium">规格</th>
                  <th className="pb-2 font-medium text-right">单价</th>
                  <th className="pb-2 font-medium text-right">数量</th>
                  <th className="pb-2 font-medium text-right">小计</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.feeType?.name || '-'}</td>
                    <td className="py-2 text-muted-foreground">
                      {item.specification?.name || '-'}
                    </td>
                    <td className="py-2 text-right">
                      ¥{item.specification?.price_monthly?.toLocaleString() || 0}
                    </td>
                    <td className="py-2 text-right">× {item.quantity}</td>
                    <td className="py-2 text-right font-medium">
                      ¥{((item.specification?.price_monthly || 0) * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <UpdateFeeItemsSheet
        open={openSheet}
        onOpenChange={setOpenSheet}
        orgId={orgId}
        leaseId={leaseId}
      />
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/features/leases/components/lease-fee-items-tab.tsx
git commit -m "feat: 费用项目 Tab 组件

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 15: 列表页跳转链接改造

**Files:**
- Modify: `tenant-web/src/features/leases/leases.columns.tsx`

- [ ] **Step 1: 修改列表列定义，点击房间列跳转到详情页**

在文件顶部添加 Link 导入，在房间列的 cell 中添加 Link 包装：

```typescript
import Link from 'next/link';
```

在 `accessorKey: 'room'` 的 cell 中，将房间信息包裹为链接：

```tsx
cell: ({ row }) => {
  const room = row.original.room;
  if (!room) {
    return '-';
  }
  return (
    <Link
      href={`/leases/${row.original.id}`}
      className="flex flex-col hover:underline"
    >
      {room.apartment && (
        <span className="text-xs text-muted-foreground">
          {room.apartment.name}
        </span>
      )}
      <span>{room.room_number}</span>
    </Link>
  );
},
```

- [ ] **Step 2: 提交**

```bash
cd tenant-web
git add src/features/leases/leases.columns.tsx
git commit -m "feat: 租约列表房间列添加详情页跳转链接

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 16: 类型补充与缺失导入修复

**Files:**
- 检查并修复所有 import 路径和类型

- [ ] **Step 1: 确认 apartmentsApi.listAll 是否存在**（如果 `roomsApi.listAll` 需要 apartmentIds 参数）

```bash
grep -r "apartmentsApi" tenant-web/src --include="*.ts" --include="*.tsx" | head -5
```

确认 `apartmentsApi.list(orgId)` 返回公寓列表用于获取 apartmentIds。

- [ ] **Step 2: 检查 formatDate 函数是否存在**

```bash
grep -r "export.*formatDate\|export function format" tenant-web/src/lib/date-utils --include="*.ts"
```

如果 `formatDate` 不存在，将 `lease-change-logs.tsx` 中的 `format(log.created_at)` 改为使用 `new Date(log.created_at).toLocaleString()` 或其他已有的日期格式化方法。

- [ ] **Step 3: 修复 Task 5 中可能缺失的 useAuth import**

确保 `lease-detail-page.tsx` 导入了 `useAuth` from `@/lib/auth/context`。

- [ ] **Step 4: 提交修复**

```bash
git add <修复的文件>
git commit -m "fix: 补充缺失的类型和导入

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 17: 集成测试

- [ ] **Step 1: 启动开发服务器**

```bash
cd tenant-web
pnpm dev:web
```

- [ ] **Step 2: 访问租约列表页，点击任意租约的房间列，验证跳转到详情页**

- [ ] **Step 3: 验证 Tab 切换正常**

- [ ] **Step 4: 验证各操作 Sheet/Dialog 正常打开和提交**

---

## 实施顺序

1. Task 1 — API 层扩展
2. Task 2 — Zod schemas
3. Task 3 — useLeaseOperations hooks
4. Task 4 — 详情页路由入口
5. Task 5 — 详情页主容器
6. Task 6 — Tab 切换组件
7. Task 7 — 详情 Tab
8. Task 8 — 操作下拉菜单
9. Task 9 — Sheet 表单（换房/续约）
10. Task 10 — Sheet 表单（房租变更/水电单价变更）
11. Task 11 — Sheet 表单（编辑费用项目/退租结算）
12. Task 12 — Dialog 组件（编辑租客/押金变更）
13. Task 13 — 变更历史 Tab
14. Task 14 — 费用项目 Tab
15. Task 15 — 列表页跳转链接改造
16. Task 16 — 类型补充与缺失导入修复
17. Task 17 — 集成测试
