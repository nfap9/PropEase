# Phase 1: 统一设置页面布局 - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

创建 settings 统一布局，为所有子页面提供一致的返回导航体验。包含创建 layout.tsx、面包屑导航、确保所有子页面继承统一样式。

</domain>

<decisions>
## Implementation Decisions

### 返回按钮样式
- 使用「文字+图标」形式，如「← 返回设置」
- 保持简洁，用户一眼可理解

### 面包屑导航
- 启用面包屑导航
- 显示完整层级路径：「设置 > 团队设置」
- 面包屑可点击，「设置」部分直接返回首页

### 入口展示方式
- 保持现有的卡片网格形式
- 2-3 列自适应网格
- 每个卡片包含：图标、标题、描述

### 其他决策
- 移动端：面包屑自动折叠为「返回」
- 保持现有 URL 结构不变

</decisions>

<canonical_refs>
## Canonical References

**项目规范：**
- `tenant-web/src/app/settings/page.tsx` — 现有设置首页实现
- `tenant-web/src/components/layout/main-layout.tsx` — 现有布局组件
- `tenant-web/src/components/layout/nav-config.ts` — 导航配置

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MainLayout` 组件：现有布局组件，包含侧边栏和头部
- `Card` 组件：来自 shared-ui，包含 hover 效果
- 面包屑组件：可使用 shadcn/ui Breadcrumb

### Established Patterns
- 使用 `MainLayout` 作为页面根布局
- 设置页面使用卡片作为入口
- 图标使用 lucide-react

### Integration Points
- 新建 `tenant-web/src/app/settings/layout.tsx`
- 修改各子页面使用统一的布局
- 面包屑组件需要引入 shadcn/ui

</code_context>

<specifics>
## Specific Ideas

- 返回按钮使用 `<-` 箭头符号 + 文字
- 面包屑分隔符使用 `>` 符号

</specifics>

<deferred>
## Deferred Ideas

- 快捷导航侧边栏 — Phase 2 或后续考虑

</deferred>

---

*Phase: 01-统一设置页面布局*
*Context gathered: 2026-03-19*
