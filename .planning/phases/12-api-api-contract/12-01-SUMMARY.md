---
phase: 12-api-api-contract
plan: '01'
subsystem: api
tags: [api-contract, typescript, prisma, decimal-serialization, apartment]

# Dependency graph
requires: []
provides:
  - BillFeeItem 类型统一从 @/types 导入，前端类型来源一致性
  - RoomStats 从 @apartment-ultra/api-contract 导入，类型定义集中化
  - Decimal 字段（land_area, total_area, landlord_rent, operating_cost）在 API 响应中序列化为 number
affects: [12-02, api-contract, tenant-web, admin-web]

# Tech tracking
tech-stack:
  added: []
  patterns: [Decimal转number序列化, api-contract类型集中化, @/types统一导入]

key-files:
  created: []
  modified:
    - tenant-web/src/lib/api/bills.ts
    - tenant-web/src/lib/bills/share.ts
    - tenant-web/src/app/bills/page.tsx
    - admin-web/src/lib/api/bills.ts
    - api/src/repositories/apartment.repo.ts
    - api/src/services/apartment.service.ts

key-decisions:
  - "ApartmentWithStats 保留在 apartment.repo.ts 本地扩展（保留 rooms 数组），RoomStats 从 api-contract 导入"
  - "Decimal 序列化使用 Number() 转换，配合 as Type 类型断言解决 Prisma 类型兼容问题"
  - "BillFeeItem 在 tenant-web 和 admin-web 中统一从 @/types 导入，与项目其他类型保持一致"

patterns-established:
  - "Prisma Decimal 字段在 service 层转换为 number 再返回前端"
  - "api-contract 类型优先原则：已导出的类型不再本地重复定义"

requirements-completed: [AC-12-01, AC-12-02, AC-12-03]

# Metrics
duration: 20min
completed: 2026-03-20
---

# Phase 12 Plan 01: 对齐api数据结构和api-contract Summary

**统一 BillFeeItem 导入来源、从 api-contract 导入 RoomStats、Decimal 字段序列化为 number**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-20T07:10:00Z
- **Completed:** 2026-03-20T07:30:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- BillFeeItem 在 tenant-web 和 admin-web 的 4 个文件中统一从 `@/types` 导入，消除与 `@apartment-ultra/api-contract` 直接导入的不一致
- api/src/repositories/apartment.repo.ts 的 RoomStats 从 `@apartment-ultra/api-contract` 导入，类型定义与契约对齐
- api/src/services/apartment.service.ts 的 listByOrg 和 getById 方法对 Decimal 字段（land_area, total_area, landlord_rent, operating_cost）进行 Number() 转换，API 响应类型与 api-contract 定义一致

## Task Commits

Each task was committed atomically:

1. **Task 1: 统一 BillFeeItem 导入来源** - `e2d2926` (fix)
2. **Task 2: 统一 ApartmentWithStats 和 RoomStats 导入来源** - `8b77a4d` (refactor)
3. **Task 3: 修复 Prisma Decimal 字段序列化** - `ca486d3` (feat)

**Plan metadata:** `216a347` (docs: create plan)

## Files Created/Modified

- `tenant-web/src/lib/api/bills.ts` - BillFeeItem 导入改为 @/types
- `tenant-web/src/lib/bills/share.ts` - BillFeeItem 导入改为 @/types
- `tenant-web/src/app/bills/page.tsx` - BillFeeItem 导入改为 @/types
- `admin-web/src/lib/api/bills.ts` - BillFeeItem 导入改为 @/types
- `api/src/repositories/apartment.repo.ts` - 删除本地 RoomStats 定义，改为从 api-contract 导入
- `api/src/services/apartment.service.ts` - listByOrg 和 getById 添加 Decimal→number 序列化逻辑

## Decisions Made

- **ApartmentWithStats 本地保留理由：** api-contract 的 ApartmentWithStats 不含 rooms 数组字段，repo 层需要 rooms 做 room_stats 计算，保留本地扩展
- **Decimal 序列化方案：** 使用 `as ApartmentWithStats` 类型断言处理 Prisma Decimal 类型与 api-contract number 类型的兼容问题，确保运行时类型正确
- **BillFeeItem 导入统一：** 通过 `@/types`（即 `@apartment-ultra/api-contract` 的 re-export）导入，保持与项目中其他类型导入方式一致

## Deviations from Plan

**None - plan executed exactly as written**

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript 类型检查失败**
- **Found during:** Task 3 (修复 Prisma Decimal 字段序列化)
- **Issue:** listByOrg 和 getById 的返回类型与 ApartmentService 接口不兼容。Prisma Decimal 类型与 api-contract 定义的 number 类型无法直接赋值
- **Fix:** 添加显式返回类型标注 `(apt): ApartmentWithStats =>` 和 `as ApartmentWithStats` / `as ApartmentWithRooms` 类型断言，使 TypeScript 正确推断 Decimal→number 转换后的类型
- **Files modified:** api/src/services/apartment.service.ts
- **Verification:** `pnpm exec tsc --noEmit` 在 api 目录通过，无错误输出
- **Committed in:** `ca486d3` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 类型断言修复是 TypeScript 类型系统与 Prisma 生成的 Decimal 类型之间的工程兼容问题，不影响运行时行为。

## Issues Encountered

- Prisma Decimal 类型与 api-contract number 类型在 TypeScript 类型层级不兼容，需要通过显式类型断言解决（已作为 Rule 3 auto-fix 处理）

## Next Phase Readiness

- api-contract 类型对齐完成，Decimal 序列化已落地
- Phase 12-02 可基于本次对齐结果继续处理其他未发现的类型缺口
- api 层类型检查通过，可安全继续

---
*Phase: 12-api-api-contract*
*Completed: 2026-03-20*
