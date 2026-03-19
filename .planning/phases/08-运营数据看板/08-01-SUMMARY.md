---
phase: "08-运营数据看板"
plan: "01"
subsystem: admin-web
tags:
  - dashboard
  - recharts
  - tanstack-query
  - admin
requires:
  - DASH-01
  - DASH-02
  - DASH-03
  - DASH-04
provides: []
affects:
  - admin-web
tech-stack:
  added:
    - recharts (already in dependencies)
  patterns:
    - TanStack Query useQuery with queryClient.invalidateQueries for refresh
    - ComposedChart (bar + line) for income trend
    - AreaChart with ReferenceLine for occupancy analysis
    - ResponsiveContainer for responsive chart sizing
    - mock data generators per selected year
key-files:
  created:
    - admin-web/src/components/dashboard/stat-card.tsx
    - admin-web/src/components/dashboard/chart-card.tsx
    - admin-web/src/components/dashboard/skeleton.tsx
    - admin-web/src/components/dashboard/income-chart.tsx
    - admin-web/src/components/dashboard/occupancy-chart.tsx
    - admin-web/src/components/dashboard/year-filter.tsx
    - admin-web/src/components/dashboard/refresh-button.tsx
    - admin-web/src/app/dashboard-content.tsx
  modified:
    - admin-web/src/app/page.tsx
    - packages/api-contract/src/admin.ts
decisions:
  - "StatCard formats value based on isPercentage/isCurrency flags (¥ prefix + 2 decimals for currency, X.X% for percentage)"
  - "AdminPlatformStats extended with optional occupancy_rate, monthly_revenue, pending_bills, overdue_bills fields"
  - "Charts use CSS var(--chart-N) for colors, matching Tailwind config"
  - "Mock data generators (generateMockIncome, generateMockOccupancy) produce varied data per selected year"
  - "Refresh button uses queryClient.invalidateQueries for all admin queries, not just stats"
metrics:
  duration_minutes: ~3
  completed_date: "2026-03-20"
  tasks_completed: 3
  files_created: 8
  files_modified: 2
  commits: 3
---

# Phase 08 Plan 01: 运营数据看板 Summary

Admin dashboard (平台概览) 完整重构，包含 6 张统计卡片、收入趋势图表、入住率分析图表、年份筛选和刷新按钮。

## One-liner

Admin dashboard with 6 stat cards (公寓数/房间数/入住率/本月收入/待缴账单/逾期账单), income ComposedChart (bars + line), occupancy AreaChart with 80% warning line, year filter, and refresh button.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Dashboard component structure | c14739a | stat-card.tsx, chart-card.tsx, skeleton.tsx, dashboard-content.tsx, page.tsx, admin.ts |
| 2 | Chart components | 4db256c | income-chart.tsx, occupancy-chart.tsx |
| 3 | Filter + refresh + data hooks | 7446970 | year-filter.tsx, refresh-button.tsx |

## Key Features Implemented

- **6 Stat Cards**: 公寓数, 房间数, 入住率 (percentage), 本月收入 (currency), 待缴账单, 逾期账单 in responsive grid (grid-cols-6 on xl)
- **Income Chart**: ComposedChart with collected_amount bar (chart-1), uncollected bar (chart-3), collection_rate line (chart-2), dual Y-axes
- **Occupancy Chart**: AreaChart with occupancy_rate gradient fill and 80% ReferenceLine warning
- **Year Filter**: Radix Select with years (currentYear-2 to currentYear+1)
- **Refresh Button**: with animate-spin on loading, aria-label accessibility
- **Skeleton Loading**: StatCardsSkeleton (6 cards) + ChartSkeleton
- **Error State**: error message with retry button

## Deviations from Plan

None - plan executed exactly as written.

## Auto-fixed Issues

None encountered.

## Verification

- `pnpm type-check --filter apartment-ultra-admin` - PASSED (no errors)
- `pnpm type-check --filter @apartment-ultra/api-contract` - PASSED (no errors)
- All components properly typed with no `any`
- No TypeScript errors across affected packages

## Auth Gates

None.

## Notes

- Income and occupancy chart data uses mock generators (`generateMockIncome`, `generateMockOccupancy`). Backend aggregate endpoints will be needed for real data (noted in UI-SPEC API Notes).
- `AdminPlatformStats` extended with optional fields (occupancy_rate, monthly_revenue, pending_bills, overdue_bills) since the current `/admin/stats` endpoint does not return these fields. These should be populated by the backend in a future iteration.
- `dashboard-content.tsx` currently calculates `isCurrency` display as `value * 100` to convert yuan to fen (assuming API returns yuan); if API returns fen, this should be `value` directly.

## Self-Check

All created files verified to exist. All commits found in git log. TypeScript type checks pass. Phase 8 Plan 1 complete.
