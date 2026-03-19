---
phase: 07-完善移动端
plan: "01"
subsystem: mobile
tags: [mobile, typescript, auth, race-condition]
dependency_graph:
  requires: []
  provides:
    - path: mobile/services/api/client.ts
      provides: Token refresh with singleton lock mechanism
    - path: mobile/app/(tabs)/customers.tsx
      provides: Tenant list with proper TenantWithLease typing
    - path: mobile/app/settings/reports.tsx
      provides: Reports page with DashboardOverview typing
tech_stack:
  added:
    - singleton lock pattern for async token refresh
    - TenantWithLease interface extending Tenant with lease[] and gender
    - DashboardOverview type from api-contract
  patterns:
    - singleflight pattern for concurrent refresh token requests
key_files:
  created:
    - mobile/app/customers/new/index.tsx (stub route)
    - mobile/app/customers/[id]/index.tsx (stub route)
  modified:
    - mobile/services/api/client.ts
    - mobile/services/api/tenants.ts
    - mobile/services/api/reports.ts
    - mobile/services/api/index.ts
    - mobile/app/(tabs)/customers.tsx
    - mobile/app/settings/reports.tsx
    - mobile/.expo/types/router.d.ts
decisions:
  - Singleton lock (refreshLock) for token refresh prevents concurrent requests from each triggering a separate refresh
  - TenantWithLease includes optional gender field (from API) and lease array (from API response)
  - Stub route files created for /customers/new and /customers/[id] to enable type-safe router navigation
  - expo-router type declarations manually updated to include new customer routes
metrics:
  duration: ~361s
  completed: "2026-03-20T00:39:09Z"
  tasks_completed: 3
  files_modified: 8
  commits: 3
---

# Phase 07 Plan 01 Summary: 修复移动端 Token 竞态和类型安全

**One-liner:** Singleton lock for token refresh + proper TypeScript types replacing all `any` types in mobile API client and screens

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | 修复 client.ts Token 刷新竞态 | 989d965 | mobile/services/api/client.ts |
| 2 | 修复 customers.tsx 类型安全 | 2bef1ef | mobile/app/(tabs)/customers.tsx, mobile/services/api/tenants.ts, mobile/services/api/index.ts, mobile/app/customers/new/index.tsx, mobile/app/customers/[id]/index.tsx |
| 3 | 修复 reports.tsx 类型安全 | 70fd650 | mobile/app/settings/reports.tsx, mobile/services/api/reports.ts, mobile/services/api/index.ts |

## What Was Built

### Task 1: Token Refresh Singleton Lock
在 `mobile/services/api/client.ts` 中实现了单例锁机制：
- 模块级 `refreshLock: Promise<boolean> | null` 变量
- `handleUnauthorized()` 使用锁机制：若已有刷新进行中则返回相同 Promise，所有并发 401 请求共享同一个刷新 Promise
- 401 重试时重新构建 `fetchOptions`（而不是修改闭包中的旧对象）

### Task 2: customers.tsx 类型安全
- 在 `mobile/services/api/tenants.ts` 中新增 `TenantWithLease` 接口：继承 `Tenant` 并添加 `lease?: Lease[]` 和 `gender?: 'male' | 'female'`
- 从 `api/index.ts` 导出 `TenantWithLease`
- `useQuery` 类型标注为 `TenantWithLease[]`
- 所有内联回调类型（`{ is_active: boolean }`）替换为 `Lease` 类型
- 创建了 `/customers/new` 和 `/customers/[id]` 路由桩文件以支持类型安全的 router.push
- 更新 `.expo/types/router.d.ts` 添加新路由类型声明

### Task 3: reports.tsx 类型安全
- 从 `reports.ts` 和 `api/index.ts` 导出 `DashboardOverview` 类型
- 删除 `eslint-disable` 注释和 `OverviewData = any`
- `useQuery<DashboardOverview>` 替代 `useQuery<any>`

## Deviations from Plan

**1. [Rule 3 - Blocking] 创建缺失路由桩文件 + 更新 expo-router 类型声明**
- **Found during:** Task 2
- **Issue:** expo-router 的类型系统需要 `/customers/new` 和 `/customers/[id]` 路由在类型声明中存在，但 `.expo/types/router.d.ts` 不会自动更新
- **Fix:** 创建了路由桩文件 `mobile/app/customers/new/index.tsx` 和 `mobile/app/customers/[id]/index.tsx`，并手动更新了 `.expo/types/router.d.ts` 中的类型声明
- **Files modified:** 新增路由文件 + `.expo/types/router.d.ts`
- **Commit:** 2bef1ef

**2. [Rule 2 - Auto-add missing functionality] 添加 gender 字段到 TenantWithLease**
- **Found during:** Task 2
- **Issue:** `Tenant` 基类型没有 `gender` 字段，但 UI 使用 `tenant.gender === 'female'` 判断显示图标
- **Fix:** 在 `TenantWithLease` 中添加可选的 `gender?: 'male' | 'female'` 字段
- **Files modified:** mobile/services/api/tenants.ts
- **Commit:** 2bef1ef

## Verification

- `pnpm type-check:mobile` 通过，无类型错误
- `grep "refreshLock" mobile/services/api/client.ts` 确认单例锁存在
- `grep ": any" mobile/app/(tabs)/customers.tsx` 无结果
- `grep ": any" mobile/app/settings/reports.tsx` 无结果

## Self-Check: PASSED

All must_haves satisfied:
- [x] Token refresh uses singleton lock (refreshLock variable present)
- [x] customers.tsx uses TenantWithLease type instead of any
- [x] reports.tsx uses DashboardOverview type instead of any
- [x] All mobile code passes type-check with no any types in target files
