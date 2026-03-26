# CLAUDE.md

本文件面向在本仓库内执行任务的 AI Agent。目标不是介绍项目背景，而是帮助 Agent 更快进入正确上下文、减少误改、提高一次性交付成功率。

## 先看什么

处理任何任务时，默认按下面顺序建立上下文：

1. 看根目录 [README.md](./README.md)，确认项目结构、启动方式和当前入口文档。
2. 看 [docs/README.md](./docs/README.md)，确认这次任务涉及的文档类型和权威来源。
3. 修改具体模块前，先看该模块自己的 `AGENTS.md`。
4. 如果功能行为发生变化，再同步看 `docs/测试用例/` 下对应业务文档。

不要只依赖本文件做判断。`CLAUDE.md` 负责项目级规则，不替代模块级说明。

## 模块入口

当前仓库是 `pnpm workspaces` monorepo，常见模块与入口如下：

- 后端 API：[`api/AGENTS.md`](./api/AGENTS.md)
- 租户端 Web：[`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- 运营后台：[`admin-web/AGENTS.md`](./admin-web/AGENTS.md)
- 移动端：[`mobile/AGENTS.md`](./mobile/AGENTS.md)
- E2E 测试：[`e2e/AGENTS.md`](./e2e/AGENTS.md)
- 项目文档导航：[`docs/README.md`](./docs/README.md)

如果某个目录暂时没有 `AGENTS.md`，先参考相邻模块文档与 `docs/README.md`，必要时顺手补齐说明。

## 项目概况

Apartment Ultra 是一个公寓管理产品，核心能力包括：

- 房源、公寓、房间、租客、租约管理
- 账单、水电和报表
- 平台运营、服务定价、商店配置与订阅能力

原始业务背景保留在 [`docs/原始需求.md`](./docs/原始需求.md)。它是历史输入，不一定逐项等于当前实现。

## 仓库结构

- `api/`：当前唯一在用的后端，Node/Express/TypeScript
- `tenant-web/`：租户端前端，Next.js，默认端口 `3000`
- `admin-web/`：运营后台前端，Next.js，默认端口 `3001`
- `mobile/`：实验性 Expo/React Native 客户端，当前按单独质量门治理
- `packages/api-contract/`：接口契约相关共享包
- `packages/shared-ui/`：共享 UI 组件
- `docs/`：长期说明、规范、测试用例、设计稿
- `docker/`：本地中间件和部署相关配置

## 默认开发流程

首次进入仓库或依赖变化后，优先使用这套流程：

```bash
# 1. 启动中间件
cd docker && docker compose -f docker-compose.middleware.yaml up -d

# 2. 安装依赖
pnpm install

# 3. 同步数据库 schema
pnpm --filter apartment-ultra-api exec prisma db push

# 4. 启动后端
pnpm dev:api

# 5. 启动租户端
pnpm dev:web

# 6. 启动运营后台
pnpm dev:admin

# 7. 如需维护移动端原型，再单独启动
pnpm dev:mobile
```

如无特殊说明，所有前端和测试都以 `api/` 作为后端。

## Agent 工作规则

### 1. 先读再改

- 修改任何模块前，先阅读目标文件、相邻文件和模块 `AGENTS.md`。
- 不要跳过现有注释、类型定义和目录约定。
- 如果发现当前文档与代码不一致，优先以代码和运行结果为准，再回补文档。
- 处理 GitHub Issue 的创建、整理、拆分或补充时，优先遵循 [`.claude/skills/issue-management/SKILL.md`](./.claude/skills/issue-management/SKILL.md)。

### 2. 改动要收口

- 功能改动尽量限制在正确模块内，不要跨层随意泄漏逻辑。
- 优先编辑已有文件，只有在确实缺失载体时再新增文件。
- 能复用现有工具函数、客户端、schema、测试夹具时，不要重复造轮子。

### 3. 文档和测试要一起维护

- 任何影响业务行为、页面文案、流程入口或接口契约的变更，都要检查是否需要同步：
  - `docs/测试用例/`
  - 模块 `AGENTS.md`
  - `README.md` / `docs/README.md`
  - `packages/api-contract/` 或相关契约说明
- 不要求每次都新增文档，但不能让已有文档继续误导后续 Agent 或开发者。

### 4. 完成标准要明确

默认认为一次任务完成，至少要满足：

- 代码改动已经落地，而不是只停留在分析
- 相关类型、导入、引用关系完整
- 受影响的测试、类型检查或最小必要验证已经执行
- 如果文档已因改动失真，文档已同步更新

## 质量标准

- 使用 TypeScript 严格模式，避免 `any`
- API、数据库、请求/响应字段统一使用 `snake_case`
- 前端局部变量、函数参数使用 `camelCase`
- 前端界面文案统一使用中文
- 优先写自解释代码；仅在“意图不明显”时加简短注释

命名规范统一见 [`docs/naming-conventions.md`](./docs/naming-conventions.md)。

## 测试与验证

- 后端优先遵循 TDD 思路，测试框架为 Vitest
- E2E 使用 Playwright，动手前先看 [`e2e/AGENTS.md`](./e2e/AGENTS.md)
- 常用检查命令：
  - `pnpm lint`
  - `pnpm type-check`
  - `pnpm test`
  - `pnpm type-check:mobile`

`mobile/` 当前只接入独立 `type-check`，还没有纳入根级 `lint` / `type-check` / `test` 聚合命令；处理移动端任务时要显式运行对应命令。

当前根级聚合命令默认覆盖 `api`、`tenant-web`、`admin-web`。如果任务涉及这三个包，优先用根命令验证；如果涉及 `mobile/`，再额外运行 `pnpm type-check:mobile`。

如果任务只改文档或纯元数据，可以不跑完整测试，但要明确说明验证范围。

## 文档分工

为了让 Agent 快速判断“该改哪里”，这里给出最小分工原则：

- `README.md`：新同学入口，讲项目是什么、怎么启动
- `CLAUDE.md`：项目级 Agent 规则，讲怎么安全高效地做事
- 模块 `AGENTS.md`：模块内部开发约定，讲这个目录该怎么改
- `docs/测试用例/`：业务预期和人工验收场景
- `docs/api-contract/`：统一契约说明
- `docs/ui-design/`：设计参考和历史原型，不是代码真相
- `PROGRESS.md`：当前高层状态摘要
- `docs/monorepo-governance.md`：monorepo 共享工程配置与新增模块接入方式

## 语言要求

本项目默认使用中文协作：

- Agent 回复使用中文
- 新增或维护的项目文档使用中文
- 用户界面文本使用中文
- 提交信息可按实际需要使用中英文

## 当前任务来源

长期说明在 `docs/`，当前状态摘要见 `PROGRESS.md`，具体工作项以 GitHub Issues / PR 为准。

Issue 编写与使用规范见 [`docs/issue-management.md`](./docs/issue-management.md)。

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Apartment Ultra**

Apartment Ultra 是一个多租户 SaaS 公寓/房产管理系统，为管理多个租赁房产的房东设计，支持订阅购买、运营后台、服务定价与微信支付。系统包含租客端（tenant-web）和运营后台（admin-web）两个前端，以及 Node/Express/TypeScript 后端（api）和 React Native 移动端（mobile）。

**Core Value:** 房东能够通过一个系统高效管理公寓、房间、租客、租约、水电和账单，提升运营效率并减少人工错误。

### Constraints

- **保持模块不变**：不增删主要功能模块，只优化现有模块
- **数据库优先**：用真实数据库查询替换 mock，不引入新的数据层
- **渐进式修改**：逐个模块进行优化，保证每个阶段可运行
- **中文界面**：所有用户界面文本使用中文
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
## Installation
# Core (如果需要新安装)
# UI 生态
# 状态管理
# 表单
# 其他
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| shadcn/ui | Material UI / Ant Design | 需要完整组件库而非可定制源码时 |
| Tailwind CSS | CSS Modules + CSS Variables | 团队不熟悉原子化 CSS 或项目较小时 |
| TanStack Query | SWR / Apollo Client | 已使用 GraphQL 或偏好 SWR 简单 API 时 |
| next-themes | 手写 theme context | 需要更精细的主题控制时 |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @mui/material | 与 Tailwind 结合体验差，包体积大 | shadcn/ui 或 Chakra UI |
| styled-components | 与 Next.js App Router SSR 兼容性问题 | Tailwind CSS 或 CSS Modules |
| Redux Toolkit | 过于复杂，现代 React 已不需要 | TanStack Query + Zustand (如需全局状态) |
| moment.js | 包体积大，已停止维护 | date-fns 或 dayjs |
| JavaScript (.js) 文件 | 类型安全风险 | TypeScript 严格模式 |
## Stack Patterns by Variant
- 将大型页面拆分为子组件，使用 `Section` 模式 (如 `DashboardSection`, `StatsSection`)
- 使用 TanStack Query 的 `queryKey` 组织相关数据
- 利用 React Server Components 减少客户端 JavaScript
- 使用 Next.js Image 组件替代 `<img>`
- 使用 `next/font` 优化字体加载
- 利用 TanStack Query 的 `staleTime` 和 `gcTime` 减少请求
- 对列表使用窗口化 (windowing) 技术
- 将共享组件集中在 `shared-ui` 包中 (当前项目已这样做)
- 在 tailwind.config.ts 中定义 design tokens (当前项目已这样做)
- 使用 CSS 变量实现主题化 (当前项目已这样做)
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 14 | React 18.x | App Router 需要 React 18+ |
| shadcn/ui 0.x | Tailwind CSS 3.x, React 18.x | 检查 shadcn init 时的 CLI 版本 |
| TanStack Query 5.x | React 18.x, Next.js 14 | 需要 React 18 的 Suspense |
| next-themes 0.3.x | Next.js 14, React 18.x | attribute="class" 推荐配置 |
| React Hook Form 7.x | Zod 3.x, React 18.x | 当前项目组合良好 |
## Key Optimization Patterns for Apartment Ultra
### 1. shadcn/ui Customization
- 统一 admin-web 和 tenant-web 的 CSS 变量值，确保两个应用视觉一致
- 在 `shared-ui` 中添加项目特定的配色扩展 (如 `apartment-primary`, `apartment-secondary`)
- 考虑使用 `cn()` 工具函数 (class-variance-authority + clsx) 处理组件变体
### 2. Tailwind CSS Optimization
- 使用 Tailwind 的 `@layer` 机制组织自定义样式
- 对长时间使用的样式使用 `tailwind-merge` 避免重复
- 检查 `content` 数组配置，确保只扫描源代码目录
### 3. TanStack Query Best Practices
- 为每个查询添加描述性 `queryKey`，如 `['apartments', orgId, { status: 'active' }]`
- 使用 `invalidateOrgScopedQueries()` 组织切换时的缓存失效 (当前项目已有)
- 对 mutations 使用乐观更新提升 UX
- 考虑添加 `placeholderData` 保持加载状态的用户体验
### 4. Component Composition
- 将页面级别的数据获取上移到 layout 或专门的 data-fetching 组件
- 使用 Compound Components 模式减少 prop drilling
- 提取可复用的 Section 组件 (如 `DataTableSection`, `FormSection`)
- 考虑使用 `use client` 边界清晰划分服务端/客户端组件
### 5. Next.js 14 Performance
- 使用 Next.js Image 组件优化所有图片
- 利用 `next/font` 优化 Google Fonts 加载
- 对频繁变化的数据使用 `revalidatePath` 或 `revalidateTag`
- 使用 React Server Components 减少客户端 hydration
- 对大型列表实现虚拟滚动 (如 `@tanstack/react-virtual`)
## Sources
- shadcn/ui 官方文档 — Theming 章节 (https://ui.shadcn.com/docs/theming) — MEDIUM confidence
- Next.js 14 官方文档 — App Router Optimization (https://nextjs.org/docs/app/building-your-application/optimizing) — MEDIUM confidence
- TanStack Query 官方文档 — Query Keys and Caching (https://tanstack.com/query/latest) — HIGH confidence
- Tailwind CSS 官方文档 — Performance (https://tailwindcss.com/docs/optimizing) — MEDIUM confidence
- 当前项目代码分析 — admin-web/tenant-web 配置 — HIGH confidence
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
