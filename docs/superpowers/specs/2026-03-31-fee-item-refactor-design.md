# 费用项目重构设计方案

## 1. 概述

将组织级费用项目管理从树形结构（FeeType -> FeeSpecification）改造为平铺结构，移除公寓级费用项目。

## 2. 数据模型改造

### 2.1 删除模型

| 模型 | 说明 |
|------|------|
| `FeeSpecification` | 费用规格（树形第二级） |
| `ApartmentFeeConfig` | 公寓费用配置 |

### 2.2 新建模型

```prisma
model OrgFeeItem {
  id              String   @id @db.VarChar(26)
  organization_id String   @db.VarChar(26)
  category        String   @db.VarChar(20)  // 计费类型: fixed/utility/optional
  name            String   @db.VarChar(100) // 费用名称: 服务费、卫生费、网费
  amount          Decimal  @db.Decimal(10, 2)
  cycle           String   @db.VarChar(20)  // 周期: monthly/quarterly/yearly/one_time
  sort_order      Int      @default(0)
  is_active       Boolean  @default(true)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@unique([organization_id, name])
  @@map("org_fee_items")
}
```

### 2.3 修改现有模型

**LeaseFeeItem** - 移除 `specification_id`，改为冗余存储：
```prisma
model LeaseFeeItem {
  id               String   @id @db.VarChar(26)
  lease_id         String   @db.VarChar(26)
  fee_type_id      String   @db.VarChar(26)  // 保留，关联 OrgFeeItem
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
```

**BillFeeItem** - 同上：
```prisma
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

**FeeType** - 删除（被 OrgFeeItem 替代）

## 3. API 改造

### 3.1 删除的 API

| 方法 | 路径 | 说明 |
|------|------|------|
| DELETE | `/fee-types/specifications/:specId` | 删除费用规格 |
| PUT | `/fee-types/specifications/:specId` | 更新费用规格 |
| POST | `/fee-types/:id/specifications` | 添加费用规格 |
| GET | `/fee-types/:id/specifications` | 获取费用类型规格列表 |
| GET | `/fee-types/specifications/:specId` | 获取单个费用规格 |
| GET | `/apartments/:id/fee-configs` | 获取公寓费用配置列表 |
| POST | `/apartments/:id/fee-configs` | 创建公寓费用配置 |
| GET | `/apartments/:id/fee-configs/:configId` | 获取公寓费用配置详情 |
| PUT | `/apartments/:id/fee-configs/:configId` | 更新公寓费用配置 |
| DELETE | `/apartments/:id/fee-configs/:configId` | 删除公寓费用配置 |

### 3.2 改造后的 API

路径从 `/fee-types` 改为 `/fee-items`：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/fee-items` | 列表（支持 category、cycle、search 过滤，按 category 排序） |
| POST | `/fee-items` | 创建 |
| GET | `/fee-items/:id` | 详情 |
| PUT | `/fee-items/:id` | 更新 |
| DELETE | `/fee-items/:id` | 删除（软删除） |

**查询参数：**
- `category`: 计费类型过滤 (fixed/utility/optional)
- `cycle`: 周期过滤 (monthly/quarterly/yearly/one_time)
- `search`: 名称搜索

## 4. 服务层改造

### 4.1 删除的服务

- `apartmentFeeConfig.service.ts`
- `apartmentFeeConfig.service.test.ts`

### 4.2 新建服务

- `orgFeeItem.service.ts` - 替代 feeType.service.ts

### 4.3 修改的服务

- `billGeneration.ts` - 移除 ApartmentFeeConfig 依赖
- `lease.service.ts` - 移除 ApartmentFeeConfig 依赖

## 5. 合约改造

### 5.1 删除类型

- `FeeType` (packages/api-contract)
- `FeeSpecification`
- `FeeSpecificationCreate`
- `FeeSpecificationUpdate`
- `ApartmentFeeConfig`
- `ApartmentFeeConfigCreate`
- `ApartmentFeeConfigUpdate`

### 5.2 新增类型

```typescript
type FeeCategory = 'fixed' | 'utility' | 'optional';
type FeeCycle = 'monthly' | 'quarterly' | 'yearly' | 'one_time';

interface OrgFeeItem {
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

interface OrgFeeItemCreate {
  name: string;
  category: FeeCategory;
  amount: number;
  cycle: FeeCycle;
}

interface OrgFeeItemUpdate {
  name?: string;
  category?: FeeCategory;
  amount?: number;
  cycle?: FeeCycle;
  is_active?: boolean;
  sort_order?: number;
}
```

## 6. 实现顺序

1. 数据库迁移：创建 `OrgFeeItem` 表，修改 `LeaseFeeItem`、`BillFeeItem` 表，删除 `FeeSpecification`、`ApartmentFeeConfig`、`FeeType` 表
2. 更新 `packages/api-contract` 类型定义
3. 实现 `orgFeeItem.service.ts`
4. 改造 `routes/v1/fee-types.ts` 为 `routes/v1/fee-items.ts`
5. 修改 `billGeneration.ts`
6. 修改 `lease.service.ts`
7. 删除废弃文件
8. 更新 openapi.json
