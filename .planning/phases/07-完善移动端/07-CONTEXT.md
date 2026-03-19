# Phase 7: 完善移动端 - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

完善移动端应用：修复质量问题（Token竞态、类型安全）、统一UI组件（Tamagui）、完成设置模块API对接、改进代码组织（拆分大文件）、优化Tab导航和页面布局。

</domain>

<decisions>
## Implementation Decisions

### UI组件策略
- **充分利用 Tamagui**：配置已有但未使用，统一使用 Tamagui 组件发挥跨平台优势
- **先建立共享基础组件**：颜色 token、间距、Card/Button/List 等基础组件，在 utilities/bills 等页面复用
- **全面重构**：一次性把 utilities.tsx 等大文件全部用 Tamagui 重构

### Token 竞态修复
- **单例锁机制**：刷新时加锁，后续请求等待刷新完成后再重试，避免并发竞态

### 类型安全
- **全部一起修**：统一消除所有 any，一次性启用严格检查
- 优先处理 customers.tsx、reports.tsx 的 any，再处理动态路由 as any

### 代码拆分
- **按业务功能拆**：utilities.tsx 按「读数录入」「队列管理」「电话拨打」拆成独立组件
- bills.tsx (364行)、login/index.tsx (443行) 也需拆分

### Tab 导航重构（4 Tab）
- **新 Tab 结构**：首页 / 房源 / 账单 / 我的
- **首页**：今日待办（全部待办：抄表、账单、租约到期等）+ 快捷操作入口
- **房源**：保留现有功能
- **账单**：内嵌客户入口
- **我的**：替代 Profile Tab，设置入口按使用频率排序

### 设置入口
- **Tab Bar 改版**：将 Profile Tab 改名为「我的」，集成设置入口和用户信息
- 设置项按使用频率排列：常用设置放前面

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 移动端代码
- `mobile/services/api/client.ts` — Token 刷新竞态问题所在文件
- `mobile/app/(tabs)/utilities.tsx` — 1194行，需拆分
- `mobile/app/(tabs)/bills.tsx` — 364行，需拆分
- `mobile/app/(tabs)/customers.tsx` — any 类型问题
- `mobile/app/settings/reports.tsx` — any 类型问题
- `mobile/app/(tabs)/profile.tsx` — 改名为「我的」

### Tamagui 配置
- `mobile/tamagui.config.ts` — 已有配置，需充分利用
- `mobile/constants/Colors.ts` — 颜色 token
- `mobile/constants/theme.ts` — 主题配置

### API Contract
- `packages/api-contract/` — 移动端已完整对接，需保持

### 移动端分析
- `.planning/codebase/MOBILE-ANALYSIS.md` — 详细问题清单和潜在改进方向

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- Tamagui 配置完整但未使用
- API 类型通过 @apartment-ultra/api-contract 已完整对接
- 已有 zustand 状态管理、react-query 数据获取

### Established Patterns
- Expo Router 文件路由
- TanStack Query 数据获取
- zustand 轻量状态管理
- RN 原生组件 + 内联样式（当前做法，将重构为 Tamagui）

### Integration Points
- Tab 导航重组需要修改 `mobile/app/(tabs)/_layout.tsx`
- 设置模块 API 对接需调用后端 endpoints
- Token 刷新在 `mobile/services/api/client.ts`

</codebase_context>

<specifics>
## Specific Ideas

- 单例锁机制修复 Token 竞态
- 共享基础组件先行，再重构大文件
- 首页展示全部待办事项 + 快捷操作入口
- 账单页面内嵌客户入口
- 设置项按使用频率排列

</specifics>

<deferred>
## Deferred Ideas

- 第三方登录 UI 占位符（微信/Apple/Google）- 后续实现
- 费用配置/消息通知/报表的 API 对接 - 可作为后续 phase
- 移动端 E2E 测试 - 后续 phase
- 共享 API Client（Issue #35）- 跨端复用

</deferred>

---

*Phase: 07-完善移动端*
*Context gathered: 2026-03-20*
