# 前端页面组件拆分重构计划

> 创建日期: 2026-02-26
> 最后更新: 2026-02-27
> 状态: 🔄 进行中

## 📊 进度概览

**总进度: 2/9 页面完成 (22%)**

| 阶段 | 状态 | 页面数 |
|-----|------|-------|
| P0 极高优先级 | ⬜ 0/3 | `apartments/[id]`, `leases`, `settings/team` |
| P1 高优先级 | ✅ 2/3 | `reports`, ~~`rooms`~~, ~~`utilities`~~ |
| P2 中等优先级 | ⬜ 0/3 | `tenants`, `bills`, `apartments` |

---

## 背景

### 目标

遵循单一功能原则，将复杂页面拆分为更小的、职责单一的组件，提高代码可读性和可维护性。

### 当前问题

部分页面文件过大（300-1470行），包含多个内联 Dialog、Form 组件，难以维护和测试。

### 复杂度分析 (2026-02-27 更新)

| 页面 | 行数 | 内联组件 | 复杂度 | 状态 |
|-----|------|---------|-------|------|
| `apartments/[id]/page.tsx` | 1470 | 5+ Dialog | **极高** | ⬜ |
| ~~`utilities/page.tsx`~~ | ~~676~~ | ~~3 Dialog~~ | 极高 | ✅ 完成 |
| ~~`rooms/page.tsx`~~ | ~~642~~ | ~~3 Dialog + 筛选~~ | 高 | ✅ 完成 |
| `settings/team/page.tsx` | 547 | 4 Dialog | 极高 | ⬜ |
| `reports/page.tsx` | 510 | 多 Tabs | 中高 | ⬜ |
| `apartments/page.tsx` | 425 | 3 Dialog | 中 | ⬜ |
| `tenants/page.tsx` | 409 | 3 Dialog | 高 | ⬜ |
| `leases/page.tsx` | 398 | 4 Dialog | 高 | ⬜ |
| `bills/page.tsx` | 395 | 1 Dialog | 高 | ⬜ |

> 注：公寓详情页因包含批量添加房间、房间管理等复杂功能，行数最多。

---

## 任务清单

### P0 - 极高优先级

#### 1. ⬜ `apartments/[id]/page.tsx` 拆分

**目标：** 将 1469 行的公寓详情页拆分为多个组件

**拆分方案：**
```
/app/apartments/[id]/
├── page.tsx                       # 主页面布局
├── components/
│   ├── ApartmentHeader.tsx        # 公寓信息头部
│   ├── RoomDataTable.tsx          # 房间数据表格
│   ├── CreateRoomDialog.tsx       # 新增房间表单
│   ├── BatchAddRoomsDialog.tsx    # 批量添加房间
│   ├── EditRoomDialog.tsx         # 编辑房间表单
│   ├── DeleteRoomDialog.tsx       # 删除确认
│   └── columns.tsx                # 表格列定义
```

**步骤：**
- [ ] 提取 `columns.tsx` - 表格列配置
- [ ] 提取 `ApartmentHeader.tsx` - 公寓信息展示
- [ ] 提取 `RoomDataTable.tsx` - 房间表格
- [ ] 提取 `CreateRoomDialog.tsx` - 创建表单
- [ ] 提取 `BatchAddRoomsDialog.tsx` - 批量添加
- [ ] 提取 `EditRoomDialog.tsx` - 编辑表单
- [ ] 提取 `DeleteRoomDialog.tsx` - 删除确认
- [ ] 重构主页面
- [ ] 功能验证

---

#### 2. ⬜ `leases/page.tsx` 拆分

**目标：** 将 567 行的租约管理页面拆分为多个组件

**拆分方案：**
```
/app/leases/
├── page.tsx                    # 主页面布局 + DataTable
├── components/
│   ├── CreateLeaseDialog.tsx   # 新增租约表单
│   ├── EditLeaseDialog.tsx     # 编辑租约表单
│   ├── TerminateDialog.tsx     # 终止确认
│   ├── DeleteLeaseDialog.tsx   # 删除确认
│   └── columns.tsx             # 表格列定义
```

**步骤：**
- [ ] 提取 `columns.tsx` - 表格列配置
- [ ] 提取 `CreateLeaseDialog.tsx` - 创建表单
- [ ] 提取 `EditLeaseDialog.tsx` - 编辑表单
- [ ] 提取 `TerminateDialog.tsx` - 终止确认
- [ ] 提取 `DeleteLeaseDialog.tsx` - 删除确认
- [ ] 重构主页面
- [ ] 功能验证

---

#### 3. ⬜ `settings/team/page.tsx` 拆分

**目标：** 将 531 行的团队设置页面拆分为多个组件

**拆分方案：**
```
/app/settings/team/
├── page.tsx                    # 主页面 + Tabs 布局
├── components/
│   ├── CreateOrgDialog.tsx     # 创建组织
│   ├── EditOrgDialog.tsx       # 编辑组织
│   ├── InviteMemberDialog.tsx  # 邀请成员
│   ├── RemoveMemberDialog.tsx  # 移除确认
│   ├── OrganizationCard.tsx    # 组织卡片
│   └── columns.tsx             # 成员表格列
```

**步骤：**
- [ ] 提取 `columns.tsx`
- [ ] 提取 `OrganizationCard.tsx`
- [ ] 提取 `CreateOrgDialog.tsx`
- [ ] 提取 `EditOrgDialog.tsx`
- [ ] 提取 `InviteMemberDialog.tsx`
- [ ] 提取 `RemoveMemberDialog.tsx`
- [ ] 重构主页面
- [ ] 功能验证

---

### P1 - 高优先级

#### 4. ⬜ `reports/page.tsx` 拆分

**目标：** 将 511 行的报表页面按 Tab 拆分

**拆分方案：**
```
/app/reports/
├── page.tsx                    # 主页面 + Tabs
├── components/
│   ├── OverviewTab.tsx
│   ├── IncomeTab.tsx
│   ├── OccupancyTab.tsx
│   └── charts/
│       ├── IncomeChart.tsx
│       └── OccupancyChart.tsx
```

**步骤：**
- [ ] 提取 `OverviewTab.tsx`
- [ ] 提取 `IncomeTab.tsx` + 图表
- [ ] 提取 `OccupancyTab.tsx` + 图表
- [ ] 重构主页面
- [ ] 功能验证

---

#### 5. ✅ `rooms/page.tsx` 拆分

**目标：** 将 642 行的房间管理页面拆分为多个组件

**拆分方案：**
```
/app/rooms/
├── page.tsx                    # 主页面布局 (345行)
├── components/
│   ├── room-stats-cards.tsx    # 统计卡片 (64行)
│   ├── room-filters.tsx        # 筛选组件 (152行)
│   ├── columns.tsx             # 表格列定义 (140行)
│   ├── EditRoomDialog.tsx      # 编辑房间 (169行)
│   ├── TerminateDialog.tsx     # 退租确认 (48行)
│   ├── DeleteRoomDialog.tsx    # 删除确认 (51行)
│   └── index.ts                # 导出
```

**步骤：**
- [x] 提取 `columns.tsx`
- [x] 提取 `EditRoomDialog.tsx`
- [x] 提取 `TerminateDialog.tsx`
- [x] 提取 `DeleteRoomDialog.tsx`
- [x] 重构主页面
- [x] 功能验证 (类型检查通过)

---

#### 6. ✅ `utilities/page.tsx` 拆分

**目标：** 将 676 行的水电录入页面拆分为多个组件

**拆分方案：**
```
/app/utilities/
├── page.tsx                    # 主页面布局 + DataTable (198行)
├── components/
│   ├── CreateUtilityDialog.tsx # 录入水电读数 (222行)
│   ├── EditUtilityDialog.tsx   # 编辑水电读数 (150行)
│   ├── BatchImportDialog.tsx   # 批量导入 (188行)
│   ├── columns.tsx             # 表格列定义 (72行)
│   └── index.ts                # 导出
```

**步骤：**
- [x] 提取 `columns.tsx`
- [x] 提取 `CreateUtilityDialog.tsx`
- [x] 提取 `EditUtilityDialog.tsx`
- [x] 提取 `BatchImportDialog.tsx`
- [x] 重构主页面
- [x] 功能验证 (类型检查通过)

---

### P2 - 中等优先级

#### 7. ⬜ `tenants/page.tsx` 拆分

**步骤：**
- [ ] 提取 `columns.tsx`
- [ ] 提取 `CreateTenantDialog.tsx`
- [ ] 提取 `EditTenantDialog.tsx`
- [ ] 提取 `DeleteTenantDialog.tsx`
- [ ] 重构主页面
- [ ] 功能验证

---

#### 8. ⬜ `bills/page.tsx` 拆分

**步骤：**
- [ ] 提取 `columns.tsx`
- [ ] 提取 `PaymentDialog.tsx`
- [ ] 提取 `BillStatsCards.tsx`
- [ ] 重构主页面
- [ ] 功能验证

---

#### 9. ⬜ `apartments/page.tsx` 拆分

**步骤：**
- [ ] 提取 `columns.tsx`
- [ ] 提取 `CreateApartmentDialog.tsx`
- [ ] 提取 `EditApartmentDialog.tsx`
- [ ] 提取 `DeleteApartmentDialog.tsx`
- [ ] 重构主页面
- [ ] 功能验证

---

## 目录结构规范

每个功能模块采用以下结构：

```
/app/[module]/
├── page.tsx                    # 主页面（~100行）
├── components/
│   ├── CreateDialog.tsx        # 创建对话框
│   ├── EditDialog.tsx          # 编辑对话框
│   ├── DeleteDialog.tsx        # 删除确认（可选）
│   └── columns.tsx             # 表格列定义
```

## 预期效果

| 指标 | 重构前 | 重构后 |
|-----|-------|-------|
| 最大文件行数 | ~570行 | ~150行 |
| 组件职责 | 混合 | 单一 |
| 可复用性 | 低 | 高 |
| 测试难度 | 高 | 低 |

---

## 风险与对策

| 风险 | 影响 | 对策 |
|-----|------|------|
| 重构过程引入 bug | 高 | 每个页面独立重构，完成后验证 |
| 组件间通信复杂 | 中 | 统一使用 props + callback 模式 |
| 过度拆分 | 低 | 保持合理粒度，单个组件不超过 150 行 |

---

## 更新日志

| 日期 | 变更内容 |
|-----|---------|
| 2026-02-27 | 完成 `rooms/page.tsx` 拆分：642行 → 345行，提取6个组件 |
| 2026-02-27 | 完成 `utilities/page.tsx` 拆分：676行 → 198行，提取4个组件 |
| 2026-02-27 | 新增公寓详情页拆分任务（P0 最高优先级），更新各页面行数统计 |
| 2026-02-26 | 初始创建 |
