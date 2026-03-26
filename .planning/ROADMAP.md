# Roadmap: Apartment Ultra

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-03-20)
- 🚧 **v1.1** — 运营后台

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-7 | v1.0 MVP | 16/16 | Complete | 2026-03-20 |
| 8 | 1/1 | Complete | 2026-03-19 | - |
| 11 | 4/5 | 4/5 | Complete | 2026-03-20 | - |
| 12 | 1/1 | Complete | 2026-03-20 | - |
| 13 | 0/0 | Planned | Complete | 2026-03-21 |

### Phase 8: 运营数据看板

**Goal:** 实现运营后台仪表盘，展示全局统计数据、收入趋势、入住率分析
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Depends on:** Phase 7
**Plans:** 1/1 plans complete

Plans:
- [x] 08-01-PLAN.md — Dashboard UI: stat cards, charts, year filter, refresh (2026-03-20)

### Phase 9: 组织和成员管理

**Goal:** ~~实现平台级组织和成员管理功能~~ — **Skipped** (平台级组织管理不需要，租户端已有成员管理能力)
**Requirements**: ~~ORGM-01, ORGM-02, ORGM-03~~ — 不再需要
**Depends on:** Phase 8
**Plans:** 0 plans

Plans:
- [x] ~~TBD~~ — Skipped (2026-03-26)

### Phase 10: 系统配置

**Goal:** ~~实现费用模板、通知配置、默认角色配置~~ — **Skipped** (系统配置功能当前不需要)
**Requirements**: ~~SYSC-01, SYSC-02, ROLE-01~~ — 不再需要
**Depends on:** Phase 9
**Plans:** 0 plans

Plans:
- [x] ~~TBD~~ — Skipped (2026-03-26)

### Phase 11: 重新设计 admin-web E2E 测试架构

**Goal:** 重新设计 admin-web E2E 测试架构，解决 waitForTimeout 滥用、fixtures 绕过、断言薄弱、无测试数据隔离等核心问题
**Requirements**: (架构重构，无特定业务需求)
**Depends on:** Phase 8 (原为 Phase 10，2026-03-26 调整)
**Plans:** 4/5 plans complete

Plans:
- [x] 11-01-PLAN.md — Infrastructure: fixtures.ts worker-scoped adminPage, playwright.config.ts dual webServer, BaseAdminPage (2026-03-20)
- [x] 11-02-PLAN.md — Page Objects: 9 admin pages (Overview, Organizations, Plans, RegisteredUsers, Roles, Users, Subscriptions, Brand, Pricing) (2026-03-20)
- [x] 11-03-PLAN.md — Rewrite existing specs: overview, organizations, plans, users (2026-03-20)
- [x] 11-04-PLAN.md — New specs: roles, subscriptions, brand, pricing (2026-03-20)

### Phase 12: 对齐api数据结构和api-contract

**Goal:** 对齐 api 数据结构和 api-contract，消除 BillFeeItem 导入不一致、ApartmentWithStats 定义分散、Prisma Decimal 序列化类型不匹配三个主要缺口
**Requirements**: AC-12-01, AC-12-02, AC-12-03
**Depends on:** Phase 11
**Plans:** 1/1 plans complete

Plans:
- [ ] 12-01-PLAN.md — 修复 BillFeeItem 导入、RoomStats 导入、Decimal 序列化

### Phase 13: 统一settings页面返回和面包屑组件结构

**Goal:** 统一 /settings 下的页面返回按钮和面包屑组件结构
**Requirements**: TBD
**Depends on:** Phase 12
**Plans:** 0/1 plans complete

Plans:
- [x] TBD (run /gsd:plan-phase 13 to break down) (completed 2026-03-21)

### Phase 14: 完成 admin E2E 测试计划 11-05 (Gap Closure)

**Goal:** 定义并执行 Plan 11-05，关闭 Phase 11 遗留的测试深度缺口
**Gap Closure:** Closes gaps from v1.1 audit: admin-e2e-partial (Plan 11-05 未定义), phase-11-context-gaps (test data isolation, sidebar navigation, CRUD assertions)
**Depends on:** Phase 11
**Plans:** 0/1 planned

Plans:
- [ ] TBD (run /gsd:plan-phase 14 to break down)

### Phase 15: 实现 Dashboard 后端 API (Gap Closure)

**Goal:** 实现后端 aggregate API 替换 mock 数据，关闭 DASH-02/DASH-03 实现缺口
**Gap Closure:** Closes gaps from v1.1 audit: DASH-02-impl, DASH-03-impl (mock 数据), AdminPlatformStats optional 字段
**Depends on:** Phase 8
**Plans:** 0/1 planned

Plans:
- [ ] TBD (run /gsd:plan-phase 15 to break down)

---

*For completed milestone details, see `.planning/milestones/v1.0-ROADMAP.md`*
