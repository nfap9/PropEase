# Apartment Ultra

## What This Is

Apartment Ultra 是一个多租户 SaaS 公寓/房产管理系统，为管理多个租赁房产的房东设计，支持订阅购买、运营后台、服务定价与微信支付。系统包含租客端（tenant-web）和运营后台（admin-web）两个前端，以及 Node/Express/TypeScript 后端（api）和 React Native 移动端（mobile）。

## Core Value

房东能够通过一个系统高效管理公寓、房间、租客、租约、水电和账单，提升运营效率并减少人工错误。

## Requirements

### Validated

已实现并可用的功能模块：

- ✓ 认证系统 — JWT 认证、注册/登录/登出
- ✓ 组织管理 — 租户端组织创建与管理
- ✓ 公寓管理 — 公寓 CRUD、房间关联
- ✓ 房间管理 — 房间 CRUD、状态管理
- ✓ 租客管理 — 租客信息管理
- ✓ 租约管理 — 租约创建/续约/终止
- ✓ 水电记录 — 抄表记录、用量计算
- ✓ 账单管理 — 账单生成、PDF/Excel 导出
- ✓ 报表分析 — 运营数据报表
- ✓ 订阅与支付 — 服务购买、微信支付集成
- ✓ 运营后台 — 运营账号、角色、组织、定价、订阅管理
- ✓ API 架构 — Express + Prisma + PostgreSQL 分层架构

### Active

当前需要优化和改进的功能：

- [ ] **Mock数据替换** — 将所有使用 mock 数据的部分替换为真实数据库查询
- [ ] **前端页面精简** — 单个页面不要放太多内容，合理拆分页面层级
- [ ] **UI风格统一** — 统一各模块的视觉风格和交互模式
- [ ] **功能完整性检查** — 补充缺失的功能点，确保各功能可用
- [ ] **用户体验优化** — 提升各功能的易用性，减少操作步骤

### Out of Scope

- 新增主要功能模块（保持现有模块结构不变）
- 技术栈更换
- 架构大幅重构

## Context

### 当前问题

根据用户反馈，系统存在以下问题：

1. **Mock数据问题**：部分功能使用 mock 数据，未连接真实数据库
2. **页面内容过载**：单个页面信息密度过高，需要合理拆分
3. **风格不统一**：不同模块的 UI 风格存在差异
4. **易用性不足**：部分功能操作复杂或流程不清晰

### 技术环境

- **前端**：Next.js 14, shadcn/ui, Tailwind CSS, TypeScript
- **后端**：Node.js + Express + TypeScript
- **数据库**：PostgreSQL + Prisma ORM
- **认证**：JWT (HS256)
- **包管理**：pnpm workspaces monorepo

### 模块结构

```
tenant-web/     — 租客端前端 (port 3000)
  - apartments, rooms, tenants, leases
  - utilities, bills, reports
  - settings (subscription, team, notifications, permissions)

admin-web/      — 运营后台 (port 3001)
  - brand, organizations, users, roles
  - plans, service-pricing, usage-pricing
  - storefront, subscriptions

api/            — 后端 API (port 8000)
  - Express + TypeScript
  - Prisma repositories + services 分层
```

## Constraints

- **保持模块不变**：不增删主要功能模块，只优化现有模块
- **数据库优先**：用真实数据库查询替换 mock，不引入新的数据层
- **渐进式修改**：逐个模块进行优化，保证每个阶段可运行
- **中文界面**：所有用户界面文本使用中文

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 保持现有模块结构 | 用户明确要求保持整体功能模块不变 | ✓ Good |
| 先 mock 转真数据 | 其他优化依赖真实数据，优先级最高 | — Pending |
| 前端页面拆分 | 解决单页内容过载的唯一方案 | — Pending |
| 统一风格优先模块内 | 避免跨模块风格冲突，逐模块收敛 | — Pending |

---

*Last updated: 2026-03-26 after initialization*
