# Stack Research

**Domain:** Next.js 14 SaaS 应用优化
**Researched:** 2026-03-26
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 14.x (App Router) | React 框架 | App Router 提供更好的服务端组件支持和流式渲染 |
| shadcn/ui | latest (0.x) | UI 组件库 | 源码可控、可定制、设计一致 |
| Tailwind CSS | 3.4.x | CSS 框架 | 与 shadcn/ui 深度集成、原子化 CSS 减少 bundle size |
| TanStack Query | 5.x | 数据获取与缓存 | 内置缓存、乐观更新、后台刷新 |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-themes | 0.3.x | Dark Mode | 需要主题切换时 (当前项目已使用) |
| React Hook Form + Zod | 7.x / 3.x | 表单验证 | 表单复杂时替代 Zod-only (当前项目已使用) |
| Sonner | 1.x | Toast 通知 | 轻量级替代 @uiw/react-toast (当前项目已使用) |
| Lucide React | latest | 图标库 | shadcn/ui 默认图标，与 Tailwind 配合良好 (当前项目已使用) |
| Recharts | 2.x | 图表 | 需要仪表板图表时 (当前项目已使用) |
| @tanstack/react-query-devtools | 5.x | Query 调试 | 开发环境调试 TanStack Query |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tailwindcss-animate | 动画 | shadcn/ui 必需插件 (当前项目已使用) |
| @types/node | latest | TypeScript 类型 | Next.js 开发必需 |
| eslint (next) | 8.x | 代码检查 | 与 Next.js 14 App Router 配合 |

---

## Installation

```bash
# Core (如果需要新安装)
pnpm add next@14 react react-dom typescript @types/react @types/node

# UI 生态
pnpm add shadcn-ui
pnpm add tailwindcss postcss autoprefixer tailwindcss-animate
pnpm add lucide-react class-variance-authority clsx tailwind-merge

# 状态管理
pnpm add @tanstack/react-query @tanstack/react-query-devtools

# 表单
pnpm add react-hook-form @hookform/resolvers zod

# 其他
pnpm add next-themes sonner recharts

# Dev dependencies
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-react-hooks
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| shadcn/ui | Material UI / Ant Design | 需要完整组件库而非可定制源码时 |
| Tailwind CSS | CSS Modules + CSS Variables | 团队不熟悉原子化 CSS 或项目较小时 |
| TanStack Query | SWR / Apollo Client | 已使用 GraphQL 或偏好 SWR 简单 API 时 |
| next-themes | 手写 theme context | 需要更精细的主题控制时 |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @mui/material | 与 Tailwind 结合体验差，包体积大 | shadcn/ui 或 Chakra UI |
| styled-components | 与 Next.js App Router SSR 兼容性问题 | Tailwind CSS 或 CSS Modules |
| Redux Toolkit | 过于复杂，现代 React 已不需要 | TanStack Query + Zustand (如需全局状态) |
| moment.js | 包体积大，已停止维护 | date-fns 或 dayjs |
| JavaScript (.js) 文件 | 类型安全风险 | TypeScript 严格模式 |

---

## Stack Patterns by Variant

**如果需要优化已有页面复杂度:**
- 将大型页面拆分为子组件，使用 `Section` 模式 (如 `DashboardSection`, `StatsSection`)
- 使用 TanStack Query 的 `queryKey` 组织相关数据
- 利用 React Server Components 减少客户端 JavaScript

**如果需要优化性能:**
- 使用 Next.js Image 组件替代 `<img>`
- 使用 `next/font` 优化字体加载
- 利用 TanStack Query 的 `staleTime` 和 `gcTime` 减少请求
- 对列表使用窗口化 (windowing) 技术

**如果需要统一风格:**
- 将共享组件集中在 `shared-ui` 包中 (当前项目已这样做)
- 在 tailwind.config.ts 中定义 design tokens (当前项目已这样做)
- 使用 CSS 变量实现主题化 (当前项目已这样做)

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 14 | React 18.x | App Router 需要 React 18+ |
| shadcn/ui 0.x | Tailwind CSS 3.x, React 18.x | 检查 shadcn init 时的 CLI 版本 |
| TanStack Query 5.x | React 18.x, Next.js 14 | 需要 React 18 的 Suspense |
| next-themes 0.3.x | Next.js 14, React 18.x | attribute="class" 推荐配置 |
| React Hook Form 7.x | Zod 3.x, React 18.x | 当前项目组合良好 |

---

## Key Optimization Patterns for Apartment Ultra

### 1. shadcn/ui Customization

**当前状态:** 项目使用 CSS 变量模式的 Tailwind 配置，支持 dark mode。

**建议优化:**
- 统一 admin-web 和 tenant-web 的 CSS 变量值，确保两个应用视觉一致
- 在 `shared-ui` 中添加项目特定的配色扩展 (如 `apartment-primary`, `apartment-secondary`)
- 考虑使用 `cn()` 工具函数 (class-variance-authority + clsx) 处理组件变体

### 2. Tailwind CSS Optimization

**当前状态:** 标准 shadcn/ui 配置，使用 `tailwindcss-animate`。

**建议优化:**
- 使用 Tailwind 的 `@layer` 机制组织自定义样式
- 对长时间使用的样式使用 `tailwind-merge` 避免重复
- 检查 `content` 数组配置，确保只扫描源代码目录

### 3. TanStack Query Best Practices

**当前状态:** 使用 `staleTime: 60 * 1000`, `refetchOnWindowFocus: false`。

**建议优化:**
- 为每个查询添加描述性 `queryKey`，如 `['apartments', orgId, { status: 'active' }]`
- 使用 `invalidateOrgScopedQueries()` 组织切换时的缓存失效 (当前项目已有)
- 对 mutations 使用乐观更新提升 UX
- 考虑添加 `placeholderData` 保持加载状态的用户体验

### 4. Component Composition

**当前状态:** Dashboard 页面包含 StatCard, DashboardSkeleton 等子组件。

**建议优化:**
- 将页面级别的数据获取上移到 layout 或专门的 data-fetching 组件
- 使用 Compound Components 模式减少 prop drilling
- 提取可复用的 Section 组件 (如 `DataTableSection`, `FormSection`)
- 考虑使用 `use client` 边界清晰划分服务端/客户端组件

### 5. Next.js 14 Performance

**建议优化:**
- 使用 Next.js Image 组件优化所有图片
- 利用 `next/font` 优化 Google Fonts 加载
- 对频繁变化的数据使用 `revalidatePath` 或 `revalidateTag`
- 使用 React Server Components 减少客户端 hydration
- 对大型列表实现虚拟滚动 (如 `@tanstack/react-virtual`)

---

## Sources

- shadcn/ui 官方文档 — Theming 章节 (https://ui.shadcn.com/docs/theming) — MEDIUM confidence
- Next.js 14 官方文档 — App Router Optimization (https://nextjs.org/docs/app/building-your-application/optimizing) — MEDIUM confidence
- TanStack Query 官方文档 — Query Keys and Caching (https://tanstack.com/query/latest) — HIGH confidence
- Tailwind CSS 官方文档 — Performance (https://tailwindcss.com/docs/optimizing) — MEDIUM confidence
- 当前项目代码分析 — admin-web/tenant-web 配置 — HIGH confidence

---

*Stack research for: Next.js 14 SaaS 应用优化*
*Researched: 2026-03-26*
