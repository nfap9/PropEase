# Project Research Summary

**Project:** Apartment Ultra
**Domain:** Multi-tenant SaaS Property Management
**Researched:** 2026-03-26
**Confidence:** MEDIUM

## Executive Summary

Apartment Ultra 是一个多租户公寓管理 SaaS，面向管理多个租赁房产的房东。当前系统已实现核心功能（公寓/房间/租客/租约/账单/水电管理），但存在 Mock 数据未替换、页面过于臃肿、UI 风格不统一等问题。技术栈已采用 Next.js 14 App Router + shadcn/ui + Tailwind CSS + TanStack Query，这套组合经过验证，适合前端优化。

优化策略应采用"先数据后架构"路线：先将 Mock 数据替换为真实 API 调用（Phase 1），同时建立 CI 门禁防止回归；再基于真实数据做页面拆分和组件提取（Phase 2-3），避免在数据流未知时过早拆分导致流程断裂。样式统一必须在组件行为规范完成后进行，否则统一变冻结。技术债（如 any 类型、复制粘贴组件）需要在每次改动时收口，不能累积到专门的重构阶段。

## Key Findings

### Recommended Stack

现有项目栈已选型合理，核心为 Next.js 14 App Router + shadcn/ui + Tailwind CSS 3.4.x + TanStack Query 5.x。当前项目已使用大部分推荐技术，额外需要优化的地方主要是组件提取模式和 Query Key 规范化。

**Core technologies:**
- **Next.js 14 (App Router)**: 服务端组件和流式渲染支持，减少客户端 JS
- **shadcn/ui (latest 0.x)**: 源码可控、可定制，与 Tailwind 深度集成
- **Tailwind CSS 3.4.x**: 原子化 CSS，配合 tailwindcss-animate 实现动画
- **TanStack Query 5.x**: 内置缓存、乐观更新、后台刷新，当前已使用 `staleTime: 60s`
- **React Hook Form + Zod 7.x/3.x**: 表单验证，当前项目已使用

**Supporting (当前项目已用):**
- next-themes: Dark mode 主题切换
- Sonner: Toast 通知
- Lucide React: 图标库
- Recharts 2.x: 图表

### Expected Features

**Must have (table stakes) — 核心功能已实现:**
- 公寓/房间/租客/租约 CRUD — 已实现，基础完善
- 账单生成与管理 — 已实现（手动出账）
- 水电抄表与计算 — 已实现
- 数据筛选与搜索 — 部分实现（租约/账单有筛选，公寓仅名称搜索）
- 导出功能 (Excel/PDF) — 已实现
- 基础报表统计 — 已实现（经营分析）
- 组织/团队管理 — 已实现（角色、权限）

**Should have (competitive differentiators) — 当前缺失:**
- Mock 数据替换 — P1，真实数据完整性和功能可用性的前提
- 租约到期预警提醒 — P1，竞品标配，当前缺失
- 初始水电记录提醒 — P1，新租约必须录入初始读数
- 自动账单生成 — P2，按月自动生成，减少手动操作
- 账单微信支付集成 — P2，当前仅订阅支付
- 多维度运营看板 — P2，趋势分析、空房率趋势

**Defer (v2+):**
- 对接财务软件（用友/金蝶）
- 短租/日租支持
- 智能推荐定价
- 银行自动扣款

### Architecture Approach

当前问题：巨型页面（`apartments/[id]/page.tsx` 1552 行）、对话框内联、状态分散、组件边界模糊。

推荐采用 5 层架构：Page（页面组合）-> Section（区块：Header/Data/Form/ActionDialog）-> Component（原子/复合组件）-> Hook（数据获取/业务逻辑）-> API。

核心重构模式：
1. **Page Composition**: 复杂页面拆分为 Section 组件，页面只做组合和状态协调
2. **Dialog as Component**: 对话框提取为独立组件，通过 props 传递
3. **Data Access Hooks**: 封装 TanStack Query 为自定义 hooks，统一 queryKey 和缓存策略
4. **Page Header Pattern**: 统一页面头部结构（标题、描述、操作按钮、返回链接）
5. **Progressive Disclosure**: 多步骤表单/对话框使用步骤状态机

### Critical Pitfalls

1. **UI 拆分导致流程断裂** — 页面拆分时只关注视觉，没有分析数据流和用户路径。预防：拆分前做用户流程图，每个拆分单元必须能独立完成最小业务闭环。
2. **Mock 数据替换后 API 契约不匹配** — 类型错误、字段缺失、格式化失效。预防：替换前用 schema 校验 mock 数据，保留 snapshot 对比差异。
3. **样式统一变成样式冻结** — 强制统一后特殊 case 被破坏。预防：统一前建立组件行为规范，使用 CSS Custom Properties 允许业务模块局部覆盖。
4. **渐进增强变成渐进破坏** — 每次改动引入新 bug。预防：每次改动填写影响分析，建立最小回归套件，遵守功能门禁原则。
5. **页面拆分后缺少导航上下文** — 用户失去操作上下文，不知道自己在哪一步。预防：面包屑/步骤指示器/草稿自动保存。

## Implications for Roadmap

基于研究，建议 5 阶段路线，遵循"先数据后架构"原则：

### Phase 1: 工程基础设施与数据层规范化
**Rationale:** 所有后续优化依赖真实数据，且必须有 CI 门禁防止回归。当前 Mock 数据状态下做页面拆分会导致流程断裂，必须先完成数据替换。
**Delivers:** Mock 数据全部替换为真实 API 调用；CI 门禁建立（lint/type-check/test）；API schema validation 集成
**Addresses:** FEATURES.md P1 项（Mock 数据替换）；PITFALLS.md（渐进破坏预防）
**Avoids:** "Mock 替换后契约不匹配" — schema 校验必须在替换时同步建立

### Phase 2: 页面拆分规划与导航架构
**Rationale:** 数据层规范后，现在可以安全拆分页面。但必须先做用户路径分析和导航设计，不能只做 UI 拆分。
**Delivers:** 巨型页面拆分方案（`apartments/[id]/page.tsx` -> ApartmentHeader + Tabs + Section 组件）；导航架构（面包屑、步骤指示器）；跨页面状态管理方案
**Addresses:** ARCHITECTURE.md Page Composition 模式
**Avoids:** "UI 拆分导致流程断裂" — 必须先做用户流程分析；"页面拆分后缺少导航上下文" — 导航设计同步进行

### Phase 3: 组件提取与数据访问 Hooks
**Rationale:** 页面拆分完成后，提取可复用组件和数据访问层。Dialog 组件化、数据获取 hooks 化降低重复。
**Delivers:** Dialog 组件库（FormDialog/ConfirmDialog/MultiStepDialog）；数据访问 hooks（useApartment/useRooms/useTenants 等）；共享 UI 组件补充（StatCard/EmptyState/PageHeader）
**Addresses:** ARCHITECTURE.md Dialog as Component、Data Access Hooks 模式
**Uses:** TanStack Query 5.x, React Hook Form + Zod

### Phase 4: 样式统一与设计系统完善
**Rationale:** 组件行为规范已建立，现在可以安全统一样式。必须使用 CSS Custom Properties 保留必要的情景覆盖能力。
**Delivers:** admin-web 和 tenant-web CSS 变量统一；Design tokens 完善（apartment-primary/apartment-secondary）；必要的情景覆盖机制
**Avoids:** "样式统一变成样式冻结" — 必须建立组件行为规范后才能统一；使用 CSS Variables 允许例外覆盖

### Phase 5: 抽象重构与差异化功能补充
**Rationale:** 真实重复出现三次后再抽象，避免过度工程化。同时补充 P2 差异化功能。
**Delivers:** 真正的共性抽象（基于实际重复，而非预测）；租约到期预警；初始水电记录提醒；自动账单生成（可选）
**Addresses:** FEATURES.md P2 项；PITFALLS.md "过度抽象导致可维护性下降"
**Avoids:** 三次规则 — 抽象必须以实际重复为基础

### Phase Ordering Rationale

- **数据优先于拆分:** Mock 数据未替换时做页面拆分，会导致在未知数据流上做决策，拆分后流程大概率断裂
- **导航随页面走:** 页面拆分时必须同步设计导航架构，否则用户体验会退化
- **样式随组件走:** 样式统一必须在组件行为规范完成后进行，否则统一变冻结
- **抽象基于重复:** 过度抽象比代码重复更难修复，三次规则防止过早优化

### Research Flags

Phases needing deeper research during planning:
- **Phase 1 (数据层规范化):** API schema 与前端类型对齐细节，需要逐 API 核对；建议 `/gsd:research-phase` 针对每个主要 API 端点做契约验证
- **Phase 2 (页面拆分):** 某些复杂页面（如账单详情、租约详情）的拆分边界需要产品确认，建议原型验证

Phases with standard patterns (skip research-phase):
- **Phase 3 (组件提取):** shadcn/ui + Next.js 14 组件模式已有大量文档，直接按 ARCHITECTURE.md 模式执行
- **Phase 4 (样式统一):** CSS Variables + Tailwind 主题化是成熟模式，按 STACK.md 执行

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 基于项目现有配置 + Next.js 14/shadcn/ui 官方文档，多处已验证 |
| Features | MEDIUM | 基于训练数据和竞品分析，Web Search 不可用；核心功能已实现，差距清晰 |
| Architecture | MEDIUM | 基于代码库现状分析和 Next.js 14 最佳实践，模式有文档支撑 |
| Pitfalls | MEDIUM | 基于行业经验，模式识别正确但具体表现形式需验证 |

**Overall confidence:** MEDIUM

### Gaps to Address

- **竞品功能验证缺失:** Web Search 不可用，Auto billing、预警等功能在竞品中的具体实现方式待验证
- **API 契约完整性:** 需要逐 API 核对 schema，确认 Mock 数据与真实 DB 的差异范围
- **页面拆分边界:** 复杂页面的拆分边界需要产品侧确认，不能纯技术决策
- **移动端定位:** mobile/ 是实验性项目，FEATURES.md 建议提升优先级，但需产品确认移动端场景

## Sources

### Primary (HIGH confidence)
- 当前项目代码分析 — admin-web/tenant-web 配置
- TanStack Query v5 官方文档 — Query Keys and Caching
- Next.js 14 官方文档 — App Router Optimization

### Secondary (MEDIUM confidence)
- shadcn/ui 官方文档 — Theming 章节
- Tailwind CSS 官方文档 — Performance
- React Component Composition — 组件组合原则
- Progressive Disclosure UI Pattern — 渐进披露设计模式

### Tertiary (LOW confidence)
- Property Management SaaS 行业通用模式 — 训练数据，竞品最新功能状态未验证
- 租约到期预警/逾期催收等功能的国内最佳实践 — 需用户访谈验证

---

*Research completed: 2026-03-26*
*Ready for roadmap: yes*
