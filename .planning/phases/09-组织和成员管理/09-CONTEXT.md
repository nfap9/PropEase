# Phase 9: 组织和成员管理 - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

实现平台级组织和成员管理功能。平台管理员可：
- 创建/编辑/删除组织
- 查看组织列表和详情（含资源统计）
- 管理组织成员（添加/移除/角色分配/转移所有权）

Phase 10（系统配置）依赖本 phase 的组织管理能力。

</domain>

<decisions>
## Implementation Decisions

### 组织创建
- 仅需填写 `name`，`slug` 自动从 name 生成
- 不在创建时同步添加初始成员，创建后单独添加

### 组织编辑
- 可编辑：`name`、`notes`
- 不可编辑：`slug`（创建后固定，避免 URL/外链失效）

### 组织删除
- 删除前必须显示删除预览（关联资源：公寓数、房间数、成员数、订阅状态等）
- 复用 tenant API 已有的 `/deletion-preview` 端点
- 有未处理资源（公寓、租客、活跃订阅等）时阻止硬删除，仅允许停用

### 成员添加
- 通过手机号查找/邀请用户，与 tenant API 现有端点保持一致
- 新成员默认 `member` 角色

### 角色管理
- 允许转移 owner 角色给其他成员，组织必须有且只有一个 owner
- 可移除任意非 owner 成员（admin/member/viewer）
- Owner 不可直接移除，需先转移所有权

### 详情页信息
- 基础信息：名称、slug、状态、备注
- 成员列表：角色、手机号、加入时间
- 资源统计：公寓数、房间数、订阅状态

### 列表筛选
- 仅保留状态筛选（active/inactive），无需额外搜索或分页

### Claude's Discretion
- 组织详情页的 UI 布局和组件选择
- E2E 测试的具体断言和交互细节
- API 路由的具体命名和响应格式细节
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Organization models
- `api/prisma/schema.prisma` § Organization model (lines 32-53) — Organization fields
- `api/prisma/schema.prisma` § OrganizationMember model (lines 56-69) — Member fields
- `packages/api-contract/src/organizations.ts` — Organization, OrganizationMember, MemberRole types

### Existing tenant API (reference patterns)
- `api/src/routes/v1/organizations.ts` — Full org CRUD + member management endpoints
- `api/src/routes/v1/organizations.controller.ts` — Controller implementation to reference
- `api/src/routes/v1/admin/admin.controller.ts` § organizations (lines 213-242) — Current admin org endpoints

### Frontend patterns
- `admin-web/src/app/organizations/page.tsx` — Current admin org list page
- `admin-web/src/lib/api/organizations.ts` — organizationsApi client (tenant-facing, reference for member APIs)

### Requirements
- `REQUIREMENTS.md` § ORGM-01, ORGM-02, ORGM-03 — Phase 9 acceptance criteria

### E2E patterns
- `e2e/pages/admin/organizations-page.ts` — Existing OrganizationsPage Page Object
- `e2e/admin/organizations.spec.ts` — Existing org list tests
</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `organizationsApi` in `admin-web/src/lib/api/organizations.ts` — Tenant-facing API client, can inspire admin member APIs
- `DeletionPreview` type in api-contract — Already defined, reuse for admin delete flow
- `adminApiEndpoints` in `admin-web/src/lib/api/admin-client.ts` — Admin API client patterns
- `OrganizationsPage` Page Object in e2e — Extend for new CRUD + member tests

### Established Patterns
- Phone-based member invitation: `POST /organizations/:orgId/members?phone=X&role=Y`
- Organization slug auto-generation from name: see tenant `organizations.controller.ts` create handler
- Admin list with skip/limit/isActive filter: see `admin/admin.controller.ts listOrganizations`
- `MemberRole` = 'owner' | 'admin' | 'member' | 'viewer' in api-contract

### Integration Points
- Admin router: `api/src/routes/v1/admin/index.ts` — Add new org CRUD and member management routes
- Admin service: `api/src/services/admin.service.ts` — Add org CRUD and member management methods
- Admin organizations page: `admin-web/src/app/organizations/` — Add create/edit/detail/member management pages
- API contract: `packages/api-contract/src/admin.ts` — Add AdminOrganization, AdminOrganizationMember types
</codebase_context>

<specifics>
## Specific Ideas

- "参考 tenant API 的 /organizations/:orgId/members 端点模式"
- 删除预览复用现有 /deletion-preview 端点，节省开发量

</specifics>

<deferred>
## Deferred Ideas

- 组织 type 字段（individual/team/enterprise）— 当前 phase 仅 name+auto-slug，type 暂不需要
- 组织 settings JSON 配置管理 — Phase 10 系统配置会涉及

</deferred>

---

*Phase: 09-组织和成员管理*
*Context gathered: 2026-03-20*
