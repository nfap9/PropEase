# 账单冲销功能详细设计

> 版本：v1.0 | 状态：设计中 | 创建日期：2026-04-21

---

## 一、背景与目标

### 1.1 背景

账单生成后可能因以下原因需要调整：
- 录入水电读数有误
- 费用项计算错误
- 漏记某项费用
- 退租结算时需要修正

### 1.2 目标

实现**红冲+新出**方案的账单调整功能：
1. 原账单标记为"已冲销"（reversed），不可修改
2. 系统生成红字账单（金额为负），状态为"已支付"
3. 系统生成新账单（正确金额），状态为"待支付"
4. 全程可追溯，支持审计

---

## 二、方案设计

### 2.1 冲销前提条件

| 条件 | 说明 |
|------|------|
| 原账单状态 | 仅支持 `pending` 或 `partial` 状态的账单 |
| 权限 | 需要 `bill:edit` 权限 |
| 关联 | 已冲销的账单不能再被冲销 |

### 2.2 冲销流程

```
┌─────────────────┐
│   原账单        │
│  (pending/      │
│   partial)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  执行冲销       │
│  ─────────────  │
│  1. 原账单 status → "reversed"  │
│  2. 生成红字账单（金额取反）    │
│  3. 生成新账单（正确金额）      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   红字账单      │     │   新账单        │
│  total_amount   │     │  total_amount  │
│    = -X         │     │    = Y         │
│  status="paid"  │     │  status="pending" │
└─────────────────┘     └─────────────────┘
```

### 2.3 数据变更

#### 2.3.1 Prisma Schema 变更

```prisma
model Bill {
  // ... existing fields ...

  // 新增字段
  reversed_by_id   String?   @db.VarChar(26)  // 冲销此账单的新账单ID（若有）
  reverses_id     String?   @db.VarChar(26)  // 冲销原账单的ID（表示此账单是冲销单）

  // 新增状态值
  // status: "pending" | "partial" | "paid" | "overdue" | "reversed" | "cancelled"
}

// 关系
Bill @relation("BillReversal", fields: [reverses_id], references: [id])
Bill @relation("BillReversedBy", fields: [reversed_by_id], references: [id])
```

#### 2.3.2 BillStatus 类型变更

```typescript
// packages/api-contract/src/bills.ts

/** 账单状态 */
export type BillStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'reversed';
```

### 2.4 API 设计

#### 2.4.1 冲销账单

```
POST /api/v1/bills/:id/reverse
```

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | string | 是 | 冲销原因 |

**响应：**

```json
{
  "code": 0,
  "message": "冲销成功",
  "data": {
    "original_bill": {
      "id": "bill_xxx",
      "status": "reversed",
      "reversed_by_id": "bill_new_xxx"
    },
    "reversal_bill": {
      "id": "bill_reversal_xxx",
      "total_amount": -100.00,
      "status": "paid"
    },
    "new_bill": {
      "id": "bill_new_xxx",
      "total_amount": 200.00,
      "status": "pending"
    }
  }
}
```

#### 2.4.2 查询冲销记录

```
GET /api/v1/bills/:id/reversal-history
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "current": {
      "id": "bill_new_xxx",
      "status": "pending",
      "total_amount": 200.00
    },
    "history": [
      {
        "id": "bill_xxx",
        "status": "reversed",
        "total_amount": 100.00,
        "reversed_at": "2026-04-21T10:00:00Z"
      }
    ]
  }
}
```

---

## 三、实现细节

### 3.1 Service 层变更

#### 3.1.1 新增 BillService 方法

```typescript
// api/src/services/bill.service.ts

interface BillService {
  // ... existing methods ...

  /**
   * 冲销账单
   * @param orgId 组织ID
   * @param billId 要冲销的账单ID
   * @param reason 冲销原因
   * @returns 冲销结果
   */
  reverseBill(orgId: string, billId: string, reason: string): Promise<ReverseBillResult>;

  /**
   * 获取账单冲销历史
   */
  getReversalHistory(orgId: string, billId: string): Promise<ReversalHistory>;
}
```

#### 3.1.2 冲销实现逻辑

```typescript
async reverseBill(orgId: string, billId: string, reason: string): Promise<ReverseBillResult> {
  // 1. 验证账单归属和状态
  const originalBill = await this.getById(orgId, billId);
  if (!['pending', 'partial'].includes(originalBill.status)) {
    throw createAppError(400, '仅支持对待支付或部分支付的账单进行冲销');
  }

  // 2. 在事务中执行
  return await prisma.$transaction(async (tx) => {
    // 3. 更新原账单状态为 reversed
    await tx.bill.update({
      where: { id: billId },
      data: { status: 'reversed' }
    });

    // 4. 创建红字账单（金额取反，标记为已支付）
    const reversalBillId = ulid().toLowerCase();
    await tx.bill.create({
      data: {
        id: reversalBillId,
        lease_id: originalBill.lease_id,
        bill_year: originalBill.bill_year,
        bill_month: originalBill.bill_month,
        due_date: originalBill.due_date,
        rent_amount: -originalBill.rent_amount,
        deposit_amount: -originalBill.deposit_amount,
        water_amount: -originalBill.water_amount,
        electricity_amount: -originalBill.electricity_amount,
        other_amount: -originalBill.other_amount,
        total_amount: -originalBill.total_amount,
        paid_amount: -originalBill.total_amount, // 已支付
        status: 'paid',
        notes: `冲销原账单 ${billId}：${reason}`,
        reverses_id: billId,
      }
    });

    // 5. 创建新账单
    const newBillId = ulid().toLowerCase();
    const newBill = await tx.bill.create({
      data: {
        id: newBillId,
        lease_id: originalBill.lease_id,
        bill_year: originalBill.bill_year,
        bill_month: originalBill.bill_month,
        due_date: originalBill.due_date,
        rent_amount: originalBill.rent_amount,
        deposit_amount: originalBill.deposit_amount,
        water_amount: originalBill.water_amount,
        electricity_amount: originalBill.electricity_amount,
        other_amount: originalBill.other_amount,
        total_amount: originalBill.total_amount,
        paid_amount: 0,
        status: 'pending',
        notes: `冲销后新账单，替代 ${billId}`,
        reverses_id: billId,
        reversed_by_id: billId,
      }
    });

    // 6. 更新原账单指向新账单
    await tx.bill.update({
      where: { id: billId },
      data: { reversed_by_id: newBillId }
    });

    return { originalBill, reversalBill, newBill };
  });
}
```

### 3.2 账单费用明细（BillFeeItem）处理

红字账单和新账单都需要复制原账单的 BillFeeItem：

```typescript
// 复制费用明细到红字账单
const originalFeeItems = await tx.billFeeItem.findMany({
  where: { bill_id: billId }
});

for (const item of originalFeeItems) {
  await tx.billFeeItem.create({
    data: {
      ...item,
      id: ulid().toLowerCase(),
      bill_id: reversalBillId,
      amount: -Number(item.amount), // 金额取反
    }
  });
}
```

### 3.3 Controller 层变更

```typescript
// api/src/routes/v1/bills.controller.ts

export const BillReverseSchema = z.object({
  reason: z.string().min(1, '冲销原因不能为空'),
});

export async function reverse(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    await requirePermission(req, orgId, 'bill:edit');
    
    const parsed = BillReverseSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createAppError(422, '参数校验失败'));
    }

    const result = await defaultBillService.reverseBill(
      orgId,
      req.params.id,
      parsed.data.reason
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getReversalHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const history = await defaultBillService.getReversalHistory(orgId, req.params.id);
    res.json(history);
  } catch (e) {
    next(e);
  }
}
```

### 3.4 路由注册

```typescript
// api/src/routes/v1/bills.ts

router.post('/:id/reverse', ctrl.reverse);
router.get('/:id/reversal-history', ctrl.getReversalHistory);
```

---

## 四、权限设计

### 4.1 权限要求

| 操作 | 所需权限 |
|------|----------|
| 冲销账单 | `bill:edit` |
| 查看冲销历史 | `bill:view` |

### 4.2 审计日志

冲销操作需要记录审计日志：

```typescript
auditLog({
  action: 'bill:reverse',
  billId: originalBill.id,
  newBillId: newBill.id,
  reversalBillId: reversalBill.id,
  reason,
  operator: req.consoleUser.id,
});
```

---

## 五、边界情况处理

### 5.1 已有部分支付的账单

如果账单状态为 `partial`（部分支付）：

| 场景 | 处理方式 |
|------|----------|
| 红字账单金额 = -(已支付金额) | 确保红字账单能完全抵消已支付部分 |
| 新账单金额 = 正确金额 | 与原金额一致 |

### 5.2 账单已逾期

已逾期（`overdue`）的账单：
- **支持冲销**：因为逾期只是催收状态，账单项本身可能需要修正
- 流程与 pending/partial 一致

### 5.3 已被其他账单冲销的账单

- 原账单 status 已变为 `reversed`，再次冲销返回错误
- 错误信息：`该账单已被冲销，如需调整请冲销最新账单`

### 5.4 租约已结束

- 支持冲销，只要账单存在且状态符合条件
- 租约状态不影响冲销操作

---

## 六、前端需求

### 6.1 账单详情页

- 显示"冲销"按钮（仅当状态为 pending/partial/overdue 时可见）
- 显示冲销历史追溯信息

### 6.2 冲销流程

1. 点击"冲销"按钮
2. 填写冲销原因（必填）
3. 确认冲销影响（显示将生成红字账单和新账单）
4. 提交执行
5. 显示冲销结果

### 6.3 账单列表

- 已冲销账单显示特殊标记（如删除线）
- 支持筛选"显示已冲销账单"

---

## 七、测试要点

### 7.1 正常流程

- [ ] pending 状态账单冲销成功
- [ ] partial 状态账单冲销成功
- [ ] 红字账单金额正确（取反）
- [ ] 新账单金额正确（与原金额一致）
- [ ] 原账单状态变为 reversed
- [ ] 账单关联关系正确（reverses_id / reversed_by_id）

### 7.2 权限控制

- [ ] 无 bill:edit 权限无法冲销
- [ ] 无 bill:view 权限无法查看冲销历史

### 7.3 边界情况

- [ ] 已 paid 状态账单冲销返回错误
- [ ] 已 reversed 状态账单再次冲销返回错误
- [ ] 部分支付账单冲销金额正确

---

## 八、文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `api/prisma/schema.prisma` | 修改 | 新增 `reversed_by_id` / `reverses_id` 字段 |
| `packages/api-contract/src/bills.ts` | 修改 | `BillStatus` 新增 `reversed` |
| `api/src/services/bill.service.ts` | 修改 | 新增 `reverseBill` / `getReversalHistory` 方法 |
| `api/src/routes/v1/bills.controller.ts` | 修改 | 新增 `reverse` / `getReversalHistory` handler |
| `api/src/routes/v1/bills.ts` | 修改 | 注册新路由 |
| `api/src/swagger.ts` | 修改 | 更新 Bill schema |

---

## 九、待确认事项

1. **逾期账单是否支持冲销？**（本文档按支持处理）
2. **红字账单是否需要单独的账单类型标识？**（当前方案是金额为负来区分）
3. **冲销操作是否需要发送通知？**（建议发送站内通知给相关人员）

---

*文档版本：v1.0 | 更新日期：2026-04-21*
