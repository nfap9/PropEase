# 租约高级操作前端设计方案

> **状态：** 待用户 review
> **日期：** 2026-03-31

## 1. 概述

### 目标
为 tenant-web 租约管理模块新增高级操作界面，对齐后端已实现的租约高级操作 API（换房/续约/退租结算等）。

### 范围
- 租约详情页（新建）
- 租约变更历史展示
- 费用项目展示与编辑
- 7 个高级操作的交互入口与表单

### 现有能力
- 租约列表页（leases-page-content）
- 基础 CRUD（编辑/终止/删除）
- API：`leasesApi`（list/get/create/update/terminate/delete）

### 后端已实现（参考）
- `POST /leases/:id/change-rent` — 房租变更
- `POST /leases/:id/change-deposit` — 押金变更
- `POST /leases/:id/change-utility-rates` — 水电单价变更
- `POST /leases/:id/change-room` — 换房
- `POST /leases/:id/renew` — 续约
- `POST /leases/:id/update-tenant` — 编辑租客
- `POST /leases/:id/update-fee-items` — 编辑费用项目
- `POST /leases/:id/settle` — 退租结算
- `GET /leases/:id/change-logs` — 变更历史

---

## 2. 页面结构

### 路由
`/leases/[id]` — 租约详情页（新建路由）

### 布局
```
┌─────────────────────────────────────────────────┐
│  ← 返回列表          租约详情          操作按钮 │
├─────────────────────────────────────────────────┤
│  [详情]  [费用项目]  [变更历史]  (Tab 切换)    │
├─────────────────────────────────────────────────┤
│                                                 │
│              Tab 内容区域                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tab 1：详情（默认）
- 基本信息卡片（房间、租客、租期、月租、押金、水电单价、账单日、状态）
- 操作按钮组（换房/续约/编辑租客/房租变更/水电单价变更/押金变更/编辑费用项目/退租结算）
- 费用项目摘要（列表形式，简化展示）

### Tab 2：费用项目
- 完整费用项目列表（名称、规格、单价、数量、小计）
- 编辑费用项目按钮（Sheet 表单）

### Tab 3：变更历史
- 按时间倒序的变更记录时间线
- 每条记录：变更类型 + 时间 + 操作人 + 变更内容（旧值 → 新值）+ 生效期（如有）+ 原因

---

## 3. 操作入口与交互模式

### 全局操作入口
详情页顶部右侧「操作」按钮，点击展开 Dropdown Menu，包含所有高级操作。

### 各操作交互模式

| 操作 | 交互组件 | 所在位置 |
|------|---------|---------|
| 换房 | Sheet 抽屉 | 详情页操作按钮 |
| 续约 | Sheet 抽屉 | 详情页操作按钮 |
| 编辑租客 | Dialog 对话框 | 详情页操作按钮 |
| 房租变更 | Sheet 抽屉 | 详情页操作按钮 |
| 水电单价变更 | Sheet 抽屉 | 详情页操作按钮 |
| 押金变更 | Dialog 对话框 | 详情页操作按钮 |
| 编辑费用项目 | Sheet 抽屉 | Tab 2 / 详情页操作按钮 |
| 退租结算 | Sheet 抽屉（单页表单 + 实时预览） | 详情页操作按钮 |

### 换房 Sheet 字段
- 目标房间（下拉选择，可搜索，只显示可用房间）
- 变更日期（DatePicker）
- 原因备注（Textarea，可选）

### 续约 Sheet 字段
- 新结束日期（DatePicker，需晚于当前结束日期）
- 原因备注（Textarea，可选）

### 编辑租客 Dialog 字段
- 新租客（下拉选择当前组织的租客）

### 房租变更 Sheet 字段
- 新月租（NumberInput）
- 生效期（Year/Month 选择器，不早于当前账期）
- 原因备注（Textarea，可选）

### 水电单价变更 Sheet 字段
- 新水价（NumberInput）
- 新电价（NumberInput）
- 生效期（Year/Month 选择器）
- 原因备注（Textarea，可选）

### 押金变更 Dialog 字段
- 新押金（NumberInput）
- 原因备注（Textarea，可选）

### 编辑费用项目 Sheet 字段
- 费用项目列表（可添加/删除行）
  - 费用类型（下拉）
  - 规格（下拉，根据费用类型联动）
  - 数量（NumberInput）
- 生效期（Year/Month 选择器）
- 原因备注（Textarea，可选）

### 退租结算 Sheet 字段
- 最终水表读数（NumberInput）
- 最终电表读数（NumberInput）
- 违约金金额（NumberInput，可选）
- 备注（Textarea，可选）
- **实时预览区块**：显示最后一期账单 + 押金结算金额 + 合计

---

## 4. API 层扩展

### 扩展 `leasesApi`（`tenant-web/src/lib/api/leases.ts`）

```typescript
// 新增接口
changeRoom(orgId, leaseId, data)
renew(orgId, leaseId, data)
updateTenant(orgId, leaseId, data)
changeRent(orgId, leaseId, data)
changeUtilityRates(orgId, leaseId, data)
changeDeposit(orgId, leaseId, data)
updateFeeItems(orgId, leaseId, data)
settleLease(orgId, leaseId, data)
getChangeLogs(orgId, leaseId)
```

### 新增类型

```typescript
interface LeaseChangeLog {
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

interface LeaseFeeItem {
  id: string;
  lease_id: string;
  fee_type_id: string;
  specification_id: string | null;
  quantity: number;
  feeType: { id: string; name: string; code: string };
  specification: { id: string; name: string; price_monthly: number } | null;
}
```

---

## 5. 组件结构

```
src/features/leases/
├── components/
│   ├── lease-detail-page.tsx          # 详情页主容器
│   ├── lease-detail-tabs.tsx         # Tab 切换
│   ├── lease-detail-info.tsx         # 详情 Tab 内容
│   ├── lease-fee-items-tab.tsx       # 费用项目 Tab 内容
│   ├── lease-change-history-tab.tsx  # 变更历史 Tab 内容
│   ├── lease-change-logs.tsx         # 变更记录时间线组件
│   ├── operations-dropdown.tsx       # 操作下拉菜单
│   ├── operation-sheets/
│   │   ├── change-room-sheet.tsx
│   │   ├── renew-sheet.tsx
│   │   ├── change-rent-sheet.tsx
│   │   ├── change-utility-rates-sheet.tsx
│   │   ├── update-fee-items-sheet.tsx
│   │   └── settle-lease-sheet.tsx
│   ├── operation-dialogs/
│   │   ├── update-tenant-dialog.tsx
│   │   └── change-deposit-dialog.tsx
├── hooks/
│   └── use-lease-operations.ts       # 高级操作 mutation hooks
├── schemas/
│   └── lease-operations.schemas.ts   # Zod schemas
```

---

## 6. 状态管理

- 详情页数据通过 TanStack Query `useQuery` 获取
- 操作后 `queryClient.invalidateQueries({ queryKey: ['leases', orgId] })` 刷新列表
- 详情页数据 `queryClient.invalidateQueries({ queryKey: ['lease', leaseId] })` 刷新

---

## 7. 错误处理

- 各操作 mutation 失败时通过 `appToast.error()` 显示错误信息
- Sheet/Dialog 在提交中显示 loading 状态，按钮置灰
- 校验失败显示 Zod 对应字段错误信息

---

## 8. 实施顺序

1. API 层扩展 + 类型定义
2. Zod schemas
3. useLeaseOperations hooks
4. 详情页骨架（路由 + 布局 + Tabs）
5. 详情 Tab（基本信息 + 操作按钮）
6. 变更历史 Tab（时间线）
7. 费用项目 Tab
8. 各操作 Sheet/Dialog 表单
9. 串联测试

---

## 9. 待确认事项

- [ ] 换房时目标房间下拉是否需要显示房间完整信息（公寓-房间号-状态）
- [ ] 变更历史是否需要显示操作人（当前 session 用户）
- [ ] 退租结算预览中"最后一期账单"是否需要显示明细
