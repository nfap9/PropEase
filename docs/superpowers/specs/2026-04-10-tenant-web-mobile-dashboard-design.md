# Tenant-web 移动端首页适配设计方案

## 1. 概述

对 tenant-web 首页进行移动端适配，将图表替换为数字，采用数字仪表盘布局。桌面端保持现有图表体验不变。

**需求**：
- 首页重新设计，其他功能页面保持不变
- 首页需要显示：房间状态、账单状态、营收数据、待处理提醒
- 营收数据显示年度 + 月度汇总
- 移动端采用数字仪表盘布局（4个核心数字横排）

## 2. 移动端首页布局

### 2.1 整体结构

```
┌─────────────────────────────────┐
│         快速操作入口            │
│  [水电费] [收款] [账单] [签约]  │
├─────────────────────────────────┤
│         数字仪表盘              │
│  房间数 │  待付  │  营收  │ 提醒 │
│   3/10 │   5    │  ¥12K  │  2   │
└─────────────────────────────────┘
```

### 2.2 数字仪表盘（4个核心指标横排）

| 指标 | 移动端显示 | 详情展开 |
|------|-----------|---------|
| 房间状态 | `3/10` 可用房间数 | 房间列表（按公寓分组） |
| 账单状态 | `5` 待支付账单数 | 账单列表（状态分类） |
| 营收数据 | `¥12,000` 本月应收 | 年度汇总 + 本月明细 |
| 待处理提醒 | `2` 待处理数 | 提醒详情列表 |

### 2.3 桌面端布局（保持不变）

保持现有 `dashboard-content.tsx` 的 2x2 卡片网格布局，图表正常显示。

## 3. 营收数字展示

### 3.1 年度汇总

| 指标 | 字段 |
|------|------|
| 年度总应收 | `billedAmount` |
| 年度已收金额 | `collectedAmount` |

### 3.2 本月数据

从当前月份账单统计：
- 本月应收
- 本月实收

## 4. 改动范围

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/app/dashboard/dashboard-content.tsx` | 修改 | 响应式改造，移动端隐藏图表/显示数字 |
| 新增 `src/components/layout/mobile-dashboard-stats.tsx` | 新增 | 数字仪表盘组件 |
| 其他页面 | 无需改动 | 已有响应式适配 |

## 5. 组件设计

### 5.1 MobileDashboardStats 组件

```tsx
interface MobileDashboardStatsProps {
  // 房间数据
  availableRooms: number;
  totalRooms: number;
  roomList: { apartment?: string; room_number: string }[];

  // 账单数据
  pendingBills: number;
  billStats: { billedAmount: number; collectedAmount: number; estimatedTotal: number };

  // 营收数据
  yearlyRevenue: { billed: number; collected: number };
  monthlyRevenue: { billed: number; collected: number };

  // 提醒数据
  reminders: { label: string; count: number; href: string }[];
}
```

### 5.2 交互设计

- **数字卡片**：点击展开详情面板
- **展开面板**：使用 Accordion 组件，支持单项展开
- **数据加载**：骨架屏占位

## 6. 实现步骤

1. 创建 `MobileDashboardStats` 组件
2. 修改 `dashboard-content.tsx`，添加移动端/桌面端条件渲染
3. 使用 `hidden sm:block` 切换图表与数字视图
4. 测试移动端和桌面端布局

## 7. 技术约束

- 使用现有 Tailwind CSS 响应式工具（`sm:`, `md:`, `lg:`）
- 复用现有 shadcn/ui 组件（Card, Accordion, Badge）
- 不修改 API 调用逻辑，数据结构不变
