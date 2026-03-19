# Phase 11: admin-web E2E 测试架构重新设计 - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

重新设计 admin-web E2E 测试架构。覆盖所有 admin-web 页面（概览、组织管理、用户管理、服务配置等）的测试。目标是解决当前测试中的 waitForTimeout 滥用、fixtures 绕过、断言薄弱、无测试数据隔离等核心问题。

</domain>

<decisions>
## Implementation Decisions

### 测试数据隔离策略
- **创建/清理方式**: API 层创建和清理（在 beforeAll/afterAll 中通过 HTTP 请求创建测试数据）
- **命名前缀**: `E2E_Admin_*`，与租户端 `E2E_*` 前缀区分，避免数据冲突
- **清理顺序**: 先删子资源再删父资源（如先删 plan 再删 org）
- **隔离级别**: 每个测试文件使用独立的测试数据，通过时间戳+随机数保证唯一性

### 认证状态复用
- **复用方式**: Worker 级 storageState 复用
- **实现位置**: fixtures.ts 中设置 `scope: 'worker'` 的 adminPage fixture
- **Token 管理**: admin token 过期策略待验证（Phase 11 计划实施前先验证）

### 断言深度
- **整体策略**: CRUD 完整验证
- **覆盖内容**:
  - 页面加载验证
  - 元素可见性验证
  - 创建操作：表单填写 → 提交 → toast 提示 → 列表更新
  - 读取操作：列表显示正确数据
  - 更新操作：编辑 → 保存 → 验证变化
  - 删除操作：执行删除 + afterAll 中清理恢复
- **断言方式**: 使用 Playwright 自动等待（waitForSelector/waitForResponse），消除所有 waitForTimeout

### Page Object 抽象程度
- **抽象策略**: 每个页面独立 Page Object
- **目录结构**: `e2e/pages/admin/` 下各页面独立文件（OverviewPage, OrganizationsPage, PlansPage, RegisteredUsersPage, RolesPage, UsersPage, SubscriptionsPage）
- **BaseAdminPage**: 扩展现有 `e2e/pages/base-page.ts`，提供 admin 通用能力（goto、waitForHeading、admin 专用断言）
- **超过 200 行需拆分**: Page Object 类超过 200 行时需要考虑拆分

### 文件策略
- **现有文件**: 全部删除重写
- **删除范围**: `e2e/admin/overview.spec.ts`, `e2e/admin/organizations.spec.ts`, `e2e/admin/plans.spec.ts`, `e2e/admin/users.spec.ts`
- **新架构**: 新的 Page Object + 新的 spec 文件

### 基础设施调整
- **playwright.config.ts**: 扩展 webServer 配置，支持同时启动 tenant-web (3000) 和 admin-web (3001)
- **ADMIN_BASE_URL**: 统一使用环境变量 `E2E_ADMIN_BASE_URL`，避免硬编码
- **testids.ts**: 补充 admin 侧边栏导航项的 data-testid（如缺失）

### Claude's Discretion
- BaseAdminPage 的具体方法设计（可在实施时根据实际需要扩展）
- 列表页通用的分页/排序/筛选的 Page Object 模式
- Skeleton loading 状态的等待策略
- Error state 的验证方式

</decisions>

<canonical_refs>
## Canonical References

### E2E 测试规范
- `e2e/AGENTS.md` — E2E 测试编写规范（禁止 waitForTimeout、每个测试独立数据、必须清理）
- `e2e/fixtures.ts` — Playwright fixtures 定义（adminPage fixture 存在但需要改造）
- `e2e/helpers/auth.ts` — 认证辅助函数（adminLogin）
- `e2e/testids.ts` — data-testid 常量

### Page Objects
- `e2e/pages/base-page.ts` — 现有基础 Page Object 类
- `e2e/pages/list-page.ts` — 现有列表页基类（admin 未使用）

### 测试辅助
- `e2e/helpers/api.ts` — ApiHelper 类（需要验证 admin API 端点）
- `e2e/helpers/test-data.ts` — 租户端测试数据生成器（参考模式）

### Admin Web 源码
- `admin-web/src/app/page.tsx` — 概览页
- `admin-web/src/app/admin/organizations/page.tsx` — 组织管理页
- `admin-web/src/app/admin/plans/page.tsx` — 服务配置页
- `admin-web/src/components/dashboard/` — Phase 8 新增的 dashboard 组件

### Research
- `.planning/phases/11-admin-web-e2e/11-RESEARCH.md` — Phase 11 研究文档

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `e2e/pages/base-page.ts`: BasePage 类，提供 goto/reload/waitForSelector/fill/click/expectVisible 等通用方法
- `e2e/fixtures.ts`: adminPage fixture 存在但 scope 是 function 级，需改为 worker 级
- `e2e/helpers/auth.ts`: adminLogin 函数可复用
- `e2e/testids.ts`: ADMIN 命名空间已存在部分常量

### Established Patterns
- Phase 6 tenant-web 测试使用 `createTestDataGenerator` + `try/finally` 清理
- Phase 6 测试使用 `waitForSelector` + `expect().toBeVisible()` 模式
- Phase 6 测试不使用 Page Objects（直接 locators）

### Integration Points
- Admin API 端点: `/api/v1/admin/organizations`, `/api/v1/admin/plans`, `/api/v1/admin/users` 等
- Admin Web 路由: `/admin/organizations`, `/admin/plans`, `/admin/users` 等
- Sidebar 导航: admin-web 的侧边栏导航项

</code_context>

<specifics>
## Specific Ideas

- admin 测试应通过侧边栏导航而非直接 goto，以验证导航可用性
- 删除操作后应在 afterAll 中使用 API 重新创建测试数据以恢复环境
- admin 测试数据使用 `E2E_Admin_${timestamp}_${random}` 格式命名

</specifics>

<deferred>
## Deferred Ideas

- 多浏览器测试（chromium/firefox/webkit）— Phase 11 保持 chromium only，后续按需扩展
- Admin token 过期策略验证 — 待 Phase 11 实施前确认

</deferred>

---

*Phase: 11-admin-web-e2e*
*Context gathered: 2026-03-20*
