# 租约高级操作 API 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现租约高级操作接口（换房/续约/退租结算等），补齐费用项目管理，建立变更历史与生效期机制

**Architecture:** 新增 `LeaseFeeItem` 和 `LeaseChangeLog` 两张表；限制 `PUT /leases/:id` 只能改 `billing_day` 和 `notes`；新增 7 个专门���口处理租约变更；改造账单生成逻辑支持生效期；新增定时任务应用未来变更

**Tech Stack:** Node.js, TypeScript, Express, Prisma, PostgreSQL

---

## 文件结构

### 新增文件
- `api/prisma/migrations/YYYYMMDDHHMMSS_add_lease_fee_item_and_change_log/migration.sql` — 数据库迁移
- `api/src/repositories/leaseFeeItem.repo.ts` — LeaseFeeItem 仓储
- `api/src/repositories/leaseChangeLog.repo.ts` — LeaseChangeLog 仓储
- `api/src/services/leaseChangeLog.service.ts` — 变更日志服务
- `api/src/services/leaseSettlement.service.ts` — 退租结算服务
- `api/src/scheduler/applyLeaseChanges.ts` — 定时任务：应用租约变更

### 修改文件
- `api/prisma/schema.prisma` — 新增两个模型
- `api/src/services/lease.service.ts` — 限制 update + 新增 7 个操作
- `api/src/services/billGeneration.ts` — 支持生效期查询
- `api/src/routes/v1/leases.ts` — 新增路由
- `api/src/scheduler/index.ts` — 注册新定时任务

---

## Task 1: 数据模型 — LeaseFeeItem 和 LeaseChangeLog

**Files:**
- Modify: `api/prisma/schema.prisma`

- [ ] **Step 1: 在 schema.prisma 中新增 LeaseFeeItem 模型**

在 `Lease` 模型后添加：

```prisma
model LeaseFeeItem {
  id               String   @id @db.VarChar(26)
  lease_id         String   @db.VarChar(26)
  fee_type_id      String   @db.VarChar(26)
  specification_id String?  @db.VarChar(26)
  quantity         Decimal  @default(1) @db.Decimal(10, 2)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  lease         Lease             @relation(fields: [lease_id], references: [id], onDelete: Cascade)
  feeType       FeeType           @relation(fields: [fee_type_id], references: [id])
  specification FeeSpecification? @relation(fields: [specification_id], references: [id], onDelete: SetNull)

  @@index([lease_id])
  @@map("lease_fee_items")
}
```

- [ ] **Step 2: 在 schema.prisma 中新增 LeaseChangeLog 模型**

在 `LeaseFeeItem` 模型后添加：

```prisma
model LeaseChangeLog {
  id                   String   @id @db.VarChar(26)
  lease_id             String   @db.VarChar(26)
  change_type          String   @db.VarChar(50)
  old_value            Json?
  new_value            Json?
  effective_from_year  Int?
  effective_from_month Int?
  reason               String?  @db.VarChar(500)
  created_by           String?  @db.VarChar(26)
  created_at           DateTime @default(now())

  lease Lease @relation(fields: [lease_id], references: [id], onDelete: Cascade)

  @@index([lease_id, created_at])
  @@index([effective_from_year, effective_from_month])
  @@map("lease_change_logs")
}
```

- [ ] **Step 3: 在 Lease 模型中添加关联**

在 `Lease` 模型中添加：

```prisma
model Lease {
  // ... 现有字段
  fee_items    LeaseFeeItem[]
  change_logs  LeaseChangeLog[]
}
```

- [ ] **Step 4: 在 FeeType 和 FeeSpecification 模型中添加关联**

在 `FeeType` 模型中添加：

```prisma
model FeeType {
  // ... 现有字段
  lease_fee_items LeaseFeeItem[]
}
```

在 `FeeSpecification` 模型中添加：

```prisma
model FeeSpecification {
  // ... 现有字段
  lease_fee_items LeaseFeeItem[]
}
```

- [ ] **Step 5: 生成并应用迁移**

Run:
```bash
cd api
pnpm exec prisma migrate dev --name add_lease_fee_item_and_change_log
```

Expected: 迁移文件生成并应用成功

- [ ] **Step 6: 提交**

```bash
git add api/prisma/schema.prisma api/prisma/migrations
git commit -m "feat: 新增 LeaseFeeItem 和 LeaseChangeLog 数据模型

- LeaseFeeItem: 租约费用项目
- LeaseChangeLog: 租约变更历史
- 关联到 Lease, FeeType, FeeSpecification

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: LeaseFeeItem 仓储层

**Files:**
- Create: `api/src/repositories/leaseFeeItem.repo.ts`

- [ ] **Step 1: 创建 leaseFeeItem.repo.ts**

```typescript
import type { LeaseFeeItem, Prisma, PrismaClient } from '@prisma/client';

export type LeaseFeeItemWithDetails = LeaseFeeItem & {
  feeType: { id: string; name: string; code: string };
  specification: { id: string; name: string; price_monthly: number } | null;
};

export interface LeaseFeeItemRepository {
  findByLeaseId(leaseId: string): Promise<LeaseFeeItemWithDetails[]>;
  createMany(data: Prisma.LeaseFeeItemCreateManyInput[]): Promise<number>;
  deleteByLeaseId(leaseId: string): Promise<number>;
}

export function createLeaseFeeItemRepository(
  prisma: PrismaClient | Prisma.TransactionClient
): LeaseFeeItemRepository {
  return {
    findByLeaseId: async (leaseId: string) => {
      return prisma.leaseFeeItem.findMany({
        where: { lease_id: leaseId },
        include: {
          feeType: { select: { id: true, name: true, code: true } },
          specification: { select: { id: true, name: true, price_monthly: true } },
        },
        orderBy: { created_at: 'asc' },
      });
    },

    createMany: async (data: Prisma.LeaseFeeItemCreateManyInput[]) => {
      const result = await prisma.leaseFeeItem.createMany({ data });
      return result.count;
    },

    deleteByLeaseId: async (leaseId: string) => {
      const result = await prisma.leaseFeeItem.deleteMany({ where: { lease_id: leaseId } });
      return result.count;
    },
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add api/src/repositories/leaseFeeItem.repo.ts
git commit -m "feat: 新增 LeaseFeeItem 仓储层

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: LeaseChangeLog 仓储层

**Files:**
- Create: `api/src/repositories/leaseChangeLog.repo.ts`

- [ ] **Step 1: 创建 leaseChangeLog.repo.ts**

```typescript
import type { LeaseChangeLog, Prisma, PrismaClient } from '@prisma/client';

export interface LeaseChangeLogRepository {
  findByLeaseId(leaseId: string): Promise<LeaseChangeLog[]>;
  create(data: Prisma.LeaseChangeLogCreateInput): Promise<LeaseChangeLog>;
  findPendingChanges(year: number, month: number): Promise<LeaseChangeLog[]>;
}

export function createLeaseChangeLogRepository(
  prisma: PrismaClient | Prisma.TransactionClient
): LeaseChangeLogRepository {
  return {
    findByLeaseId: async (leaseId: string) => {
      return prisma.leaseChangeLog.findMany({
        where: { lease_id: leaseId },
        orderBy: { created_at: 'desc' },
      });
    },

    create: async (data: Prisma.LeaseChangeLogCreateInput) => {
      return prisma.leaseChangeLog.create({ data });
    },

    findPendingChanges: async (year: number, month: number) => {
      return prisma.leaseChangeLog.findMany({
        where: {
          effective_from_year: year,
          effective_from_month: month,
        },
        orderBy: [{ lease_id: 'asc' }, { created_at: 'asc' }],
      });
    },
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add api/src/repositories/leaseChangeLog.repo.ts
git commit -m "feat: 新增 LeaseChangeLog 仓储层

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 变更日志服务层

**Files:**
- Create: `api/src/services/leaseChangeLog.service.ts`

- [ ] **Step 1: 创建 leaseChangeLog.service.ts（前50行）**

```typescript
import type { LeaseChangeLog } from '@prisma/client';
import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import {
  createLeaseChangeLogRepository,
  type LeaseChangeLogRepository,
} from '../repositories/leaseChangeLog.repo.js';

export interface CreateChangeLogInput {
  lease_id: string;
  change_type: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  effective_from_year?: number;
  effective_from_month?: number;
  reason?: string;
  created_by?: string;
}

export interface LeaseChangeLogService {
  list(leaseId: string): Promise<LeaseChangeLog[]>;
  create(data: CreateChangeLogInput): Promise<LeaseChangeLog>;
}

export function createLeaseChangeLogService(
  getRepo: () => LeaseChangeLogRepository = () => createLeaseChangeLogRepository(prisma)
): LeaseChangeLogService {
  return {
    list: async (leaseId: string) => {
      return getRepo().findByLeaseId(leaseId);
    },

    create: async (data: CreateChangeLogInput) => {
      return getRepo().create({
        id: ulid().toLowerCase(),
        lease: { connect: { id: data.lease_id } },
        change_type: data.change_type,
        old_value: data.old_value ?? null,
        new_value: data.new_value ?? null,
        effective_from_year: data.effective_from_year ?? null,
        effective_from_month: data.effective_from_month ?? null,
        reason: data.reason ?? null,
        created_by: data.created_by ?? null,
      });
    },
  };
}

export const defaultLeaseChangeLogService = createLeaseChangeLogService();
```

- [ ] **Step 2: 提交**

```bash
git add api/src/services/leaseChangeLog.service.ts
git commit -m "feat: 新增变更日志服务层

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 限制 PUT /leases/:id

**Files:**
- Modify: `api/src/services/lease.service.ts:85-100`

- [ ] **Step 1: 在 lease.service.ts 的 update 方法中添加白名单校验**

找到 `buildUpdateData` 函数，替换为：

```typescript
function buildUpdateData(data: UpdateLeaseInput): Prisma.LeaseUpdateInput {
  const updateData: Prisma.LeaseUpdateInput = {};

  // 白名单：只允许修改 billing_day 和 notes
  const restrictedFields = [
    'room_id', 'tenant_id', 'start_date', 'end_date',
    'monthly_rent', 'deposit', 'water_rate', 'electricity_rate'
  ];

  for (const field of restrictedFields) {
    if (field in data && (data as any)[field] !== undefined) {
      throw createAppError(400, `字段 ${field} 需通过专门操作修改`);
    }
  }

  if (data.billing_day != null) updateData.billing_day = data.billing_day;
  if (data.notes !== undefined) updateData.notes = data.notes;

  return updateData;
}
```

- [ ] **Step 2: 提交**

```bash
git add api/src/services/lease.service.ts
git commit -m "feat: 限制 PUT /leases/:id 只能改 billing_day 和 notes

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 换房接口

**Files:**
- Modify: `api/src/services/lease.service.ts`

- [ ] **Step 1: 在 LeaseService 接口中添加 changeRoom 方法**

在 `LeaseService` 接口中添加：

```typescript
export interface LeaseService {
  // ... 现有方法
  changeRoom(
    orgId: string,
    leaseId: string,
    newRoomId: string,
    changeDate: string,
    reason?: string
  ): Promise<{ lease_id: string; old_room_id: string; new_room_id: string; changed_at: string }>;
}
```

- [ ] **Step 2: 在 createLeaseService 中实现 changeRoom**

在 `createLeaseService` 返回对象中添加：

```typescript
changeRoom: async (orgId: string, leaseId: string, newRoomId: string, changeDate: string, reason?: string) => {
  const lease = await getRepo().findByIdWithRelations(leaseId);
  if (!lease || lease.room.apartment.organization_id !== orgId) {
    throw createAppError(404, NotFoundMessages.LEASE);
  }

  const newRoom = await prisma.room.findFirst({
    where: { id: newRoomId },
    include: { apartment: true },
  });
  if (!newRoom || newRoom.apartment.organization_id !== orgId) {
    throw createAppError(404, '目标房间不存在');
  }
  if (newRoom.status !== 'available') {
    throw createAppError(400, '目标房间不可用，请选择其他房间');
  }

  const oldRoomId = lease.room_id;

  await prisma.$transaction(async (tx) => {
    // 1. 新房间改为 occupied
    await tx.room.update({ where: { id: newRoomId }, data: { status: 'occupied' } });
    // 2. 原房间改为 available
    await tx.room.update({ where: { id: oldRoomId }, data: { status: 'available' } });
    // 3. 更新租约
    await tx.lease.update({ where: { id: leaseId }, data: { room_id: newRoomId } });
    // 4. 记录变更日志
    await tx.leaseChangeLog.create({
      data: {
        id: ulid().toLowerCase(),
        lease_id: leaseId,
        change_type: 'room_change',
        old_value: { room_id: oldRoomId },
        new_value: { room_id: newRoomId },
        reason,
      },
    });
  });

  return {
    lease_id: leaseId,
    old_room_id: oldRoomId,
    new_room_id: newRoomId,
    changed_at: changeDate,
  };
},
```

- [ ] **Step 3: 提交**

```bash
git add api/src/services/lease.service.ts
git commit -m "feat: 新增换房接口

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: 续约接口

**Files:**
- Modify: `api/src/services/lease.service.ts`

- [ ] **Step 1: 在 LeaseService 接口中添加 renew 方法**

```typescript
export interface LeaseService {
  // ... 现有方法
  renew(
    orgId: string,
    leaseId: string,
    newEndDate: string,
    reason?: string
  ): Promise<{ lease_id: string; old_end_date: string; new_end_date: string; renewed_at: string }>;
}
```

- [ ] **Step 2: 在 createLeaseService 中实现 renew**

```typescript
renew: async (orgId: string, leaseId: string, newEndDate: string, reason?: string) => {
  const lease = await getRepo().findByIdWithRelations(leaseId);
  if (!lease || lease.room.apartment.organization_id !== orgId) {
    throw createAppError(404, NotFoundMessages.LEASE);
  }

  const newEnd = new Date(newEndDate);
  const currentEnd = lease.end_date ? new Date(lease.end_date) : null;
  if (currentEnd && newEnd <= currentEnd) {
    throw createAppError(400, '续约日期必须晚于当前租约结束日期');
  }

  const oldEndDate = lease.end_date ? lease.end_date.toISOString().slice(0, 10) : null;

  await prisma.$transaction(async (tx) => {
    await tx.lease.update({ where: { id: leaseId }, data: { end_date: newEnd } });
    await tx.leaseChangeLog.create({
      data: {
        id: ulid().toLowerCase(),
        lease_id: leaseId,
        change_type: 'renew',
        old_value: { end_date: oldEndDate },
        new_value: { end_date: newEndDate },
        reason,
      },
    });
  });

  return {
    lease_id: leaseId,
    old_end_date: oldEndDate ?? '',
    new_end_date: newEndDate,
    renewed_at: new Date().toISOString(),
  };
},
```

- [ ] **Step 3: 提交**

```bash
git add api/src/services/lease.service.ts
git commit -m "feat: 新增续约接口

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 编辑租客信息接口

**Files:**
- Modify: `api/src/services/lease.service.ts`

- [ ] **Step 1: 在 LeaseService 接口中添加 updateTenant 方法**

```typescript
export interface LeaseService {
  // ... 现有方法
  updateTenant(
    orgId: string,
    leaseId: string,
    newTenantId: string
  ): Promise<{ lease_id: string; old_tenant_id: string; new_tenant_id: string; updated_at: string }>;
}
```

- [ ] **Step 2: 在 createLeaseService 中实现 updateTenant**

```typescript
updateTenant: async (orgId: string, leaseId: string, newTenantId: string) => {
  const lease = await getRepo().findByIdWithRelations(leaseId);
  if (!lease || lease.room.apartment.organization_id !== orgId) {
    throw createAppError(404, NotFoundMessages.LEASE);
  }

  const newTenant = await prisma.tenant.findFirst({
    where: { id: newTenantId, organization_id: orgId },
  });
  if (!newTenant) {
    throw createAppError(404, '租客不存在');
  }

  const oldTenantId = lease.tenant_id;

  await prisma.$transaction(async (tx) => {
    await tx.lease.update({ where: { id: leaseId }, data: { tenant_id: newTenantId } });
    await tx.leaseChangeLog.create({
      data: {
        id: ulid().toLowerCase(),
        lease_id: leaseId,
        change_type: 'update_tenant',
        old_value: { tenant_id: oldTenantId },
        new_value: { tenant_id: newTenantId },
      },
    });
  });

  return {
    lease_id: leaseId,
    old_tenant_id: oldTenantId,
    new_tenant_id: newTenantId,
    updated_at: new Date().toISOString(),
  };
},
```

- [ ] **Step 3: 提交**

```bash
git add api/src/services/lease.service.ts
git commit -m "feat: 新增编辑租客信息接口

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 房租变更接口

**Files:**
- Modify: `api/src/services/lease.service.ts`

- [ ] **Step 1: 在 LeaseService 接口中添加 changeRent 方法**

```typescript
export interface LeaseService {
  // ... 现有方法
  changeRent(
    orgId: string,
    leaseId: string,
    newRent: number,
    effectiveFromYear: number,
    effectiveFromMonth: number,
    reason?: string
  ): Promise<{ lease_id: string; old_rent: number; new_rent: number; effective_from: { year: number; month: number } }>;
}
```

- [ ] **Step 2: 在 createLeaseService 中实现 changeRent**

```typescript
changeRent: async (orgId: string, leaseId: string, newRent: number, effectiveFromYear: number, effectiveFromMonth: number, reason?: string) => {
  const lease = await getRepo().findByIdWithRelations(leaseId);
  if (!lease || lease.room.apartment.organization_id !== orgId) {
    throw createAppError(404, NotFoundMessages.LEASE);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (effectiveFromYear < currentYear || (effectiveFromYear === currentYear && effectiveFromMonth < currentMonth)) {
    throw createAppError(400, '生效期不能早于当前账期');
  }

  const oldRent = Number(lease.monthly_rent);

  await prisma.leaseChangeLog.create({
    data: {
      id: ulid().toLowerCase(),
      lease_id: leaseId,
      change_type: 'rent_change',
      old_value: { monthly_rent: oldRent },
      new_value: { monthly_rent: newRent },
      effective_from_year: effectiveFromYear,
      effective_from_month: effectiveFromMonth,
      reason,
    },
  });

  return {
    lease_id: leaseId,
    old_rent: oldRent,
    new_rent: newRent,
    effective_from: { year: effectiveFromYear, month: effectiveFromMonth },
  };
},
```

- [ ] **Step 3: 提交**

```bash
git add api/src/services/lease.service.ts
git commit -m "feat: 新增房租变更接口

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 水电单价变更接口

**Files:**
- Modify: `api/src/services/lease.service.ts`

- [ ] **Step 1: 在 LeaseService 接口中添加 changeUtilityRates 方法**

```typescript
export interface LeaseService {
  // ... 现有方法
  changeUtilityRates(
    orgId: string,
    leaseId: string,
    waterRate: number,
    electricityRate: number,
    effectiveFromYear: number,
    effectiveFromMonth: number
  ): Promise<{
    lease_id: string;
    old_rates: { water: number; electricity: number };
    new_rates: { water: number; electricity: number };
    effective_from: { year: number; month: number };
  }>;
}
```

- [ ] **Step 2: 在 createLeaseService 中实现 changeUtilityRates**

```typescript
changeUtilityRates: async (orgId: string, leaseId: string, waterRate: number, electricityRate: number, effectiveFromYear: number, effectiveFromMonth: number) => {
  const lease = await getRepo().findByIdWithRelations(leaseId);
  if (!lease || lease.room.apartment.organization_id !== orgId) {
    throw createAppError(404, NotFoundMessages.LEASE);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (effectiveFromYear < currentYear || (effectiveFromYear === currentYear && effectiveFromMonth < currentMonth)) {
    throw createAppError(400, '生效期不能早于当前账期');
  }

  const oldWater = Number(lease.water_rate);
  const oldElec = Number(lease.electricity_rate);

  await prisma.leaseChangeLog.create({
    data: {
      id: ulid().toLowerCase(),
      lease_id: leaseId,
      change_type: 'utility_rate_change',
      old_value: { water_rate: oldWater, electricity_rate: oldElec },
      new_value: { water_rate: waterRate, electricity_rate: electricityRate },
      effective_from_year: effectiveFromYear,
      effective_from_month: effectiveFromMonth,
    },
  });

  return {
    lease_id: leaseId,
    old_rates: { water: oldWater, electricity: oldElec },
    new_rates: { water: waterRate, electricity: electricityRate },
    effective_from: { year: effectiveFromYear, month: effectiveFromMonth },
  };
},
```

- [ ] **Step 3: 提交**

```bash
git add api/src/services/lease.service.ts
git commit -m "feat: 新增水电单价变更接口

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: 押金变更接口

**Files:**
- Modify: `api/src/services/lease.service.ts`

- [ ] **Step 1: 在 LeaseService 接口中添加 changeDeposit 方法**

```typescript
export interface LeaseService {
  // ... 现有方法
  changeDeposit(
    orgId: string,
    leaseId: string,
    newDeposit: number,
    reason?: string
  ): Promise<{
    lease_id: string;
    old_deposit: number;
    new_deposit: number;
    difference: number;
    bill_id: string;
    bill_status: string;
  }>;
}
```

- [ ] **Step 2: 在 createLeaseService 中实现 changeDeposit**

```typescript
changeDeposit: async (orgId: string, leaseId: string, newDeposit: number, reason?: string) => {
  const lease = await getRepo().findByIdWithRelations(leaseId);
  if (!lease || lease.room.apartment.organization_id !== orgId) {
    throw createAppError(404, NotFoundMessages.LEASE);
  }

  const oldDeposit = Number(lease.deposit);
  const difference = newDeposit - oldDeposit;

  let billId = '';

  await prisma.$transaction(async (tx) => {
    await tx.lease.update({ where: { id: leaseId }, data: { deposit: newDeposit } });

    const bill = await tx.bill.create({
      data: {
        id: ulid().toLowerCase(),
        lease_id: leaseId,
        bill_year: new Date().getFullYear(),
        bill_month: new Date().getMonth() + 1,
        due_date: new Date(),
        rent_amount: 0,
        deposit_amount: difference,
        water_amount: 0,
        electricity_amount: 0,
        other_amount: 0,
        total_amount: difference,
        paid_amount: 0,
        status: 'pending',
      },
    });
    billId = bill.id;

    await tx.leaseChangeLog.create({
      data: {
        id: ulid().toLowerCase(),
        lease_id: leaseId,
        change_type: 'deposit_change',
        old_value: { deposit: oldDeposit },
        new_value: { deposit: newDeposit },
        reason,
      },
    });
  });

  return {
    lease_id: leaseId,
    old_deposit: oldDeposit,
    new_deposit: newDeposit,
    difference,
    bill_id: billId,
    bill_status: 'pending',
  };
},
```

- [ ] **Step 3: 提交**

```bash
git add api/src/services/lease.service.ts
git commit -m "feat: 新增押金变更接口

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

