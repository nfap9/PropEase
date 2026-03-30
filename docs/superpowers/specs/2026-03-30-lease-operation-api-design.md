# 租约高级操作 API 整改设计

> 设计日期：2026-03-30
> 目标：对齐 `docs/需求.md` 中租约模块的业务需求，补齐缺失接口，修正实现偏差
> 范围：租约高级操作（换房、续约、退租结算等）、费用项目管理、变更历史、生效期机制

---

## 一、改造 `PUT /leases/:id`

### 限制修改范围

| 字段 | 可直接修改 | 说明 |
|------|:---------:|------|
| `billing_day` | ✅ | 出账日调整不影响金额 |
| `notes` | ✅ | 备注随意改 |
| `monthly_rent` | ❌ | 需 `change-rent` |
| `deposit` | ❌ | 需 `change-deposit` |
| `room_id` | ❌ | 需 `change-room` |
| `tenant_id` | ❌ | 需 `update-tenant` |
| `start_date` | ❌ | 需 `renew` |
| `end_date` | ❌ | 需 `renew` 或 `settle` |
| `water_rate` | ❌ | 需 `change-utility-rates` |
| `electricity_rate` | ❌ | 需 `change-utility-rates` |

**实现：** 在 `lease.service.ts` 的 `update` 方法中，对上述受限字段做白名单校验。尝试修改时返回 400，提示"该字段需通过专门操作修改"。

---

## 二、新增数据模型

### 2.1 `LeaseFeeItem`（租约费用项目）

租约选择的费用项目，从公寓启用列表中选取，月度重复出账。

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

### 2.2 `LeaseChangeLog`（变更历史）

记录所有租约变更操作，便于审计和前端展示变更历史。

```prisma
model LeaseChangeLog {
  id                   String   @id @db.VarChar(26)
  lease_id             String   @db.VarChar(26)
  change_type          String   @db.VarChar(50)  // rent_change | deposit_change | utility_rate_change | fee_items_change | room_change | renew | update_tenant | settle
  old_value            Json?
  new_value            Json?
  effective_from_year  Int?
  effective_from_month Int?
  reason               String?  @db.VarChar(500)
  created_by           String?  @db.VarChar(26)
  created_at           DateTime @default(now())

  lease Lease @relation(fields: [lease_id], references: [id], onDelete: Cascade)

  @@index([lease_id, created_at])
  @@map("lease_change_logs")
}
```

**变更类型枚举：**
- `rent_change` — 房租变更
- `deposit_change` — 押金变更
- `utility_rate_change` — 水电单价变更
- `fee_items_change` — 费用项目变更
- `room_change` — 换房
- `renew` — 续约
- `update_tenant` — 编辑租客信息
- `settle` — 退租结算

---

## 三、新增路由总览

| 方法 | 路径 | 操作 |
|------|------|------|
| `POST` | `/leases/:id/change-rent` | 房租变更（带生效期） |
| `POST` | `/leases/:id/change-deposit` | 押金变更（生成押金账单） |
| `POST` | `/leases/:id/change-utility-rates` | 水电单价变更（带生效期） |
| `POST` | `/leases/:id/change-room` | 换房 |
| `POST` | `/leases/:id/renew` | 续约 |
| `POST` | `/leases/:id/update-tenant` | 编辑租客信息 |
| `POST` | `/leases/:id/update-fee-items` | 编辑租约费用项目（带生效期） |
| `POST` | `/leases/:id/settle` | 退租结算 |
| `GET` | `/leases/:id/change-logs` | 查询变更历史 |

---

## 四、接口详细设计

### 4.1 换房 — `POST /leases/:id/change-room`

**请求：**
```json
{
  "new_room_id": "yyy",
  "change_date": "2026-04-15",
  "reason": "租客换房"
}
```

**事务内行为（顺序）：**
1. 校验新房间存在且状态为 `available`，且属于同一组织
2. **先将新房间改为 `occupied`**
3. **再将原房间改为 `available`**
4. 更新租约 `room_id` 为新房间
5. 插入 `LeaseChangeLog`

**响应：**
```json
{
  "lease_id": "xxx",
  "old_room_id": "orig",
  "new_room_id": "yyy",
  "changed_at": "2026-04-15"
}
```

---

### 4.2 续约 — `POST /leases/:id/renew`

**请求：**
```json
{
  "new_end_date": "2027-03-31",
  "reason": "正常续约"
}
```

**行为：**
1. 校验 `new_end_date > current_end_date`
2. 更新租约 `end_date`
3. 插入 `LeaseChangeLog`

**响应：**
```json
{
  "lease_id": "xxx",
  "old_end_date": "2026-03-31",
  "new_end_date": "2027-03-31",
  "renewed_at": "2026-03-15"
}
```

---

### 4.3 编辑租客信息 — `POST /leases/:id/update-tenant`

**请求：**
```json
{
  "tenant_id": "zzz"
}
```

**行为：**
1. 校验新租客存在且属于同一组织
2. 更新租约 `tenant_id`
3. 插入 `LeaseChangeLog`

**说明：** 只改变租约关联的租客，不修改租客个人信息。

**响应：**
```json
{
  "lease_id": "xxx",
  "old_tenant_id": "old",
  "new_tenant_id": "zzz",
  "updated_at": "2026-03-15"
}
```

---

### 4.4 房租变更 — `POST /leases/:id/change-rent`

**请求：**
```json
{
  "new_rent": 2200,
  "effective_from_year": 2026,
  "effective_from_month": 4,
  "reason": "合同涨价"
}
```

**校验：**
- `effective_from_year/month` ≥ 当前年月
- `new_rent > 0`

**行为：**
1. 插入 `LeaseChangeLog`（记录旧值、新值、生效期）
2. 定时任务在 `effective_from` 当月应用变更到租约字段

**响应：**
```json
{
  "lease_id": "xxx",
  "old_rent": 2000,
  "new_rent": 2200,
  "effective_from": { "year": 2026, "month": 4 }
}
```

---

### 4.5 水电单价变更 — `POST /leases/:id/change-utility-rates`

**请求：**
```json
{
  "water_rate": 4.0,
  "electricity_rate": 0.8,
  "effective_from_year": 2026,
  "effective_from_month": 4
}
```

**校验：** `effective_from_year/month` ≥ 当前年月

**行为：**
1. 插入 `LeaseChangeLog`
2. 定时任务在 `effective_from` 当月应用变更到租约字段

**响应：**
```json
{
  "lease_id": "xxx",
  "old_rates": { "water": 3.5, "electricity": 0.6 },
  "new_rates": { "water": 4.0, "electricity": 0.8 },
  "effective_from": { "year": 2026, "month": 4 }
}
```

---

### 4.6 押金变更 — `POST /leases/:id/change-deposit`

**请求：**
```json
{
  "new_deposit": 5000,
  "reason": "押金上调"
}
```

**行为（事务内）：**
1. 计算差额 = `new_deposit - current_deposit`
2. 更新租约 `deposit`
3. 生成押金账单（`Bill`）：
   - `deposit_amount` = 差额
   - `rent_amount` = 0，`water_amount` = 0，`electricity_amount` = 0，`other_amount` = 0
   - 差额 > 0：状态 `pending`（待补交）
   - 差额 < 0：状态 `pending`（待退还）
4. 插入 `LeaseChangeLog`

**响应：**
```json
{
  "lease_id": "xxx",
  "old_deposit": 4000,
  "new_deposit": 5000,
  "difference": 1000,
  "bill_id": "xxx",
  "bill_status": "pending"
}
```

---

### 4.7 编辑租约费用项目 — `POST /leases/:id/update-fee-items`

**请求：**
```json
{
  "fee_items": [
    { "fee_type_id": "xxx", "specification_id": "yyy", "quantity": 1 },
    { "fee_type_id": "zzz", "specification_id": null, "quantity": 2 }
  ],
  "effective_from_year": 2026,
  "effective_from_month": 4
}
```

**校验：**
- `effective_from_year/month` ≥ 当前年月
- 每个 `fee_type_id` 必须在公寓已启用的费用配置中
- `specification_id` 如果提供，必须属于对应 `fee_type`

**行为：**
1. 插入 `LeaseChangeLog`（记录旧值、新值、生效期）
2. 定时任务在 `effective_from` 当月应用变更到 `LeaseFeeItem` 表

**响应：**
```json
{
  "lease_id": "xxx",
  "fee_items_count": 2,
  "effective_from": { "year": 2026, "month": 4 }
}
```

---

### 4.8 退租结算 — `POST /leases/:id/settle`

**请求：**
```json
{
  "settle_date": "2026-04-20",
  "is_breach": false,
  "water_reading": 120.5,
  "electricity_reading": 380.0,
  "notes": "正常退租"
}
```

#### 前置逻辑

1. 读取本月水电读数是否已存在
2. **如果已有**：以该读数为默认值，本次请求传了新值则覆盖更新
3. **如果无**：本次请求**必须提供读数**，否则返回 400 提示"请录入退租时的水电读数"
4. **禁止系统推算读数**

#### 结算逻辑（事务内）

1. 写入或更新当月水电读数
2. 生成**最后一期普通账单**（房租 + 水电 + 月度费用项目）
3. 计算押金处理：
   - `is_breach = false`：`deposit_deducted = min(deposit, final_charges)`，多退少补
   - `is_breach = true`：押金不退（`deposit_deducted = 0`），但**最后一期费用仍需正常结算**
4. 生成**退租结算账单**（`Bill`，含押金结算金额，可为负数）
5. 返回结构化结算结果
6. 租约 `is_active = false`
7. 房间状态改为 `available`
8. 插入 `LeaseChangeLog`

#### 边界规则

- 租约已退租（`is_active = false`）禁止重复结算
- `is_breach = true` 时押金不退，但最终费用账单的收款不受影响

#### 响应

```json
{
  "lease_id": "xxx",
  "final_bill_id": "bill_1",
  "settlement_bill_id": "bill_2",
  "is_breach": false,
  "deposit_amount": 4000,
  "final_charges": 3200,
  "deposit_deducted": 3200,
  "refund_amount": 800,
  "extra_pay_amount": 0,
  "room_released": true,
  "lease_terminated": true
}
```

**字段说明：**
- `final_charges`：最后一期应付总额（房租+水电+费用项目）
- `deposit_deducted`：押金抵扣金额
- `refund_amount`：应退租客金额（= deposit - deposit_deducted）
- `extra_pay_amount`：租客需补交金额（= deposit_deducted - deposit）

---

### 4.9 查询变更历史 — `GET /leases/:id/change-logs`

**响应：**
```json
[
  {
    "id": "log_1",
    "change_type": "rent_change",
    "old_value": { "monthly_rent": 2000 },
    "new_value": { "monthly_rent": 2200 },
    "effective_from_year": 2026,
    "effective_from_month": 4,
    "reason": "合同涨价",
    "created_at": "2026-03-15T10:00:00Z"
  },
  {
    "id": "log_2",
    "change_type": "deposit_change",
    "old_value": { "deposit": 4000 },
    "new_value": { "deposit": 5000 },
    "reason": "押金上调",
    "created_at": "2026-03-10T10:00:00Z"
  }
]
```

---

## 五、创建租约的扩展

### 5.1 `POST /leases` 请求体扩展

在现有请求体基础上，新增 `fee_items` 字段：

```json
{
  "room_id": "xxx",
  "tenant_id": "xxx",
  "start_date": "2026-04-01",
  "billing_day": 1,
  "monthly_rent": 2000,
  "deposit": 4000,
  "water_rate": 3.5,
  "electricity_rate": 0.6,
  "fee_items": [
    { "fee_type_id": "xxx", "specification_id": "yyy", "quantity": 1 }
  ]
}
```

**行为：**
1. 校验所有 `fee_type_id` 在公寓已启用配置中
2. 创建租约时批量插入 `LeaseFeeItem`
3. 首期账单生成时，同时插入 `BillFeeItem`

---

## 六、生效期实现机制

### 6.1 核心原则

- **租约字段保存"当前生效值"**
- **`LeaseChangeLog` 记录"未来生效的变更"**
- **账单生成时，优先查日志确认该账期是否有变更**
- **定时任务每月初应用"本月生效的变更"到租约字段**

### 6.2 变更提交流程

用户提交变更（如房租从 2000 → 2200，2026-04 生效）：
1. 租约 `monthly_rent` 当前值仍为 2000
2. 插入 `LeaseChangeLog`：`effective_from_year = 2026, effective_from_month = 4, new_value = { monthly_rent: 2200 }`

### 6.3 账单生成逻辑（`billGeneration.ts` 修改）

生成某账期账单时：
1. 读取租约当前字段
2. 查询 `LeaseChangeLog`：是否有 `effective_from_year/month ≤ 账单年月` 且 `change_type` 匹配的未应用变更？
3. 如果有，用日志中的 `new_value` 覆盖
4. 如果没有，用租约字段

### 6.4 定时任务（每月 1 日执行）

```
apply-lease-changes
```
1. 扫描所有 `effective_from_year/month = 当前年月` 的未应用变更日志
2. 按租约分组，应用到对应字段
3. 标记日志为"已应用"（可通过日志表新增 `applied_at` 字段）

---

## 七、路由注册

所有新接口挂载在 `api/src/routes/v1/leases.ts`，统一使用 `requireConsoleAuth` + `requireOrgMembership` 中间件。

---

## 八、错误处理

| 场景 | HTTP 状态码 | 错误信息 |
|------|:---------:|---------|
| 尝试通过 `PUT /leases/:id` 修改受限字段 | 400 | "该字段需通过专门操作修改" |
| 换房时新房间不可用 | 400 | "目标房间不可用，请选择其他房间" |
| 续约时新日期不晚于当前 | 400 | "续约日期必须晚于当前租约结束日期" |
| 退租结算时租约已退租 | 400 | "该租约已退租，请勿重复结算" |
| 退租结算时未提供水电读数 | 400 | "请录入退租时的水电读数" |
| 生效期早于当前年月 | 400 | "生效期不能早于当前账期" |
