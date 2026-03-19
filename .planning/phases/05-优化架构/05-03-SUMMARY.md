---
phase: 05-优化架构
plan: '03'
subsystem: api
tags: [express, typescript, controller, router, refactor]

requires:
  - phase: '05-01'
    provides: Thin routes + fat controllers architectural decision established

provides:
  - api/src/routes/v1/apartments.controller.ts — 所有 apartment 路由处理逻辑
  - api/src/routes/v1/organizations.controller.ts — 所有 organization 路由处理逻辑
  - api/src/routes/v1/bills.controller.ts — 所有 bill 路由处理逻辑
  - api/src/routes/v1/subscriptions.controller.ts — 所有 subscription 路由处理逻辑
  - api/src/routes/v1/admin/admin.controller.ts — 所有 admin 路由处理逻辑

affects:
  - phase 05 (架构优化)
  - api routes (maintainability)

tech-stack:
  added: []
  patterns:
    - Thin routes + fat controllers (路由只保留路由定义，处理逻辑移至 controller)

key-files:
  created:
    - api/src/routes/v1/apartments.controller.ts
    - api/src/routes/v1/organizations.controller.ts
    - api/src/routes/v1/bills.controller.ts
    - api/src/routes/v1/subscriptions.controller.ts
    - api/src/routes/v1/admin/admin.controller.ts
  modified:
    - api/src/routes/v1/apartments.ts
    - api/src/routes/v1/organizations.ts
    - api/src/routes/v1/bills.ts
    - api/src/routes/v1/subscriptions.ts
    - api/src/routes/v1/admin/index.ts

key-decisions:
  - admin.controller.ts 放在 admin/ 子目录下（与 index.ts 同目录），保持与原有 `../../../` 导入路径一致
  - 路由文件使用 `Router as RouterType` 类型注解解决 TS2742 推断错误
  - delete 函数命名为 `del` 以避免与内置关键字冲突

patterns-established:
  - "Thin routes: 路由文件只保留 router.get/post/put/delete 挂载语句（5-72行）"
  - "Fat controllers: controller 文件包含所有 handler 函数 + schemas + 必要的 service/prisma 导入"
  - "Schema co-location: schemas 与 handlers 同文件，便于阅读和维护"

requirements-completed: []

# Phase 05 Plan 03: 薄路由 + 厚控制器 Summary

**5 个 API 路由文件重构为薄路由，所有处理逻辑提取至独立 controller 文件**

## Performance

- **Duration:** 9 min (542 sec)
- **Started:** 2026-03-19T09:38:23Z
- **Completed:** 2026-03-19T09:47:25Z
- **Tasks:** 5
- **Files created:** 5 controller files (1744 lines total)
- **Files modified:** 5 route files (reduced from 3601 lines to 178 lines)

## Accomplishments

- 5 个路由文件全部变为薄路由（36/22/20/28/72 行）
- 5 个 controller 文件包含所有处理逻辑和 schemas（428/363/264/259/430 行）
- TypeScript 编译零错误通过
- admin.controller.ts 置于 admin/ 子目录以保持正确的相对导入路径

## Task Commits

Each task was committed atomically:

1. **Task 1: 提取 apartments 路由到 apartments.controller.ts** — `0bea829` (refactor)
2. **Task 2: 提取 organizations 路由到 organizations.controller.ts** — `88a3a21` (refactor)
3. **Task 3: 提取 bills 路由到 bills.controller.ts** — `f357f09` (refactor)
4. **Task 4: 提取 subscriptions 路由到 subscriptions.controller.ts** — `d49b84b` (refactor)
5. **Task 5: 提取 admin 路由到 admin.controller.ts** — `fb7c378` (refactor)
6. **Fix: 修复导入路径和类型注解** — `ed16075` (fix)

**Plan metadata commit:** `ed16075` (fix: correct import paths and type annotations)

## Files Created/Modified

| File | Before | After | Change |
|------|--------|-------|--------|
| `api/src/routes/v1/apartments.ts` | 1136 lines | 36 lines | -1100 lines |
| `api/src/routes/v1/organizations.ts` | 782 lines | 22 lines | -760 lines |
| `api/src/routes/v1/bills.ts` | 639 lines | 20 lines | -619 lines |
| `api/src/routes/v1/subscriptions.ts` | 614 lines | 28 lines | -586 lines |
| `api/src/routes/v1/admin/index.ts` | 469 lines | 72 lines | -397 lines |
| `api/src/routes/v1/apartments.controller.ts` | new | 428 lines | +428 lines |
| `api/src/routes/v1/organizations.controller.ts` | new | 363 lines | +363 lines |
| `api/src/routes/v1/bills.controller.ts` | new | 264 lines | +264 lines |
| `api/src/routes/v1/subscriptions.controller.ts` | new | 259 lines | +259 lines |
| `api/src/routes/v1/admin/admin.controller.ts` | new | 430 lines | +430 lines |

## Verification Results

- `pnpm --filter apartment-ultra-api exec tsc --noEmit` — PASSED (zero errors)
- 所有路由文件 < 50 行（admin/index.ts 为 72 行，保留中间件和子路由挂载）
- 所有 controller 文件 > 200 行

## Decisions Made

- admin.controller.ts 放在 `api/src/routes/v1/admin/admin.controller.ts` 而非 `api/src/routes/v1/admin.controller.ts`，以保持与 admin/index.ts 内部其他文件相同的相对导入深度（`../../../utils` 等）
- 使用 `Router as RouterType` 类型别名解决 Express Router 类型推断问题（TS2742）
- 删除函数命名 `del` 而非 `delete`，避免与 JavaScript 保留字冲突

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 修复 organizations.controller.ts 缺少闭合括号**
- **Found during:** Task 2 verification
- **Issue:** `prisma.bill.count()` 调用中 `where` 对象缺少闭合 `}`
- **Fix:** 添加缺失的 `}` 使对象闭合
- **Files modified:** `api/src/routes/v1/organizations.controller.ts`
- **Verification:** `tsc --noEmit` 通过
- **Committed in:** `ed16075` (fix commit)

**2. [Rule 3 - Blocking] admin.controller.ts 导入路径错误**
- **Found during:** Task 5 verification
- **Issue:** admin.controller.ts 放在 `api/src/routes/v1/` 目录下时使用 `../../utils/context.js` 但 TypeScript 找不到；linter 自动修正后又变成 `../../../`（同样找不到）
- **Fix:** 将 admin.controller.ts 移入 `api/src/routes/v1/admin/` 子目录，保持与 index.ts 相同的导入路径约定
- **Files modified:** admin.controller.ts (moved), admin/index.ts (import path)
- **Verification:** `tsc --noEmit` 通过
- **Committed in:** `ed16075` (fix commit)

**3. [Rule 3 - Blocking] 4 个路由文件类型推断错误**
- **Found during:** Fix verification
- **Issue:** TypeScript 无法推断 thin router 的返回类型（TS2742），需要显式类型注解
- **Fix:** 添加 `Router as RouterType` 类型别名和 `const router: RouterType = Router()` 注解
- **Files modified:** apartments.ts, organizations.ts, subscriptions.ts, bills.ts
- **Verification:** `tsc --noEmit` 通过
- **Committed in:** `ed16075` (fix commit)

---

**Total deviations:** 3 auto-fixed (all blocking/Rule 3)
**Impact on plan:** 所有自动修复均为构建阻断性问题，必须修复才能完成计划。无范围蔓延。

## Issues Encountered

- bills.controller.ts 在首次 Write 操作时报错但实际写入成功（linter 后续修正了导入路径）
- admin.controller.ts linter 反复将导入路径从 `../../` 改为 `../../../`，最终通过移动文件到 admin/ 子目录解决

## Next Phase Readiness

- 5 个主要路由文件全部完成薄路由重构
- API 层架构分离完成，可独立测试 controller 逻辑
- 准备好继续 Phase 05 其他计划

---
*Phase: 05-优化架构*
*Plan: 03*
*Completed: 2026-03-19*
