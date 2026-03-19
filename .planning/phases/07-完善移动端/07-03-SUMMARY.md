---
phase: 07-完善移动端
plan: "03"
subsystem: ui
tags: [expo-router, react-native, component-extraction, navigation]

requires:
  - phase: "07-02"
    provides: Tamagui base components (Card, Button, ListItem, Header), Colors design tokens

provides:
  - 4-tab navigation (首页/房源/账单/我的) removing customers tab
  - Bills sub-components: BillCard, FilterTabs, BillSearchBar in mobile/components/bills/
  - Profile page with common settings section (费用配置/消息通知/经营报表)
  - Bills page embeds customer entry link

affects: [07-04, mobile]

tech-stack:
  added: []
  patterns:
    - Sub-component extraction pattern for large page files (same as utilities.tsx in 07-02)
    - Barrel exports per component directory (mobile/components/bills/index.ts)

key-files:
  created:
    - mobile/components/bills/BillCard.tsx
    - mobile/components/bills/FilterTabs.tsx
    - mobile/components/bills/BillSearchBar.tsx
    - mobile/components/bills/index.ts
  modified:
    - mobile/app/(tabs)/_layout.tsx (removed customers tab)
    - mobile/app/(tabs)/bills.tsx (refactored to use sub-components, added customer entry)
    - mobile/app/(tabs)/profile.tsx (added common settings section)

key-decisions:
  - "Keep bills.tsx core logic (useQuery, mutation, stats computation) in main file while extracting UI components"
  - "Customer entry embedded in BillSearchBar component (renders in bills page header)"

patterns-established:
  - "Sub-component extraction pattern: extract UI parts to components/, keep business logic in page file"

requirements-completed: [MOBILE-05, MOBILE-06]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 07 Plan 03: Tab导航重构与bills.tsx拆分总结

**移动端Tab导航从5个缩减为4个，账单页面内嵌客户入口，bills.tsx从379行拆分为178行**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T16:49:32Z
- **Completed:** 2026-03-20T16:51:47Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Tab导航从5个缩减为4个（移除客户Tab，保留首页/房源/账单/我的）
- 账单页面内嵌客户入口（顶部右侧快捷按钮，路由到 /customers）
- bills.tsx 从 379 行拆分为 178 行（-53%），提取出 BillCard、FilterTabs、BillSearchBar 三个子组件
- profile.tsx 增加常用设置区块（费用配置/消息通知/经营报表置顶）

## Task Commits

Each task was committed atomically:

1. **Task 1: Tab导航重构** - `f71725b` (feat)
2. **Task 2: bills.tsx拆分** - `6a898d4` (refactor)
3. **Task 3: profile.tsx设置入口** - `2da7339` (feat)

## Files Created/Modified

### Tab导航重构
- `mobile/app/(tabs)/_layout.tsx` - 移除 customers Tabs.Screen，从5个Tab减少到4个
- `mobile/app/(tabs)/bills.tsx` - 添加客户入口按钮（BillSearchBar组件内，顶部右侧）

### bills.tsx子组件拆分
- `mobile/components/bills/BillCard.tsx` - 账单卡片组件（显示金额、状态、收款按钮）
- `mobile/components/bills/FilterTabs.tsx` - 账单状态筛选Tab（全部/待支付/已支付/逾期）
- `mobile/components/bills/BillSearchBar.tsx` - 账单页顶部搜索区（含客户入口快捷按钮）
- `mobile/components/bills/index.ts` - 统一导出
- `mobile/app/(tabs)/bills.tsx` - 重构为178行主文件，导入子组件

### profile.tsx设置入口
- `mobile/app/(tabs)/profile.tsx` - 增加常用设置区块，按使用频率排序

## Decisions Made

- bills.tsx 保留核心业务逻辑（useQuery数据获取、mutation提交、统计计算），UI组件提取到子文件
- 客户入口嵌入到 BillSearchBar 组件内，随账单页面搜索区一同渲染
- 常用设置按使用频率排序（费用配置→消息通知→经营报表→团队管理→财务管理→系统设置）

## Deviations from Plan

**None - plan executed exactly as written.**

No auto-fixes were required during execution. All three tasks completed as specified.

## Issues Encountered

None

## Next Phase Readiness

- Tab导航结构稳定，子组件提取模式已在两个大文件（utilities.tsx、bills.tsx）中验证
- bills.tsx 子组件结构清晰，可进一步在后续 Phase 中用 Tamagui 组件替换内联样式
- 客户路由 /customers 仍然可访问（通过账单页面或首页快捷入口）

---
*Phase: 07-完善移动端 Plan 03*
*Completed: 2026-03-20*
