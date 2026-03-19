---
status: investigating
trigger: "tenant-web响应式布局问题：侧边栏展开时，主内容区域没有占满右侧空白，而是显示特定宽度后留有空白"
created: 2026-03-19T00:00:00+08:00
updated: 2026-03-19T00:00:00+08:00
---

## Current Focus
hypothesis: "Root cause confirmed: shadcn Sidebar uses `position: fixed`, removing it from flex flow. The gap div inside Sidebar reserves space in the flex layout. Main content container lacks `w-full` + `ml-[--sidebar-width]` to properly fill and offset from the fixed sidebar."
test: "Git diff analysis: before had in-flow `aside w-64`, after replaced with `position: fixed` sidebar + gap div. Main content container lost the sidebar width reservation."
expecting: "Main content div should have `ml-[--sidebar-width]` (to offset fixed sidebar) + `w-full` (to fill remaining flex space)."
next_action: "Finalize diagnosis - this is a known shadcn pattern issue"
---

## Symptoms
expected: "主内容区域应在侧边栏展开时占满视口右侧全部剩余空间"
actual: "主内容显示特定宽度后留有空白，不能扩展到全屏"
errors: "无明显错误信息"
reproduction: "侧边栏展开时，大部分页面内容无法占满右侧空白"
started: "commit da13e9d 引入了 SidebarProvider + 固定定位侧边栏之后"
investigation_scope: "侧边栏展开时主内容区域右侧留白问题"

## Eliminated
- hypothesis: "min-width on inner page containers constraining content"
  evidence: "Data table and Card components have no max-width constraints. Only flex-1 overflow-auto p-6 on main element."
  timestamp: 2026-03-19

- hypothesis: "gap div not rendering or wrong width"
  evidence: "Gap div is `w-[--sidebar-width]` (16rem) hardcoded. It is a direct child of the flex container alongside main content. Pattern is correct."
  timestamp: 2026-03-19

## Evidence
- timestamp: 2026-03-19
  checked: "sidebar.tsx line 235-256 - Sidebar component main render"
  found: "Sidebar uses `position: fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] md:flex`. The sidebar is completely fixed-positioned, removed from flex flow. It overlays on top of content."
  implication: "Fixed sidebar does not reserve space in the flex container. The gap div (lines 225-234) is what reserves space in the flex flow."

- timestamp: 2026-03-19
  checked: "sidebar.tsx lines 225-234 - gap div"
  found: "Gap div has `w-[--sidebar-width]` (16rem) background-transparent, always present in DOM. For `collapsible=icon`, when collapsed the gap div is `w-[--sidebar-width-icon]` (3rem). This div IS in the flex flow."
  implication: "The gap div should reserve exactly the sidebar width in the flex layout, allowing flex-1 on main content to fill the rest. Pattern is correct in principle."

- timestamp: 2026-03-19
  checked: "main-layout.tsx lines 66-76"
  found: "SidebarProvider wraps everything with `w-full`. Outer div: `flex h-screen`. Main content container: `flex flex-1 flex-col overflow-hidden` - NO explicit `w-full`, NO `ml` margin to offset fixed sidebar."
  implication: "Two potential issues: (1) Missing `w-full` on main content container means flex-1 may not expand to full remaining width. (2) Missing `ml-[--sidebar-width]` means if the gap div is somehow not working, content will be under the sidebar."

- timestamp: 2026-03-19
  checked: "shadcn/ui SidebarInset component (lines 316-330)"
  found: "SidebarInset has `relative flex w-full flex-1 flex-col bg-background`. Notably: `w-full` is explicit. Also uses `md:peer-data-[state=collapsed]` margin adjustments for inset variant."
  implication: "shadcn pattern for content that lives alongside fixed sidebar includes `w-full` explicitly. MainLayout's main content container lacks this."

- timestamp: 2026-03-19
  checked: "Git diff da13e9d - before vs after SidebarProvider refactor"
  found: "BEFORE: `<aside className='hidden w-64 flex-col border-r bg-muted/40 lg:flex'>` was an IN-FLOW element with explicit `w-64`. AFTER: replaced with shadcn Sidebar using `position: fixed`. The main content div kept the same classes: `flex flex-1 flex-col overflow-hidden`."
  implication: "The in-flow `aside w-64` was replaced by `position: fixed` sidebar. The gap div inside Sidebar replaces the sidebar's role in flex flow, but the main content div never got `w-full` or margin adjustments for the fixed overlay."

## Resolution
root_cause: "commit da13e9d 将 MainLayout 的侧边栏从 in-flow 的 `<aside w-64>` 改为 shadcn/ui Sidebar（`position: fixed`）。Sidebar 内部渲染的 gap div（`w-[--sidebar-width]` 16rem）在 flex 流中保留了空间，主内容 div 使用 `flex-1` 应该填充剩余空间。但是主内容容器 div（`flex flex-1 flex-col overflow-hidden`）缺少显式的 `w-full` 来确保填满 flex 剩余空间，且缺少 `ml-[--sidebar-width]` 来在 gap div 失效时（例如 SSR/CSR 水合不一致）确保内容不被固定侧边栏遮挡。"
fix: "在 main-layout.tsx 的主内容容器 div 上添加 `w-full` 和 `ml-[--sidebar-width]`。这样无论 gap div 是否正确工作，主内容都能正确占满剩余空间并正确偏移。"
verification: ""
files_changed: []
