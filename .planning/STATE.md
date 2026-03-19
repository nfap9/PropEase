---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 04
status: unknown
last_updated: "2026-03-19T06:20:45.025Z"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 8
  completed_plans: 8
---

# State: 前端路由重构

**Milestone:** v1.0
**Current Phase:** 04

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-19)

**Core value:** 让用户能直觉地在设置页面及其子页面之间导航

**Current focus:** Phase 04 — tenant-web-header-sider-main

## Progress

| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1 | ● | 1/1 | 100% |
| 2 | ● | 2/2 | 100% |
| 3 | ● | 2/2 | 100% |
| 4 | ○ | 2/3 | 66% |

## Recent Work

- Phase 4 Plan 02 complete: integrated shadcn/ui collapsible sidebar with MainLayout, icon-only collapsed state with hover tooltips
- Phase 4 Plan 01 complete: established (auth) and (dashboard) route groups, fixed Bell->Menu mobile nav bug
- Phase 3 Plan 02 complete: added org switch card to Settings page, /organizations/new redirects to /organizations
- Phase 3 Plan 01 complete: created dual-mode /organizations page with create/select handling
- Phase 2 Plan 02 complete: changed subscription page heading icon from CreditCard to ShoppingBag
- Phase 2 Plan 01 complete: merged team/permissions settings, updated subscription icon
- Phase 1 Plan 01 complete: unified settings layout with breadcrumb navigation

## Decisions

- Phase 4: (auth) route group for public login/register pages (no AuthGuard)
- Phase 4: (dashboard) route group with AuthGuard + MainLayout wrapper for all protected pages
- Phase 4: Mobile Sheet navigation uses Menu icon, Bell icon reserved for notifications
- Phase 3: Settings page shows org switch card at top of grid with current org name and Building2 icon
- Phase 3: /organizations/new redirects to /organizations to unify org creation/selection flow
- Phase 3: Created dual-mode /organizations page - creation form for 0 orgs, selection list for 1+ orgs
- Phase 2: Merged "团队设置" and "权限管理" into "团队与权限" pointing to /settings/team
- Phase 2: Subscription icon changed from CreditCard to ShoppingBag
- Phase 1: 返回按钮使用「文字+图标」形式
- Phase 1: 启用面包屑导航，显示完整层级路径
- Phase 1: 保持卡片网格入口形式
- Phase 1: Breadcrumb hides on /settings homepage, shows on sub-pages only
- Phase 1: Page titles via PAGE_TITLES constant mapping with parent-path fallback
- [Phase 04]: Phase 4: SidebarProvider wraps MainLayout for collapsible sidebar state
- [Phase 04]: Phase 4: Sidebar uses collapsible=icon mode for hover tooltip collapsed state
- [Phase 04]: Phase 4: SidebarTrigger replaces custom Sheet for mobile navigation

## Blockers

(None yet)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260319-koq | 构建打包 | 2026-03-19 | 9245d30 | [260319-koq](./quick/260319-koq/) |

## Roadmap Evolution

- Phase 4 added: tenant-web前端重构：新注册/登录页、header+sider+main主布局、业务模块导航
- Phase 3 added: 重新编排tenant-web前端路由：添加组织视图用于创建/选择组织

---
*Last updated: 2026-03-19*

*Last activity: 2026-03-19 - Completed quick task 260319-koq: 构建打包*
