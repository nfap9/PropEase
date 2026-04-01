# Service 层 Prisma 直接查询迁移到 Repository 层

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 service 层中所有直接调用 `prisma.model.find/create/update/delete` 的代码迁移到对应的 repository 层，遵守 AGENTS.md 规定的分层约定。

**Architecture:** 
- 新建缺失的 repository：`orgFeeItem.repo.ts`、`platformConfig.repo.ts`、`utilityConfig.repo.ts`
- 扩展现有 repository，添加缺失的查询方法
- 重构 service 层，改用 repository 而非直接 prisma 调用
- 更新测试 mock，从 mock prisma 改为 mock repository

---

## 文件影响范围

### 需要新建的 Repository
- `api/src/repositories/orgFeeItem.repo.ts`
- `api/src/repositories/platformConfig.repo.ts`
- `api/src/repositories/utilityConfig.repo.ts`

### 需要修改的 Repository（添加方法）
- `api/src/repositories/notification.repo.ts` — 添加 `create` 方法
- `api/src/repositories/bill.repo.ts` — 添加 `findFirstByLeaseAndPeriod` 方法
- `api/src/repositories/lease.repo.ts` — 添加 `findActiveByRoomIds` 方法
- `api/src/repositories/room.repo.ts` — 添加 `findByOrgId` 方法

### 需要修改的 Service
- `api/src/services/billGeneration.ts`
- `api/src/services/lease.service.ts`
- `api/src/services/orgFeeItem.service.ts`
- `api/src/services/leaseSettlement.service.ts`
- `api/src/services/utility.service.ts`
- `api/src/services/usage.service.ts`
- `api/src/services/room.service.ts`
- `api/src/services/bill.service.ts`

### 需要修改的 Test
- `api/src/services/billGeneration.test.ts` — mock 改为 repository
- `api/src/services/lease.service.test.ts` — mock 改为 repository
- `api/src/services/room.service.test.ts` — mock 改为 repository
- `api/src/services/utility.service.test.ts` — mock 改为 repository

---

## Task 1: 创建 OrgFeeItem Repository

**Files:**
- Create: `api/src/repositories/orgFeeItem.repo.ts`
- Modify: `api/src/services/orgFeeItem.service.ts`

### Step 1: 创建 OrgFeeItem Repository

```typescript
// api/src/repositories/orgFeeItem.repo.ts
import type { Prisma, OrgFeeItem } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

/**
 * OrgFeeItem Repository 接口
 */
export interface OrgFeeItemRepository {
  findById(id: string): Promise<OrgFeeItem | null>;
  findByIdAndOrg(id: string, orgId: string): Promise<OrgFeeItem | null>;
  findByOrgId(orgId: string, filters?: { category?: string; cycle?: string; search?: string; isActive?: boolean }): Promise<OrgFeeItem[]>;
  findByIds(ids: string[]): Promise<OrgFeeItem[]>;
  create(data: Prisma.OrgFeeItemCreateInput): Promise<OrgFeeItem>;
  update(id: string, data: Prisma.OrgFeeItemUpdateInput): Promise<OrgFeeItem>;
  softDelete(id: string): Promise<void>;
}

/**
 * 创建 OrgFeeItem Repository 实例
 */
export function createOrgFeeItemRepository(db: DbClient): OrgFeeItemRepository {
  return {
    findById: async (id: string) => {
      return db.orgFeeItem.findUnique({ where: { id } });
    },

    findByIdAndOrg: async (id: string, orgId: string) => {
      return db.orgFeeItem.findFirst({ where: { id, organization_id: orgId } });
    },

    findByOrgId: async (orgId: string, filters) => {
      const where: Prisma.OrgFeeItemWhereInput = {
        organization_id: orgId,
      };
      if (filters?.isActive !== undefined) {
        where.is_active = filters.isActive;
      }
      if (filters?.category) {
        where.category = filters.category;
      }
      if (filters?.cycle) {
        where.cycle = filters.cycle;
      }
      if (filters?.search) {
        where.name = { contains: filters.search, mode: 'insensitive' };
      }
      return db.orgFeeItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
      });
    },

    findByIds: async (ids: string[]) => {
      return db.orgFeeItem.findMany({ where: { id: { in: ids } } });
    },

    create: async (data: Prisma.OrgFeeItemCreateInput) => {
      return db.orgFeeItem.create({ data });
    },

    update: async (id: string, data: Prisma.OrgFeeItemUpdateInput) => {
      return db.orgFeeItem.update({ where: { id }, data });
    },

    softDelete: async (id: string) => {
      await db.orgFeeItem.update({ where: { id }, data: { is_active: false } });
    },
  };
}

/**
 * 默认实例
 */
import { prisma } from '../lib/prisma.js';
export const defaultOrgFeeItemRepo = createOrgFeeItemRepository(prisma);
```

### Step 2: 重构 orgFeeItem.service.ts 使用 Repository

- [ ] **Step 1: 修改 orgFeeItem.service.ts，使用注入的 repository**

```typescript
// api/src/services/orgFeeItem.service.ts
import { ulid } from 'ulid';
import { createOrgFeeItemRepository, type OrgFeeItemRepository } from '../repositories/orgFeeItem.repo.js';
import { createAppError } from '../utils/appError.js';

export interface CreateOrgFeeItemInput { /* ... */ }
export interface UpdateOrgFeeItemInput { /* ... */ }
export type OrgFeeItemWithDefaults = Awaited<ReturnType<OrgFeeItemRepository['findById']>>;

export interface OrgFeeItemService {
  list(orgId: string, filters?: { category?: string; cycle?: string; search?: string }): Promise<OrgFeeItemWithDefaults[]>;
  getById(orgId: string, id: string): Promise<OrgFeeItemWithDefaults>;
  create(orgId: string, data: CreateOrgFeeItemInput): Promise<OrgFeeItemWithDefaults>;
  update(orgId: string, id: string, data: UpdateOrgFeeItemInput): Promise<OrgFeeItemWithDefaults>;
  delete(orgId: string, id: string): Promise<void>;
}

export function createOrgFeeItemService(
  getRepo: () => OrgFeeItemRepository = () => createOrgFeeItemRepository(prisma)
): OrgFeeItemService {
  return {
    list: async (orgId: string, filters) => {
      return getRepo().findByOrgId(orgId, { ...filters, isActive: true });
    },

    getById: async (orgId: string, id: string) => {
      const item = await getRepo().findByIdAndOrg(id, orgId);
      if (!item || !item.is_active) {
        throw createAppError(404, '费用项目不存在');
      }
      return item;
    },

    create: async (orgId: string, data: CreateOrgFeeItemInput) => {
      const existing = await getRepo().findByOrgId(orgId, { search: data.name });
      if (existing.some(e => e.name === data.name)) {
        throw createAppError(400, '费用项目名称已存在');
      }
      return getRepo().create({
        id: ulid().toLowerCase(),
        organization_id: orgId,
        name: data.name,
        category: data.category,
        amount: data.amount,
        cycle: data.cycle,
        sort_order: 0,
        is_active: true,
      });
    },

    update: async (orgId: string, id: string, data: UpdateOrgFeeItemInput) => {
      await getRepo().findByIdAndOrg(id, orgId); // validate ownership
      return getRepo().update(id, data);
    },

    delete: async (orgId: string, id: string) => {
      await getRepo().findByIdAndOrg(id, orgId); // validate ownership
      return getRepo().softDelete(id);
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultOrgFeeItemService = createOrgFeeItemService();
```

### Step 3: 运行类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS (no errors related to orgFeeItem)

### Step 4: Commit

```bash
git add api/src/repositories/orgFeeItem.repo.ts api/src/services/orgFeeItem.service.ts
git commit -m "refactor: create OrgFeeItem repository and migrate orgFeeItem.service"
```

---

## Task 2: 创建 PlatformConfig Repository

**Files:**
- Create: `api/src/repositories/platformConfig.repo.ts`
- Modify: `api/src/services/usage.service.ts`

### Step 1: 创建 PlatformConfig Repository

```typescript
// api/src/repositories/platformConfig.repo.ts
import type { PlatformConfig } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface PlatformConfigRepository {
  findDefault(): Promise<PlatformConfig | null>;
}

export function createPlatformConfigRepository(db: DbClient): PlatformConfigRepository {
  return {
    findDefault: async () => {
      return db.platformConfig.findUnique({ where: { id: 'default' } });
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultPlatformConfigRepo = createPlatformConfigRepository(prisma);
```

### Step 2: 重构 usage.service.ts 使用 Repository

- [ ] **Step 1: 修改 usage.service.ts 第 56 行和第 88 行**

将:
```typescript
const platformConfig = await prisma.platformConfig.findUnique({ where: { id: 'default' } });
```

改为:
```typescript
const platformConfig = await getPlatformConfigRepo().findDefault();
```

在文件顶部添加:
```typescript
import { defaultPlatformConfigRepo } from '../repositories/platformConfig.repo.js';
```

添加依赖注入参数:
```typescript
export function createUsageService(
  getRepo: () => UsageRepository = () => defaultUsageRepo,
  getPlatformConfigRepo: () => PlatformConfigRepository = () => defaultPlatformConfigRepo
): UsageService {
```

### Step 3: 运行类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 4: Commit

```bash
git add api/src/repositories/platformConfig.repo.ts api/src/services/usage.service.ts
git commit -m "refactor: create PlatformConfig repository and migrate usage.service"
```

---

## Task 3: 创建 UtilityConfig Repository

**Files:**
- Create: `api/src/repositories/utilityConfig.repo.ts`
- Modify: `api/src/repositories/utility.repo.ts`（扩展方法）
- Modify: `api/src/services/billGeneration.ts`

### Step 1: 创建 UtilityConfig Repository

```typescript
// api/src/repositories/utilityConfig.repo.ts
import type { UtilityConfig } from '@prisma/client';
import type { DbClient } from '../types/repository.types.js';

export interface UtilityConfigRepository {
  findByApartmentId(apartmentId: string): Promise<UtilityConfig | null>;
}

export function createUtilityConfigRepository(db: DbClient): UtilityConfigRepository {
  return {
    findByApartmentId: async (apartmentId: string) => {
      return db.utilityConfig.findUnique({ where: { apartment_id: apartmentId } });
    },
  };
}

import { prisma } from '../lib/prisma.js';
export const defaultUtilityConfigRepo = createUtilityConfigRepository(prisma);
```

### Step 2: 扩展 Notification Repository 添加 create 方法

修改 `api/src/repositories/notification.repo.ts`:

在 `NotificationRepository` 接口添加:
```typescript
create(data: Prisma.NotificationCreateInput): Promise<Notification>;
```

在实现中添加:
```typescript
create: async (data: Prisma.NotificationCreateInput) => {
  return db.notification.create({ data });
},
```

### Step 3: 扩展 Bill Repository 添加 findByLeaseAndPeriod

修改 `api/src/repositories/bill.repo.ts`:

在 `BillRepository` 接口添加:
```typescript
findByLeaseAndPeriod(leaseId: string, year: number, month: number): Promise<Bill | null>;
```

在实现中添加:
```typescript
findByLeaseAndPeriod: async (leaseId: string, year: number, month: number) => {
  return db.bill.findFirst({
    where: { lease_id: leaseId, bill_year: year, bill_month: month },
  });
},
```

### Step 4: 重构 billGeneration.ts 使用 Repository

- [ ] **Step 1: 修改 billGeneration.ts 顶部 import**

```typescript
import { prisma } from '../lib/prisma.js';
import { defaultTenantReachabilityService } from './tenantReachability.service.js';
import { createLeaseRepository, type LeaseRepository } from './repositories/lease.repo.js';
import { createRoomRepository, type RoomRepository } from './repositories/room.repo.js';
import { createBillRepository, type BillRepository } from './repositories/bill.repo.js';
import { createUtilityRepository, type UtilityRepository } from './repositories/utility.repo.js';
import { createOrgFeeItemRepository, type OrgFeeItemRepository } from './repositories/orgFeeItem.repo.js';
import { createUtilityConfigRepository, type UtilityConfigRepository } from './repositories/utilityConfig.repo.js';
import { createLeaseChangeLogRepository, type LeaseChangeLogRepository } from './repositories/leaseChangeLog.repo.js';
```

- [ ] **Step 2: 重构 getEffectiveLeaseValues 函数**

将:
```typescript
const lease = await prisma.lease.findUnique({
  where: { id: leaseId },
  select: { monthly_rent: true, water_rate: true, electricity_rate: true },
});
```

改为使用 repository 注入:
```typescript
async function getEffectiveLeaseValues(
  leaseId: string,
  billYear: number,
  billMonth: number,
  getLeaseRepo: () => LeaseRepository,
  getChangeLogRepo: () => LeaseChangeLogRepository
): Promise<{ monthly_rent: number; water_rate: number; electricity_rate: number }> {
  const lease = await getLeaseRepo().findById(leaseId);
  // ... rest of function uses getChangeLogRepo()
}
```

- [ ] **Step 3: 重构 generateBillsForOrg 函数**

将所有 `prisma.room.findMany`、`prisma.lease.findMany`、`prisma.bill.findFirst`、`prisma.utilityReading.findFirst`、`prisma.utilityConfig.findUnique`、`prisma.orgFeeItem.findMany` 替换为对应的 repository 调用。

函数签名改为:
```typescript
export async function generateBillsForOrg(
  orgId: string,
  billYear: number,
  billMonth: number,
  dueDate: Date,
  leaseIds?: string[],
  deps: {
    getLeaseRepo?: () => LeaseRepository = () => createLeaseRepository(prisma),
    getRoomRepo?: () => RoomRepository = () => createRoomRepository(prisma),
    getBillRepo?: () => BillRepository = () => createBillRepository(prisma),
    getUtilityRepo?: () => UtilityRepository = () => createUtilityRepository(prisma),
    getOrgFeeItemRepo?: () => OrgFeeItemRepository = () => createOrgFeeItemRepository(prisma),
    getUtilityConfigRepo?: () => UtilityConfigRepository = () => createUtilityConfigRepository(prisma),
    getLeaseChangeLogRepo?: () => LeaseChangeLogRepository = () => createLeaseChangeLogRepository(prisma),
  } = {}
): Promise<{ created: number; skipped: number }>
```

### Step 5: 运行类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 6: Commit

```bash
git add api/src/repositories/utilityConfig.repo.ts api/src/repositories/notification.repo.ts api/src/repositories/bill.repo.ts api/src/services/billGeneration.ts
git commit -m "refactor: create UtilityConfig repository and migrate billGeneration"
```

---

## Task 4: 扩展 Repository 方法

**Files:**
- Modify: `api/src/repositories/lease.repo.ts` — 添加 `findActiveByRoomIds`
- Modify: `api/src/repositories/room.repo.ts` — 添加 `findByOrgId`
- Modify: `api/src/repositories/leaseChangeLog.repo.ts` — 修改为支持 DbClient

### Step 1: 扩展 LeaseRepository

修改 `api/src/repositories/lease.repo.ts`:

添加方法到接口:
```typescript
findActiveByRoomIds(roomIds: string[]): Promise<LeaseWithRelations[]>;
```

添加实现:
```typescript
findActiveByRoomIds: async (roomIds: string[]) => {
  return db.lease.findMany({
    where: {
      room_id: { in: roomIds },
      is_active: true,
    },
    include: {
      room: { include: { apartment: true } },
      tenant: true,
    },
  }) as Promise<LeaseWithRelations[]>;
},
```

### Step 2: 扩展 RoomRepository

修改 `api/src/repositories/room.repo.ts`:

添加方法到接口:
```typescript
findByOrgId(orgId: string): Promise<Room[]>;
```

添加实现:
```typescript
findByOrgId: async (orgId: string) => {
  return db.room.findMany({
    where: { apartment: { organization_id: orgId } },
    select: { id: true },
  });
},
```

### Step 3: 修复 LeaseChangeLogRepository 支持 DbClient

当前 `createLeaseChangeLogRepository` 只接受 `PrismaClient | Prisma.TransactionClient`，但其他 repo 接受 `DbClient`。统一改为 `DbClient`。

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 4: Commit

```bash
git add api/src/repositories/lease.repo.ts api/src/repositories/room.repo.ts api/src/repositories/leaseChangeLog.repo.ts
git commit -m "refactor: extend lease and room repositories"
```

---

## Task 5: 重构 lease.service.ts

**Files:**
- Modify: `api/src/services/lease.service.ts`

### Step 1: 添加缺失的 Repository 依赖

修改 `createLeaseService` 函数，添加以下 repository 工厂参数:
- `getOrgFeeItemRepo` — 使用 `createOrgFeeItemRepository`
- `getNotificationRepo` — 使用 `createNotificationRepository`
- `getOrgMemberRepo` — 使用 organization.repo 的 `findMembersByOrgId`

### Step 2: 替换直接 Prisma 调用

| 位置 | 原代码 | 替换为 |
|------|--------|--------|
| 191行 | `prisma.organizationMember.findMany` | `getOrgMemberRepo().findMembersByOrgId(orgId)` |
| 197行 | `prisma.notification.create` | `getNotificationRepo().create(...)` |
| 243行 | `prisma.room.findFirst` | `getRoomRepo().findByIdWithApartment(roomId)` |
| 252行 | `prisma.tenant.findFirst` | `getTenantRepo().findByIdAndOrg(tenantId, orgId)` |
| 266行 | `prisma.orgFeeItem.findMany` | `getOrgFeeItemRepo().findByIds(...)` |
| 284行 | `prisma.leaseFeeItem.createMany` | `getLeaseFeeItemRepo().createMany(...)` |
| 299行 | `prisma.orgFeeItem.findMany` | `getOrgFeeItemRepo().findByIds(...)` |
| 407行 | `prisma.room.findFirst` | `getRoomRepo().findByIdWithApartment(newRoomId)` |
| 486行 | `prisma.tenant.findFirst` | `getTenantRepo().findByIdAndOrg(newTenantId, orgId)` |
| 541行 | `prisma.leaseChangeLog.create` | `getChangeLogRepo().create(...)` |
| 588行 | `prisma.leaseChangeLog.create` | `getChangeLogRepo().create(...)` |
| 687行 | `prisma.apartment.findUnique` | `getApartmentRepo().findById(apartmentId)` |
| 691行 | `prisma.orgFeeItem.findMany` | `getOrgFeeItemRepo().findByOrgId(orgId, { isActive: true })` |
| 703行 | `prisma.leaseChangeLog.create` | `getChangeLogRepo().create(...)` |

### Step 3: 运行类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 4: Commit

```bash
git add api/src/services/lease.service.ts
git commit -m "refactor: migrate lease.service to use repositories"
```

---

## Task 6: 重构 leaseSettlement.service.ts

**Files:**
- Modify: `api/src/services/leaseSettlement.service.ts`

### Step 1: 添加 Repository 依赖

```typescript
import { createUtilityRepository, type UtilityRepository } from '../repositories/utility.repo.js';
import { createLeaseFeeItemRepository, type LeaseFeeItemRepository } from '../repositories/leaseFeeItem.repo.js';
import { createNotificationRepository, type NotificationRepository } from '../repositories/notification.repo.js';
```

### Step 2: 替换直接 Prisma 调用

| 位置 | 原代码 | 替换为 |
|------|--------|--------|
| 49行 | `prisma.utilityReading.findUnique` | `getUtilityRepo().findExistingReading(...)` |
| 79行 | `prisma.leaseFeeItem.findMany` | `getLeaseFeeItemRepo().findByLeaseId(leaseId)` |

### Step 3: 运行类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 4: Commit

```bash
git add api/src/services/leaseSettlement.service.ts
git commit -m "refactor: migrate leaseSettlement.service to use repositories"
```

---

## Task 7: 重构 utility.service.ts

**Files:**
- Modify: `api/src/services/utility.service.ts`

### Step 1: 添加 Repository 依赖

添加 `getUtilityConfigRepo` 参数。

### Step 2: 替换直接 Prisma 调用

| 位置 | 原代码 | 替换为 |
|------|--------|--------|
| 375行 | `prisma.room.findFirst` | `getRoomRepo().findByIdWithApartment(roomId)` |
| 404行 | `prisma.utilityReading.findMany` | `getUtilityRepo().findByOrgId(...)` |
| 492行 | `prisma.room.findMany` | `getRoomRepo().findByOrgId(orgId)` |
| 541行 | `prisma.room.findMany` | `getRoomRepo().findByOrgId(orgId)` |
| 577行 | `prisma.utilityReading.findMany` | `getUtilityRepo().findByOrgId(...)` |

### Step 3: 运行类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 4: Commit

```bash
git add api/src/services/utility.service.ts
git commit -m "refactor: migrate utility.service to use repositories"
```

---

## Task 8: 重构 room.service.ts

**Files:**
- Modify: `api/src/services/room.service.ts`

### Step 1: 添加 ApartmentRepository 依赖

当前 `room.service.ts` 已经注入了 `ApartmentRepository`，但直接调用了 `prisma.apartment.findFirst`。检查并确保使用 `getApartmentRepo().findByIdAndOrg(...)` 而不是直接 `prisma`。

### Step 2: 运行类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 3: Commit

```bash
git add api/src/services/room.service.ts
git commit -m "refactor: migrate room.service to use repositories"
```

---

## Task 9: 重构 bill.service.ts

**Files:**
- Modify: `api/src/services/bill.service.ts`

### Step 1: 替换直接 Prisma 调用

| 位置 | 原代码 | 替换为 |
|------|--------|--------|
| 137行 | `prisma.lease.findFirst` | `getLeaseRepo().findByIdWithRelations(leaseId)` |

### Step 2: 运行类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 3: Commit

```bash
git add api/src/services/bill.service.ts
git commit -m "refactor: migrate bill.service to use repositories"
```

---

## Task 10: 更新测试 Mock

**Files:**
- Modify: `api/src/services/billGeneration.test.ts`
- Modify: `api/src/services/lease.service.test.ts`
- Modify: `api/src/services/room.service.test.ts`
- Modify: `api/src/services/utility.service.test.ts`

### Step 1: 更新 billGeneration.test.ts

将 `vi.mocked(prisma.room.findMany)` 改为 mock 对应的 repository。

例如，原来的:
```typescript
vi.mocked(prisma.room.findMany).mockResolvedValue([mockRoom]);
```

改为 mock `createRoomRepository`:
```typescript
const mockGetRoomRepo = vi.fn().mockReturnValue({
  findByOrgId: vi.fn().mockResolvedValue([{ id: 'room1' }]),
});
```

并传递依赖:
```typescript
await generateBillsForOrg(orgId, 2024, 1, new Date(), undefined, {
  getRoomRepo: mockGetRoomRepo,
  // ... other mocks
});
```

### Step 2: 更新其他测试文件

类似地将 `vi.mocked(prisma.xxx)` 改为 mock repository 方法。

### Step 3: 运行测试

Run: `cd api && pnpm run test`
Expected: PASS

### Step 4: Commit

```bash
git add api/src/services/*.test.ts
git commit -m "test: update mocks to use repositories instead of prisma"
```

---

## Task 11: 最终验证

### Step 1: 全量类型检查

Run: `cd api && pnpm run type-check`
Expected: PASS

### Step 2: 全量测试

Run: `cd api && pnpm run test`
Expected: ALL PASS

### Step 3: Grep 验证无直接 Prisma 调用

Run: `grep -r "prisma\." api/src/services/*.ts | grep -v "test\|mock\|\.d\.ts"`
Expected: 只有 import 语句，无实际调用

### Step 4: Commit

```bash
git add -A
git commit -m "refactor: complete service layer repository migration"
```

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-03-31-service-layer-prisma-migration.md`**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
