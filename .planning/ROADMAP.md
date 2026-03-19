# Roadmap: 前端路由重构

**Milestone:** v1.0
**Created:** 2003-03-19

## Phases

### Phase 1: 统一设置页面布局

**Goal:** 创建 settings 统一布局，提供一致的导航体验

**Requirements:**
- ROUTE-01: 创建 settings 统一布局文件 (layout.tsx)
- ROUTE-02: 在布局中添加返回设置首页的导航
- ROUTE-03: 确保所有子页面继承统一样式

**Status:** Complete

**Plans:**
1/1 plans complete

**Success Criteria:**
1. 访问 /settings/team 时能看到面包屑或返回按钮
2. 访问 /settings/permissions 时能看到面包屑或返回按钮
3. 访问 /settings/notifications 时能看到面包屑或返回按钮
4. 访问 /settings/subscription 子页面时能看到面包屑或返回按钮

---

### Phase 2: 修复链接指向

**Goal:** 修复设置页面中的链接错误和导航不一致问题

**Requirements:**
- ROUTE-04: 修复"组织管理"链接（当前错误指向 /settings/team）
- ROUTE-05: 检查并修复所有设置相关页面的内部链接
- ROUTE-06: 统一设置页面的图标和文案

**Success Criteria:**
1. "组织管理"链接指向正确的页面
2. 所有卡片链接都能正常跳转
3. 图标与功能描述匹配

**Plans:**
2/2 plans complete

### Phase 3: tenant-web组织视图 - 创建/选择组织页面

**Goal:** 创建 /organizations 页面，支持组织创建（0个组织时）和组织选择（多个组织时）；在设置页面添加组织切换入口

**Requirements**: TBD
**Depends on:** Phase 2
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — 创建 /organizations 页面（双模式：创建/选择）
- [x] 03-02-PLAN.md — 设置页面添加组织切换入口 + /organizations/new 重定向

### Phase 4: tenant-web前端重构：新注册/登录页、header+sider+main主布局、业务模块导航

**Goal:** Refine tenant-web frontend with refreshed login/register pages, header+sider+main main layout with collapsible sidebar, and business module navigation. Adopts Next.js route groups (auth)/(dashboard), shadcn/ui collapsible sidebar, and elegant minimal visual style.

**Requirements:**
- PH4-ROUTE-01: 创建 (auth) 和 (dashboard) Next.js route groups
- PH4-ROUTE-02: Dashboard route group wraps with AuthGuard + MainLayout
- PH4-BUG-01: Fix MainLayout mobile nav Bell->Menu icon bug
- PH4-SIDEBAR-01: Integrate shadcn/ui collapsible sidebar with MainLayout
- PH4-SIDEBAR-02: Sidebar supports icon-only collapsed state with hover tooltip
- PH4-AUTH-01: Login page elegant minimal visual refresh
- PH4-AUTH-02: Register page elegant minimal visual refresh

**Depends on:** Phase 3
**Status:** Planned
**Plans:** 3 plans

Plans:
- [ ] 04-01-PLAN.md — Route Group Architecture + Bug Fix
- [ ] 04-02-PLAN.md — Collapsible Sidebar Integration
- [ ] 04-03-PLAN.md — Login/Register Visual Refresh

**Success Criteria:**
1. Mobile Sheet navigation opens with Menu icon tap (not Bell)
2. Auth route group (/login, /register) accessible without authentication
3. Dashboard route group protected by AuthGuard
4. Sidebar collapses to icon-only with tooltip on hover
5. Login/register pages display elegant minimal visual style

---
