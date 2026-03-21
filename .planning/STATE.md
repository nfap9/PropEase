---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 13
status: unknown
last_updated: "2026-03-21T04:18:55.068Z"
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 7
  completed_plans: 6
---

# State: Apartment Ultra

**Milestone:** v1.0 MVP — SHIPPED 2026-03-19
**Current Phase:** 13

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** 高效的公寓管理体验

**Current focus:** Phase 12 — api-api-contract

## Progress

| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1 | ● | 1/1 | 100% |
| 2 | ● | 2/2 | 100% |
| 3 | ● | 2/2 | 100% |
| 4 | ● | 3/3 | 100% |
| 5 | ● | 4/4 | 100% |
| 6 | ● | 1/1 | 100% |
| 7 | ● | 3/3 | 100% |
| 8 | ● | 1/1 | 100% |
| 11 | ◐ | 3/5 | 60% |
| 12 | ● | 1/1 | 100% |

## Recent Work

- Phase 12 Plan 01: BillFeeItem 统一从 @/types 导入、RoomStats 从 api-contract 导入、Decimal 字段 Number() 序列化为 number
- Phase 11 Plan 01: admin E2E infrastructure - worker-scope adminPage fixture with storageState, dual webServer config, BaseAdminPage base class
- Phase 11 Plan 02: 9 admin Page Objects (Overview, Organizations, Plans, RegisteredUsers, Roles, Users, Subscriptions, Brand, Pricing) with testids added to 3 source pages
- Phase 11 Plan 04: 4 new E2E spec files (roles, subscriptions, brand, pricing) using fixtures + Page Objects, no waitForTimeout
- Phase 11 Plan 03: 4 admin spec files rewritten with fixtures, adminPage, and Page Objects - no waitForTimeout
- Phase 8 Plan 01: Admin dashboard complete - 6 stat cards, income ComposedChart, occupancy AreaChart with 80% warning, year filter, refresh button
- Phase 7 Plan 03: Tab navigation 5→4 tabs, bills.tsx split into sub-components, profile settings integration
- Phase 7 Plan 02: Tamagui base components (Card/Button/ListItem/Header) + utilities.tsx split
- Phase 7 Plan 01: Token refresh singleton lock + type safety fixes for mobile
- Phase 6: Dashboard E2E test suite (8 Playwright tests)
- Phase 5 Plan 04: pino structured logging for services and scheduler
- Phase 5 Plan 03: thin routes + fat controllers for 5 route files
- Phase 5 Plan 02: unified web-api-client for tenant-web and admin-web
- Phase 5 Plan 01: api-contract permissions SSOT
- Phase 4 Plan 03: login/register elegant minimal visual refresh
- Phase 4 Plan 02: shadcn/ui collapsible sidebar integration
- Phase 4 Plan 01: route groups (auth/dashboard), mobile nav bug fix
- Phase 3 Plan 02: org switch card in Settings + /organizations/new redirect
- Phase 3 Plan 01: dual-mode /organizations page (create/select)
- Phase 2 Plan 02: subscription page icon ShoppingBag
- Phase 2 Plan 01: settings links and team/permissions merge
- Phase 1 Plan 01: unified settings layout with breadcrumbs

## Decisions

- Phase 4: (auth) route group for public login/register pages (no AuthGuard)
- Phase 4: PermissionPageGuard on each page (not (dashboard) route group layout) is actual auth pattern
- Phase 4: Mobile Sheet navigation uses Menu icon, Bell icon reserved for notifications
- Phase 4: SidebarProvider wraps MainLayout for collapsible sidebar state
- Phase 4: Sidebar uses collapsible=icon mode for hover tooltip collapsed state
- Phase 3: Settings page shows org switch card at top of grid
- Phase 3: /organizations/new redirects to /organizations
- Phase 3: Dual-mode /organizations page - creation form for 0 orgs, selection list for 1+ orgs
- Phase 2: Merged "团队设置" and "权限管理" into "团队与权限"
- Phase 1: Breadcrumb navigation with full hierarchy path
- Phase 1: 返回按钮使用「文字+图标」形式
- Phase 05: Thin routes: router files only mount routes (5-72 lines), all handler logic in controllers
- Phase 05: admin.controller.ts in admin/ subdirectory for consistent import depth
- Phase 05: web-api-client unified for both tenant-web and admin-web modes
- Phase 05: pino logger singleton at api/src/utils/logger.ts
- Phase 07 Plan 01: Singleton lock (refreshLock) for token refresh prevents concurrent 401 requests from each triggering a separate refresh
- Phase 07 Plan 01: TenantWithLease with lease[] and gender fields for customers page type safety
- Phase 07 Plan 01: Stub route files + manual expo-router type declarations for /customers/new and /customers/[id]
- [Phase 07-02]: Tamagui styled() components use dollar-prefixed token names (, ) for design tokens
- Phase 07 Plan 03: 4-tab navigation (首页/房源/账单/我的), customers removed from tab bar, customer entry embedded in bills page header
- Phase 07 Plan 03: bills.tsx split into BillCard/FilterTabs/BillSearchBar sub-components (379→178 lines)
- Phase 07 Plan 03: profile page adds common settings section (费用配置/消息通知/经营报表) ordered by usage frequency
- Phase 08 Plan 01: AdminPlatformStats extended with optional occupancy_rate, monthly_revenue, pending_bills, overdue_bills fields
- Phase 08 Plan 01: StatCard formats value with isPercentage/isCurrency flags (¥X.XX for currency, X.X% for percentage)
- Phase 08 Plan 01: Charts use CSS var(--chart-N) colors matching Tailwind config; mock data generators for income/occupancy
- Phase 11 Plan 01: adminPage fixture 使用 worker scope，storageState 路径 e2e/results/.auth/admin.json
- Phase 11 Plan 01: adminLogin 增加 isAdminAuthenticated 提前检查跳过已登录状态
- Phase 11 Plan 01: webServer 改为数组配置同时启动 tenant-web (3000) 和 admin-web (3001)
- Phase 11 Plan 01: BaseAdminPage 使用 E2E_ADMIN_BASE_URL 环境变量，默认 http://localhost:3001
- [Phase 11]: StatCard testids use dynamic pattern stat-card-{slugified-title} - aligned testids.ts to match
- [Phase 11]: ADMIN_PRICING targets /usage-pricing (actual URL) - PricingPage.go() uses correct path
- Phase 11 Plan 03: 4 admin spec files use ../fixtures import, adminPage fixture, and Page Objects - no waitForTimeout
- Phase 11 Plan 04: Adapted spec to use actual Page Object properties (individual price inputs instead of non-existent priceInput)
- [Phase 12]: Phase 12 Plan 01: BillFeeItem 统一从 @/types 导入，RoomStats 从 api-contract 导入，Decimal 字段通过 Number() 序列化为 number
- Phase 13 added: 统一settings页面返回和面包屑组件结构

## Blockers

(None)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260319-koq | 构建打包 | 2026-03-19 | 9245d30 | [260319-koq](./quick/260319-koq/) |
| 260319-m9l | admin和tenant的默认端口冲突 | 2026-03-19 | f6b09c2 | [260319-m9l-admin-tenant](./quick/260319-m9l-admin-tenant/) |
| 260320-k0f | 检查各个模块是否都遵循api-contract | 2026-03-20 | a8d182f | [260320-k0f-api-contract](./quick/260320-k0f-api-contract/) |
| 260321-owo | 在本地docker部署这个项目 | 2026-03-21 | 20eea3d | [260321-owo-docker](./quick/260321-owo-docker/) |

## Roadmap Evolution

- Phase 12 added: 对齐api数据结构和api-contract
- Phase 11 added: 重新设计 admin-web E2E 测试架构
- Phase 7 added: 完善移动端
- Phase 6 added: 为tenant-web所有功能添加E2E测试
- Phase 5 added: 优化架构
- Phase 4 added: tenant-web前端重构：新注册/登录页、header+sider+main主布局、业务模块导航
- Phase 3 added: 重新编排tenant-web前端路由：添加组织视图用于创建/选择组织

---
*Last updated: 2026-03-20*

*Last activity: 2026-03-21 - Completed quick task 260321-owo: 在本地docker部署这个项目*
