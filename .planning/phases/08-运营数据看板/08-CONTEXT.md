# Phase 8: 运营数据看板 - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

实现运营后台仪表盘，展示全局统计数据、收入趋势、入住率分析。平台管理员可见全部数据。

</domain>

<decisions>
## Implementation Decisions

### 数据来源
- **复用现有 API**：直接调用 reportsApi 现有端点，admin-web 复用和 tenant-web 相同的数据源
- 不新增后端聚合接口

### 看板布局
- **卡片网格布局**：顶部统计卡片 + 下方收入/入住率图表，与 tenant-web dashboard 一致
- 单页展示，不需要多 Tab

### 权限控制
- **管理员可见全部**：平台管理员可看所有数据，不需要细粒度权限控制

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Admin Web
- `admin-web/src/app/page.tsx` — 当前首页，需要替换为仪表盘
- `admin-web/src/app/revenue/` — 已有收入相关页面，可参考
- `admin-web/src/app/registered-users/` — 已有注册用户页面
- `packages/api-contract/src/reports.ts` — DashboardOverview 类型定义

### Tenant Web (参考)
- `tenant-web/src/app/dashboard/page.tsx` — 租户端仪表盘，可参考布局

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- reportsApi 已封装完整：`/reports/overview`、`/reports/income`、`/reports/occupancy`
- admin-web 已有布局结构（layout.tsx、sidebar）
- TanStack Query 数据获取已配置

### Established Patterns
- 卡片网格布局（tenant-web dashboard）
- 统计卡片 + 图表组合
- 响应式设计

### Integration Points
- 数据来源：`mobile/services/api/reports.ts` 同款 API（admin-web 也用）
- 路由：`admin-web/src/app/page.tsx` 替换为仪表盘

</codebase_context>

<deferred>
## Deferred Ideas

- 多 Tab 看板 — 后续版本考虑
- 按组织过滤 — 后续版本考虑

</deferred>

---

*Phase: 08-运营数据看板*
*Context gathered: 2026-03-20*
