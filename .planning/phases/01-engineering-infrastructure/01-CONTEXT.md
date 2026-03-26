# Phase 1: 工程基础设施与数据层规范化 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

建立 CI 门禁防止回归，将租客端和运营后台所有 Mock 数据替换为真实数据库查询，并确保 API 契约与前端类型一致。

**Success Criteria:**
1. 租客端所有 API 调用使用真实数据库查询，不再返回 mock 数据
2. 运营后台所有 API 调用使用真实数据库查询，不再返回 mock 数据
3. API 响应类型与前端 Zod schema 校验通过，类型不一致问题清零
4. 空状态（无数据时）显示友好提示而非空白或错误
5. CI 门禁包含 lint/type-check/test，执行失败则无法合并

</domain>

<decisions>
## Implementation Decisions

### CI 门禁策略
- **D-01:** CI 门禁包含 `lint` + `type-check`，不强制在 CI 中运行 test suite
- **D-02:** CI 失败则 block PR 合并（无法 merge）
- **D-03:** CI 在 PR 创建/更新时自动执行，不依赖本地 pre-commit hook
- **D-04:** 测试覆盖率目标 >70%，但由开发者本地维护，不纳入 CI 卡点

### 数据层
- **D-05:** 优先确保 API 层使用真实 Prisma repository 调用，替换任何生产代码中的硬编码数据返回
- **D-06:** API 响应类型与前端 Zod schema 通过显式 schema 校验保证一致（不自动生成）
- **D-07:** 空状态使用统一 EmptyState 组件，显示友好提示文案而非空白或 error

### Claude's Discretion
- 空状态组件的具体文案和展示形式由 Claude 决定
- 具体哪些文件/路由存在 mock 数据需要 scouted 后确定
- CI 具体工具选择（GitHub Actions / 其他）由 planner 确定

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 工程规范
- `docs/naming-conventions.md` — 命名规范（snake_case/camelCase 分工）
- `PROGRESS.md` — 项目当前状态摘要

### Phase 1 Requirements
- `ROADMAP.md` §Phase 1 — Phase 1 的目标、成功标准、依赖关系
- `REQUIREMENTS.md` §Data — DATA-01, DATA-02, DATA-03, DATA-04 要求
- `REQUIREMENTS.md` §Engineering — ENG-01, ENG-02 要求

### 代码结构
- `api/src/repositories/` — Repository 层，真实数据库查询载体
- `api/src/services/` — Service 层，API 路由调用
- `packages/api-contract/` — API 契约类型定义
- `tenant-web/src/lib/api/` — 租客端 API 客户端
- `admin-web/src/lib/api/` — 运营后台 API 客户端

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Prisma ORM + Repository 模式已建立：`api/src/repositories/*.ts`
- API 契约类型已存在于 `packages/api-contract/`
- Zod schema 已在 API 路由中使用（如 `ApartmentCreateSchema`）

### Established Patterns
- Repository 接口模式：每个 domain 有独立 repository
- Service 层依赖 Repository，不直接操作 Prisma
- Express 路由使用 Zod schema 做请求验证

### Integration Points
- 新 CI 门禁需在 `api/`、`tenant-web/`、`admin-web/` 各自根目录配置
- GitHub Actions 配置可能在 `.github/workflows/` 或各 package 内部

</code_context>

<specifics>
## Specific Ideas

- CI 门禁决策：**只 lint + type-check，不在 CI 中跑 test suite**（test 由本地维护，coverage >70% 是目标但不卡合并）
- 理由：Phase 1 重点是基础设施规范化，不需要过度工程化；测试策略在后续 phase 迭代中完善

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-engineering-infrastructure*
*Context gathered: 2026-03-26*
