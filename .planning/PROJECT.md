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

### Process Gaps (Noted)

- Phases 1-4 lack formal VERIFICATION.md (only Phase 5 has one)
- REQUIREMENTS.md traceability table was not maintained
- Integration checker was not run during execution

---

## Next Milestone

Next milestone not yet planned. Use `/gsd:new-milestone` to start.

---
*Last updated: 2026-03-19 after v1.0 milestone completion*
