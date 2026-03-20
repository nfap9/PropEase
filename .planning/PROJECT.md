# Apartment Ultra

## What This Is

公寓管理产品，核心能力包括：房源、公寓、房间、租客、租约管理、账单、水电和报表、平台运营、服务定价、商店配置与订阅能力。

## Core Value

高效的公寓管理体验 — 让房东和租客都能直观地完成日常操作。

---

## Milestone v1.0 MVP (SHIPPED 2026-03-19)

**Archive:** See `.planning/milestones/v1.0-ROADMAP.md`

### What Was Built

- Settings 布局统一（面包屑导航）
- 设置页面链接修复和图标一致性
- /organizations 页面（创建/选择组织双模式）
- Next.js route groups (auth/dashboard)、可折叠侧边栏、登录/注册页面
- 架构优化：api-contract 权限单一数据源、web-api-client 统一客户端、薄路由+厚控制器、pino 结构化日志
- E2E 测试：Dashboard 8 个 Playwright 测试用例覆盖页面加载、指标、待办、空状态

### Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js route groups | 分离公开/受保护路由 | ✓ Implemented |
| shadcn/ui Sidebar | 可折叠侧边栏 | ✓ Implemented |
| Thin routes + fat controllers | 路由文件精简 | ✓ Implemented |
| pino structured logging | 可观测性 | ✓ Implemented |
| api-contract SSOT | 权限代码 DRY | ✓ Implemented |

### Tech Debt (Known)

- `api/src/routes/v1/admin.controller.ts` orphaned duplicate file (Phase 05)
- `console.log/error` still in 5 files outside Plan 05-04 scope
- Mobile 原型 (mobile/) 尚未接入根级质量门
- (dashboard) route group AuthGuard unused — all pages use PermissionPageGuard instead (no security issue)
- No dedicated login/register E2E test file

### Process Gaps (Noted)

- Phases 1-4 and 6 lack formal VERIFICATION.md (only Phase 5 has one)
- REQUIREMENTS.md traceability table was not maintained
- Integration checker was not run during initial execution (run retroactively during audit)
- Phase 4 SUMMARY naming inconsistency (phase-04-plan-XX vs 04-XX)

---

## Milestone v1.1: 运营后台

**Goal:** 完善运营后台功能，与租户端对标，提供平台级管理能力

**Target features:**
- 运营数据看板（全局统计、收入分析） ← Phase 08 ✓
- 组织管理（CRUD、成员管理） ← Phase 09
- 系统配置（费用模板、通知配置） ← Phase 10
- 运营后台 E2E 测试 ← Phase 11

---

### Phase 12 Technical Improvement (Completed 2026-03-20)

- api 数据结构和 api-contract 对齐完成
  - BillFeeItem 类型统一从 @/types 导入（4个前端文件）
  - RoomStats 从 @apartment-ultra/api-contract 导入
  - Decimal 字段在 API 响应中序列化为 number

---

## Next Milestone

Next milestone not yet planned. Use `/gsd:new-milestone` to start.

---
*Last updated: 2026-03-20 after Phase 12 completion*
