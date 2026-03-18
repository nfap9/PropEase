# Phase 2: 修复链接指向 - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

修复设置页面中的链接错误和导航不一致问题。具体包括：修复组织管理链接、合并团队设置与权限管理入口、更新订阅管理图标、全面检查所有设置子页面内部链接。

</domain>

<decisions>
## Implementation Decisions

### 订阅管理图标
- 从 `CreditCard` 改为 `ShoppingBag`
- 更好地表达"订阅/服务"概念，用户能一眼认出

### 团队设置 + 权限管理
- 合并为单一入口「团队与权限」
- 保留 `Users` 图标
- 描述统一为：「管理团队成员和角色权限」

### 组织管理处理
- 从 settings 首页移除「组织管理」卡片
- 组织管理功能仅通过 admin-web `/admin/organizations` 访问
- 不在 tenant-web settings 下创建独立组织管理页面

### 链接检查范围
- 全面检查：settings 首页卡片 + 所有子页面 (team, permissions, notifications, subscription, subscription/*) 内的按钮/链接
- 确保所有内部链接跳转正确

### 其他
- 保持卡片网格入口形式（来自 Phase 1 决策）
- 面包屑导航保持不变（Phase 1 决策）

</decisions>

<canonical_refs>
## Canonical References

**项目规范：**
- `tenant-web/src/app/settings/page.tsx` — 设置首页（需要修复的链接和图标）
- `tenant-web/src/app/settings/team/page.tsx` — 团队设置页（需要合并权限管理）
- `tenant-web/src/app/settings/permissions/page.tsx` — 权限管理页
- `tenant-web/src/app/settings/notifications/page.tsx` — 消息通知页
- `tenant-web/src/app/settings/subscription/page.tsx` — 订阅管理页
- `tenant-web/src/components/layout/admin-layout.tsx` — admin-web 导航配置（含 /admin/organizations）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` 组件：来自 shared-ui
- 图标：`lucide-react`（`ShoppingBag` 已存在）
- 面包屑组件：Phase 1 创建的 shadcn/ui Breadcrumb

### Established Patterns
- 使用 `MainLayout` 作为页面根布局
- 设置页面使用卡片作为入口（Phase 1 决策）
- 使用 `router.push()` 进行编程式导航

### Integration Points
- 修改 `tenant-web/src/app/settings/page.tsx` 的 SETTINGS_ITEMS 数组
- 合并后可能需要重构 `team/page.tsx` 和 `permissions/page.tsx` 的功能

</code_context>

<specifics>
## Specific Ideas

- "组织管理"功能已在 admin-web 完整实现，tenant-web 无需重复建设
- 合并后用户可以在「团队与权限」一个页面内完成成员管理和角色配置

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-修复链接指向*
*Context gathered: 2026-03-19*
