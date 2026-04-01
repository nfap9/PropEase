# 费用项目重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将费用项目从树形结构(FeeType->FeeSpecification)改造为平铺结构(OrgFeeItem)，删除公寓级费用项目

**Architecture:** 新建 OrgFeeItem 模型替代原 FeeType+FeeSpecification，费用项目数据平铺存储。LeaseFeeItem 和 BillFeeItem 通过 fee_type_id 关联 OrgFeeItem 并冗余存储值。API 路径从 /fee-types 改为 /fee-items

**Tech Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL

---

## Task 1: 数据库迁移

**Files:**
- Modify: `api/prisma/schema.prisma:298-387`
- Create: `api/prisma/migrations/`

- [ ] **Step 1: 修改 schema.prisma**

```prisma
// 删除 FeeType、FeeSpecification、ApartmentFeeConfig 模型，添加 OrgFeeItem

model OrgFeeItem {
  id              String   @id @db.VarChar(26)
  organization_id String   @db.VarChar(26)
  category        String   @db.VarChar(20)  // fixed/utility/optional
  name            String   @db.VarChar(100) // 服务费、卫生费、网费
  amount          Decimal  @db.Decimal(10, 2)
  cycle           String   @db.VarChar(20)  // monthly/quarterly/yearly/one_time
  sort_order      Int      @default(0)
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  bill_fee_items        BillFeeItem[]
  lease_fee_items       LeaseFeeItem[]

  @@unique([organization_id, name])
  @@map("org_fee_items")
}

// 修改 LeaseFeeItem：删除 specification_id，添加冗余字段
model LeaseFeeItem {
  id               String   @id @db.VarChar(26)
  lease_id         String   @db.VarChar(26)
  fee_type_id      String   @db.VarChar(26)  // 关联 OrgFeeItem
  fee_category     String   @db.VarChar(20)  // 冗余存储
  fee_name         String   @db.VarChar(100) // 冗余存储
  fee_amount       Decimal  @db.Decimal(10, 2) // 冗余存储
  fee_cycle        String   @db.VarChar(20)  // 冗余存储
  quantity         Decimal  @default(1) @db.Decimal(10, 2)
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  lease         Lease             @relation(fields: [lease_id], references: [id], onDelete: Cascade)
  feeType       OrgFeeItem        @relation(fields: [fee_type_id], references: [id])

  @@index([lease_id])
  @@map("lease_fee_items")
}

// 修改 BillFeeItem：删除 specification_id，添加冗余字段
model BillFeeItem {
  id                 String   @id @db.VarChar(26)
  bill_id            String   @db.VarChar(26)
  fee_type_id        String   @db.VarChar(26)
  fee_category       String   @db.VarChar(20)  // 冗余存储
  fee_name           String   @db.VarChar(100) // 冗余存储
  fee_amount         Decimal  @db.Decimal(10, 2) // 冗余存储
  fee_cycle          String   @db.VarChar(20)  // 冗余存储
  quantity           Decimal  @default(1) @db.Decimal(10, 2)
  unit_price         Decimal  @db.Decimal(10, 2)
  amount             Decimal  @db.Decimal(10, 2)
  notes              String?  @db.VarChar(500)
  created_at         DateTime @default(now())

  bill          Bill              @relation(fields: [bill_id], references: [id], onDelete: Cascade)
  feeType       OrgFeeItem        @relation(fields: [fee_type_id], references: [id])

  @@index([bill_id])
  @@map("bill_fee_items")
}
```

- [ ] **Step 2: 生成 Prisma 迁移**

Run: `cd api && pnpm exec prisma migrate dev --name refactor_fee_items`
Expected: 迁移文件创建成功

- [ ] **Step 3: 生成 Prisma Client**

Run: `cd api && pnpm exec prisma generate`
Expected: Client 生成成功

- [ ] **Step 4: 提交**

```bash
git add api/prisma/schema.prisma api/prisma/migrations/
git commit -m "refactor: 更新 schema 支持 OrgFeeItem 模型"
```

---

## Task 2: 更新 api-contract 类型定义

**Files:**
- Modify: `packages/api-contract/src/feeTypes.ts`
- Modify: `packages/api-contract/src/index.ts`

- [ ] **Step 1: 重写 feeTypes.ts**

```typescript
/** 费用周期 */
export type FeeCycle = 'monthly' | 'quarterly' | 'yearly' | 'one_time';

/** 计费类型 */
export type FeeCategory = 'fixed' | 'utility' | 'optional';

/** 组织级费用项目 */
export interface OrgFeeItem {
  id: string;
  organization_id: string | null;
  category: FeeCategory;
  name: string;
  amount: number;
  cycle: FeeCycle;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 创建组织级费用项目 */
export interface OrgFeeItemCreate {
  name: string;
  category: FeeCategory;
  amount: number;
  cycle: FeeCycle;
}

/** 更新组织级费用项目 */
export interface OrgFeeItemUpdate {
  name?: string;
  category?: FeeCategory;
  amount?: number;
  cycle?: FeeCycle;
  is_active?: boolean;
  sort_order?: number;
}
```

- [ ] **Step 2: 更新 index.ts 导出**

在 `packages/api-contract/src/index.ts` 中：
- 删除 FeeType、FeeSpecification、ApartmentFeeConfig 相关导出
- 添加 OrgFeeItem、OrgFeeItemCreate、OrgFeeItemUpdate 导出

- [ ] **Step 3: 构建包**

Run: `cd packages/api-contract && pnpm build`
Expected: 构建成功

- [ ] **Step 4: 提交**

```bash
git add packages/api-contract/src/
git commit -m "refactor(api-contract): 更新费用项目类型定义"
```

---

## Task 3: 实现 OrgFeeItem Service

**Files:**
- Create: `api/src/services/orgFeeItem.service.ts`
- Delete: `api/src/services/feeType.service.ts`

- [ ] **Step 1: 创建 orgFeeItem.service.ts**

```typescript
import type { OrgFeeItem } from '@prisma/client';
import { ulid } from 'ulid';
import { prisma } from '../lib/prisma.js';
import { createAppError } from '../utils/appError.js';

export interface CreateOrgFeeItemInput {
  name: string;
  category: string;
  amount: number;
  cycle: string;
}

export interface UpdateOrgFeeItemInput {
  name?: string;
  category?: string;
  amount?: number;
  cycle?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface OrgFeeItemWithDefaults = OrgFeeItem;

export interface OrgFeeItemService {
  list(orgId: string, filters?: { category?: string; cycle?: string; search?: string }): Promise<OrgFeeItemWithDefaults[]>;
  getById(orgId: string, id: string): Promise<OrgFeeItemWithDefaults>;
  create(orgId: string, data: CreateOrgFeeItemInput): Promise<OrgFeeItemWithDefaults>;
  update(orgId: string, id: string, data: UpdateOrgFeeItemInput): Promise<OrgFeeItem>;
  delete(orgId: string, id: string): Promise<void>;
}

async function validateOwnership(orgId: string, id: string): Promise<OrgFeeItem> {
  const item = await prisma.orgFeeItem.findFirst({
    where: { id, organization_id: orgId },
  });
  if (!item) {
    throw createAppError(404, '费用项目不存在');
  }
  return item;
}

export function createOrgFeeItemService(): OrgFeeItemService {
  return {
    list: async (orgId: string, filters) => {
      const where: any = {
        organization_id: orgId,
        is_active: true,
      };
      if (filters?.category) {
        where.category = filters.category;
      }
      if (filters?.cycle) {
        where.cycle = filters.cycle;
      }
      if (filters?.search) {
        where.name = { contains: filters.search, mode: 'insensitive' };
      }
      return prisma.orgFeeItem.findMany({
        where,
        orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
      });
    },

    getById: async (orgId: string, id: string) => {
      const item = await prisma.orgFeeItem.findFirst({
        where: { id, organization_id: orgId, is_active: true },
      });
      if (!item) {
        throw createAppError(404, '费用项目不存在');
      }
      return item;
    },

    create: async (orgId: string, data: CreateOrgFeeItemInput) => {
      const existing = await prisma.orgFeeItem.findFirst({
        where: { organization_id: orgId, name: data.name },
      });
      if (existing) {
        throw createAppError(400, '费用项目名称已存在');
      }
      return prisma.orgFeeItem.create({
        data: {
          id: ulid().toLowerCase(),
          organization_id: orgId,
          name: data.name,
          category: data.category,
          amount: data.amount,
          cycle: data.cycle,
          sort_order: 0,
          is_active: true,
        },
      });
    },

    update: async (orgId: string, id: string, data: UpdateOrgFeeItemInput) => {
      await validateOwnership(orgId, id);
      return prisma.orgFeeItem.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category,
          amount: data.amount,
          cycle: data.cycle,
          is_active: data.is_active,
          sort_order: data.sort_order,
        },
      });
    },

    delete: async (orgId: string, id: string) => {
      await validateOwnership(orgId, id);
      await prisma.orgFeeItem.update({
        where: { id },
        data: { is_active: false },
      });
    },
  };
}

export const defaultOrgFeeItemService = createOrgFeeItemService();
```

- [ ] **Step 2: 删除 feeType.service.ts**

```bash
rm api/src/services/feeType.service.ts
```

- [ ] **Step 3: 提交**

```bash
git add api/src/services/orgFeeItem.service.ts
git rm api/src/services/feeType.service.ts
git commit -m "refactor: 实现 OrgFeeItem Service 替代 FeeType Service"
```

---

## Task 4: 创建 fee-items 路由

**Files:**
- Create: `api/src/routes/v1/fee-items.ts`
- Delete: `api/src/routes/v1/fee-types.ts`
- Modify: `api/src/routes/v1/index.ts`

- [ ] **Step 1: 创建 fee-items.ts**

```typescript
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireConsoleAuth } from '../../middlewares/requireAuth.js';
import { requireOrgMembership } from '../../utils/orgContext.js';
import { createAppError } from '../../utils/appError.js';
import { defaultOrgFeeItemService } from '../../services/orgFeeItem.service.js';

const router: Router = Router();
router.use(requireConsoleAuth);

const OrgFeeItemCreateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['fixed', 'utility', 'optional']),
  amount: z.number().min(0),
  cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']),
});

const OrgFeeItemUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['fixed', 'utility', 'optional']).optional(),
  amount: z.number().min(0).optional(),
  cycle: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const { category, cycle, search } = req.query;
    const list = await defaultOrgFeeItemService.list(orgId, {
      category: category as string,
      cycle: cycle as string,
      search: search as string,
    });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const item = await defaultOrgFeeItemService.getById(orgId, req.params.id);
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = OrgFeeItemCreateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const item = await defaultOrgFeeItemService.create(orgId, parsed.data);
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = OrgFeeItemUpdateSchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    const item = await defaultOrgFeeItemService.update(orgId, req.params.id, parsed.data);
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    await defaultOrgFeeItemService.delete(orgId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export const feeItemsRouter = router;
```

- [ ] **Step 2: 更新 index.ts**

在 `api/src/routes/v1/index.ts` 中：
- 删除 `feeTypesRouter` 导入和挂载
- 添加 `feeItemsRouter` 导入和挂载

- [ ] **Step 3: 删除 fee-types.ts**

```bash
rm api/src/routes/v1/fee-types.ts
```

- [ ] **Step 4: 提交**

```bash
git add api/src/routes/v1/fee-items.ts api/src/routes/v1/index.ts
git rm api/src/routes/v1/fee-types.ts
git commit -m "refactor: 将 /fee-types API 改造为 /fee-items"
```

---

## Task 5: 移除 ApartmentFeeConfig 相关代码

**Files:**
- Delete: `api/src/services/apartmentFeeConfig.service.ts`
- Delete: `api/src/services/apartmentFeeConfig.service.test.ts`
- Modify: `api/src/routes/v1/apartments.ts`
- Modify: `api/src/routes/v1/apartments.controller.ts`

- [ ] **Step 1: 查看 apartments.controller.ts 中的 fee-config 方法**

使用 Grep 找到 `listFeeConfigs`, `createFeeConfig`, `getFeeConfig`, `updateFeeConfig`, `deleteFeeConfig` 方法

- [ ] **Step 2: 删除 apartments.controller.ts 中的 fee-config 方法**

删除以下方法：
- `listFeeConfigs`
- `createFeeConfig`
- `getFeeConfig`
- `updateFeeConfig`
- `deleteFeeConfig`

- [ ] **Step 3: 删除 apartments.ts 中的 fee-config 路由**

删除：
```typescript
// fee configs
router.get('/:apartmentId/fee-configs', ctrl.listFeeConfigs);
router.post('/:apartmentId/fee-configs', ctrl.createFeeConfig);
router.get('/:apartmentId/fee-configs/:configId', ctrl.getFeeConfig);
router.put('/:apartmentId/fee-configs/:configId', ctrl.updateFeeConfig);
router.delete('/:apartmentId/fee-configs/:configId', ctrl.deleteFeeConfig);
```

- [ ] **Step 4: 删除 apartmentFeeConfig 服务文件**

```bash
rm api/src/services/apartmentFeeConfig.service.ts
rm api/src/services/apartmentFeeConfig.service.test.ts
```

- [ ] **Step 5: 提交**

```bash
git add api/src/routes/v1/apartments.controller.ts api/src/routes/v1/apartments.ts
git rm api/src/services/apartmentFeeConfig.service.ts api/src/services/apartmentFeeConfig.service.test.ts
git commit -m "refactor: 移除 ApartmentFeeConfig 相关代码"
```

---

## Task 6: 修改 billGeneration.ts

**Files:**
- Modify: `api/src/services/billGeneration.ts`

- [ ] **Step 1: 查看当前 billGeneration.ts 中 ApartmentFeeConfig 的使用**

使用 Grep 找到 `ApartmentFeeConfig` 或 `apartmentFeeConfig` 的使用位置

- [ ] **Step 2: 修改 billGeneration.ts**

将：
```typescript
const feeConfigs = await prisma.apartmentFeeConfig.findMany({
  where: {
    apartment_id: apartmentId,
    is_enabled: true,
    effective_from: { lte: date },
    OR: [
      { effective_to: null },
      { effective_to: { gte: date } },
    ],
  },
  include: {
    feeType: {
      include: {
        specifications: { where: { is_active: true }, orderBy: { sort_order: 'asc' } },
      },
    },
    specification: true,
  },
});
```

改为直接查询 OrgFeeItem：
```typescript
const feeItems = await prisma.orgFeeItem.findMany({
  where: {
    organization_id: orgId,
    is_active: true,
  },
});
```

- [ ] **Step 3: 提交**

```bash
git add api/src/services/billGeneration.ts
git commit -m "refactor: billGeneration 移除 ApartmentFeeConfig 依赖"
```

---

## Task 7: 修改 lease.service.ts

**Files:**
- Modify: `api/src/services/lease.service.ts`

- [ ] **Step 1: 查看当前 lease.service.ts 中 ApartmentFeeConfig 的使用**

使用 Grep 找到 `ApartmentFeeConfig` 的使用位置（应该在 line 674 附近）

- [ ] **Step 2: 修改 lease.service.ts**

将 `ApartmentFeeConfig.findMany` 查询改为 `OrgFeeItem.findMany` 查询
保持业务逻辑不变，只是数据源从 ApartmentFeeConfig 改为 OrgFeeItem

- [ ] **Step 3: 提交**

```bash
git add api/src/services/lease.service.ts
git commit -m "refactor: lease.service 移除 ApartmentFeeConfig 依赖"
```

---

## Task 8: 更新 openapi.json

**Files:**
- Modify: `api/openapi.json`

- [ ] **Step 1: 重新生成 OpenAPI 文档或手动更新**

删除：
- `/fee-types/specifications/{specId}` 相关路径
- `/fee-types/{id}/specifications` 相关路径
- `/apartments/{apartmentId}/fee-configs` 相关路径

更新：
- `/fee-types` → `/fee-items`
- Schema 从 FeeType + FeeSpecification 改为 OrgFeeItem

---

## Task 9: 类型检查和测试

- [ ] **Step 1: 运行类型检查**

Run: `cd api && pnpm run type-check`
Expected: 无类型错误

- [ ] **Step 2: 运行测试**

Run: `cd api && pnpm run test`
Expected: 所有测试通过

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "refactor: 完成费用项目重构

- FeeType+FeeSpecification 树形结构改为 OrgFeeItem 平铺结构
- 删除 ApartmentFeeConfig 公寓级费用配置
- API 路径从 /fee-types 改为 /fee-items
- 支持按 category、cycle、search 过滤"
```
