# Roadmap: Apartment Ultra

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7 (shipped 2026-03-20)
- 🚧 **v1.1** — 运营后台

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-7 | v1.0 MVP | 16/16 | Complete | 2026-03-20 |
| 8 | 1/1 | Complete    | 2026-03-19 | - |
| 11 | 1/5 | 2/5     | 2026-03-20 | - |

### Phase 8: 运营数据看板

**Goal:** 实现运营后台仪表盘，展示全局统计数据、收入趋势、入住率分析
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Depends on:** Phase 7
**Plans:** 1/1 plans complete

Plans:
- [x] 08-01-PLAN.md — Dashboard UI: stat cards, charts, year filter, refresh (2026-03-20)

### Phase 9: 组织和成员管理

**Goal:** 实现平台级组织和成员管理功能
**Requirements**: ORGM-01, ORGM-02, ORGM-03
**Depends on:** Phase 8
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 9 to break down)

### Phase 10: 系统配置

**Goal:** 实现费用模板、通知配置、默认角色配置
**Requirements**: SYSC-01, SYSC-02, ROLE-01
**Depends on:** Phase 9
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 10 to break down)

### Phase 11: 重新设计 admin-web E2E 测试架构

**Goal:** 重新设计 admin-web E2E 测试架构，解决 waitForTimeout 滥用、fixtures 绕过、断言薄弱、无测试数据隔离等核心问题
**Requirements**: (架构重构，无特定业务需求)
**Depends on:** Phase 10
**Plans:** 1/5 plans complete

Plans:
- [x] 11-01-PLAN.md — Infrastructure: fixtures.ts worker-scoped adminPage, playwright.config.ts dual webServer, BaseAdminPage (2026-03-20)
- [ ] 11-02-PLAN.md — Page Objects: 9 admin pages (Overview, Organizations, Plans, RegisteredUsers, Roles, Users, Subscriptions, Brand, Pricing)
- [ ] 11-03-PLAN.md — Rewrite existing specs: overview, organizations, plans, users
- [ ] 11-04-PLAN.md — New specs: roles, subscriptions, brand, pricing

---

*For completed milestone details, see `.planning/milestones/v1.0-ROADMAP.md`*
