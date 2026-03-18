# Roadmap: 前端路由重构

**Milestone:** v1.0
**Created:** 2026-03-19

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
- [x] 02-01-PLAN.md — 更新设置首页卡片配置
- [ ] 02-02-PLAN.md — 更新订阅管理页面图标

---

### Phase 3: 移动端适配

**Goal:** 确保移动端的设置页面也有一致的导航体验

**Requirements:**
- ROUTE-07: 检查移动端 settings 布局
- ROUTE-08: 统一移动端和 Web 端的设置导航体验

**Success Criteria:**
1. 移动端设置页面有返回按钮
2. 导航结构与 tenant-web 一致

---

### Phase 4: 验收与测试

**Goal:** 确保重构后的路由符合用户直觉

**Requirements:**
- ROUTE-09: 手动测试所有设置页面导航
- ROUTE-10: 验证 URL 兼容性

**Success Criteria:**
1. 所有子页面都能返回到设置首页
2. 没有断开的链接
3. 页面刷新后保持正确的导航状态
