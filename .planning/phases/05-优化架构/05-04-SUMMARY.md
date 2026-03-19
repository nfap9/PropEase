---
phase: 05-优化架构
plan: '04'
subsystem: infra
tags: [pino, structured-logging, observability, nodejs]

requires:
  - phase: 05-01
    provides: api-contract single source for permission codes

provides:
  - pino logger singleton with request ID support
  - All services (bill, lease, billGeneration, wechatPay) using structured logger
  - All scheduler modules (index, notificationChecks, monthlyBills) using structured logger
  - audit.ts using structured logger

affects: [05-优化架构, observability]

tech-stack:
  added: [pino]
  patterns: [structured logging, pino child loggers]

key-files:
  created:
    - api/src/utils/logger.ts
  modified:
    - api/src/index.ts
    - api/src/services/bill.service.ts
    - api/src/services/lease.service.ts
    - api/src/services/billGeneration.ts
    - api/src/services/wechatPayNative.ts
    - api/src/scheduler/index.ts
    - api/src/scheduler/notificationChecks.ts
    - api/src/scheduler/monthlyBills.ts
    - api/src/utils/audit.ts

key-decisions:
  - "使用 pino 而非 winston（轻量、高性能、JSON 格式输出）"
  - "LOG_LEVEL 从环境变量读取，默认 info"
  - "Logger 包含 base.service 字段标识服务名"
  - "结构化日志以 { err, ...context } 格式记录错误"

patterns-established:
  - "Pattern: logger.error({ err, ...context }, 'message') — 错误日志带上下文对象"
  - "Pattern: logger.info({ stats }, 'message') — 统计/成功日志带结构化数据"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 05 Plan 04: 结构化日志系统 Summary

**使用 pino 替换所有 services 和 scheduler 中的 console.log/error，实现 JSON 结构化日志输出**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T09:50:16Z
- **Completed:** 2026-03-19T09:53:01Z
- **Tasks:** 5
- **Files modified:** 10 (1 created, 9 modified)

## Accomplishments

- 创建 api/src/utils/logger.ts，导出 pino logger 实例及 request ID 工具函数
- 所有 services 中的 console.error 替换为 logger.error（带结构化上下文）
- 所有 scheduler 中的 console.log/error 替换为 logger（info/error）
- audit.ts 中的 console.log 替换为 logger.info（保留结构化格式）
- TypeScript 编译通过，无错误

## Task Commits

1. **Task 1: 创建 api/src/utils/logger.ts** - `fabb864` (feat)
2. **Task 2: 在 api/src/index.ts 初始化 logger** - `892b541` (refactor)
3. **Task 3: 替换 services 中的 console.error** - `5fdc8a6` (refactor)
4. **Task 4: 替换 scheduler 中的 console.log/error** - `daa9122` (refactor)
5. **Task 5: 替换 audit.ts 中的 console.log** - `5e92a6c` (refactor)

**Plan metadata:** `5e92a6c` (docs: complete plan)

## Files Created/Modified

- `api/src/utils/logger.ts` - pino logger 单例，导出 logger, setRequestId, getRequestId, child
- `api/src/index.ts` - 导入 logger，替换启动失败的 console.error 和启动成功的 console.log
- `api/src/services/bill.service.ts` - 账单生成 SMS 失败时用 logger.error 记录
- `api/src/services/lease.service.ts` - 租客入住/退租通知失败时用 logger.error 记录
- `api/src/services/billGeneration.ts` - 账单生成 SMS 失败时用 logger.error 记录
- `api/src/services/wechatPayNative.ts` - 微信支付下单失败时用 logger.error 记录
- `api/src/scheduler/index.ts` - 4 个定时任务的 console.log/error 均替换为 logger
- `api/src/scheduler/notificationChecks.ts` - 逾期账单和交租提醒 SMS 失败时用 logger.error 记录
- `api/src/scheduler/monthlyBills.ts` - 月度账单生成错误时用 logger.error 记录
- `api/src/utils/audit.ts` - 审计日志从 console.log 改为 logger.info

## Decisions Made

- 使用 pino 而非 winston（轻量、高性能、JSON 格式输出）
- LOG_LEVEL 从环境变量读取，默认 info
- Logger 包含 base.service 字段标识服务名
- 结构化日志以 `{ err, ...context }` 格式记录错误

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Verification

- `pnpm --filter apartment-ultra-api exec tsc --noEmit` — 无错误
- `grep -c "console" api/src/services/bill.service.ts api/src/services/lease.service.ts api/src/services/billGeneration.ts api/src/services/wechatPayNative.ts` — 全部为 0
- `grep -c "console" api/src/scheduler/index.ts api/src/scheduler/notificationChecks.ts api/src/scheduler/monthlyBills.ts` — 全部为 0
- `grep "logger" api/src/index.ts` — 4 处匹配（1 个 import + 3 处调用）

## Self-Check

- [x] All 5 tasks committed individually with proper format
- [x] SUMMARY.md created at .planning/phases/05-优化架构/05-04-SUMMARY.md
- [x] STATE.md updated with decisions
- [x] ROADMAP.md updated with plan progress
- [x] Final commit made

---
*Phase: 05-优化架构*
*Completed: 2026-03-19*
