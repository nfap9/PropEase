# Phase 6: tenant-web-e2e - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

为 tenant-web 所有页面和核心业务流程添加完整的 Playwright E2E 测试覆盖。包括：已有测试模块的补充、缺失 dashboard 测试、CI 集成。确保所有测试在 PR 合并前必须通过。

</domain>

<decisions>
## Implementation Decisions

### 测试优先级
- **核心业务流程优先**：apartments → rooms → tenants → leases → bills
- 这条主线覆盖房源-租客-租约-账单的核心管理流程
- 其他模块（settings, subscription, reports 等）按需补充

### 缺失模块处理
- **dashboard（仪表盘）需要 E2E 测试**
  - 验证核心指标卡片正常显示
  - 验证快捷操作入口正常跳转
  - 验证整体布局和导航正常

### 数据隔离策略
- **每个测试独立数据**（推荐方案）
  - 使用 `TestDataGenerator` 创建独立的测试数据
  - 每个测试用 `try/finally` 确保数据清理
  - 测试间完全隔离，支持并行运行

### CI 集成策略
- **PR 前必须通过**
  - 所有 E2E 测试必须在 PR 合并前通过
  - 测试失败则 PR 无法合并
  - 确保每次代码变更不破坏已有功能

### 现有 E2E 测试模块
- apartments (crud, list, fee-config, rooms, utility-config)
- bills (generate, list, payment)
- leases (crud)
- tenants (crud, list)
- rooms (list)
- utilities (entry)
- settings (fee-types)
- subscription
- organization (team)
- permissions (roles)
- notifications
- reports (overview)
- auth (login, register)
- common (navigation)
- admin (organizations, overview, plans, users)

### 测试数据生成器（已有）
- `createApartmentWithRooms(count)` — 创建公寓和房间
- `createTenant(name?)` — 创建租客
- `createLease(roomId, tenantId)` — 创建租约
- `terminateLease(leaseId)` — 终止租约
- `createFeeType(name?)` — 创建费用类型
- `createBill(leaseId, options?)` — 创建账单
- `createFullTestEnvironment()` — 创建公寓+租客+租约
- `cleanup()` — 清理所有资源

### 测试规范（已有）
- 禁止 `test.skip()` — 让测试失败而非跳过
- 禁止 `waitForTimeout()` — 使用 Playwright 自动等待或状态断言
- 每个测试独立数据 — 使用 `TestDataGenerator` 创建
- 必须清理数据 — 使用 `try/finally` 确保清理
- 使用 `testids.ts` 中的 data-testid 常量，避免硬编码

### Claude's Discretion
- 具体测试用例数量和覆盖细节由 planner 决定
- dashboard 测试的具体验证点由 planner 决定
- 测试文件组织结构由 planner 决定

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### E2E 测试规范
- `e2e/AGENTS.md` — E2E 测试编写规范，包括目录结构、认证方式、TestID 规范

### 测试用例来源
- `docs/测试用例/` — 业务场景来源，业务预期和人工验收场景

### 已有测试参考
- `e2e/apartments/crud.spec.ts` — 公寓 CRUD 测试参考
- `e2e/tenants/crud.spec.ts` — 租客 CRUD 测试参考
- `e2e/bills/list.spec.ts` — 账单列表测试参考
- `e2e/helpers/test-data.ts` — 测试数据生成器参考

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `e2e/helpers/test-data.ts` — TestDataGenerator 测试数据生成器
- `e2e/fixtures.ts` — Playwright fixtures（自动登录）
- `e2e/testids.ts` — data-testid 常量
- `e2e/helpers/auth.ts` — 认证辅助函数
- `e2e/helpers/navigation.ts` — 导航辅助函数
- `e2e/helpers/ui.ts` — UI 操作辅助函数
- `e2e/helpers/api.ts` — API 辅助类

### Established Patterns
- 中文测试用例命名：`test.describe('模块名', () => { test('具体场景', ...) })`
- `data-testid` 属性用于元素定位
- 使用 `expect` 断言和 Playwright 自动等待
- API 调用用于数据准备和验证

### Integration Points
- `tenant-web/src/app/(dashboard)/` — 受保护的路由组，需要登录
- `tenant-web/src/app/(auth)/` — 公开路由组（登录/注册）
- `tenant-web/src/app/apartments/` — 公寓管理页面
- `tenant-web/src/app/bills/` — 账单管理页面
- `tenant-web/src/app/tenants/` — 租客管理页面
- `tenant-web/src/app/dashboard/` — 仪表盘页面

</code_context>

<specifics>
## Specific Ideas

- 测试应该覆盖完整的用户业务流程，而不仅仅是单个页面操作
- 优先测试核心业务流程：创建公寓 → 添加房间 → 创建租客 → 签订租约 → 生成账单
- CI 中运行 E2E 测试需要先启动中间件和后端服务

</specifics>

<deferred>
## Deferred Ideas

- admin-web 的 E2E 测试补充 — 属于运营端工作，未来单独 phase 处理
- mobile 的 E2E 测试 — 移动端尚未接入根级质量门，未来单独 phase 处理

</deferred>

---

*Phase: 06-tenant-web-e2e*
*Context gathered: 2026-03-19*
