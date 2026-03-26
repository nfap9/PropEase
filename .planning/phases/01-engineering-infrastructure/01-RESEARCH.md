# Phase 1: 工程基础设施与数据层规范化 - Research

**Researched:** 2026-03-26
**Domain:** CI门禁建设、数据层Mock替换、类型一致性、空状态处理
**Confidence:** HIGH

## Summary

Phase 1 的核心目标是建立 CI 门禁、替换 API 层 Mock 数据、确保类型一致性、以及统一空状态处理。通过对代码库的全面侦查，发现：

1. **CI 门禁已存在**（`.github/workflows/ci.yml`），但当前配置运行了完整的 test suite。根据 D-01 决策，CI 应只运行 `lint` + `type-check`，test suite 不应纳入 CI 卡点
2. **Mock 数据仅发现一处**：`api/src/routes/v1/reports.ts` 的 `GET /reports` 返回 `res.json([])` 而非调用真实服务
3. **Repository 模式已建立**：API 层已正确使用 Repository -> Service -> Controller 架构，均为真实数据库查询
4. **前端使用真实 API**：tenant-web 和 admin-web 的 API 客户端均通过 TanStack Query 调用后端真实接口
5. **空状态组件缺失**：没有共享的 EmptyState 组件，各页面内联处理空状态
6. **类型体系一致**：前端通过 `@apartment-ultra/api-contract` 包使用与后端一致的类型定义

**Primary recommendation:** 修改 CI 工作流移除 test 步骤，实现 `reports.ts` 的真实数据查询，创建共享 EmptyState 组件。

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: CI 门禁包含 `lint` + `type-check`，不强制在 CI 中运行 test suite
- D-02: CI 失败则 block PR 合并（无法 merge）
- D-03: CI 在 PR 创建/更新时自动执行，不依赖本地 pre-commit hook
- D-04: 测试覆盖率目标 >70%，但由开发者本地维护，不纳入 CI 卡点
- D-05: 优先确保 API 层使用真实 Prisma repository 调用，替换任何生产代码中的硬编码数据返回
- D-06: API 响应类型与前端 Zod schema 通过显式 schema 校验保证一致（不自动生成）
- D-07: 空状态使用统一 EmptyState 组件，显示友好提示文案而非空白或 error

### Claude's Discretion
- 空状态组件的具体文案和展示形式由 Claude 决定
- 具体哪些文件/路由存在 mock 数据需要 scouted 后确定
- CI 具体工具选择（GitHub Actions / 其他）由 planner 确定

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | 租客端所有使用 mock 数据的 API 调用替换为真实数据库查询 | 已确认 tenant-web 使用真实 API，mock 数据仅存在于后端 `reports.ts` |
| DATA-02 | 运营后台所有使用 mock 数据的 API 调用替换为真实数据库查询 | 已确认 admin-web 使用真实 API |
| DATA-03 | API 响应类型与前端类型定义保持一致（Zod schema 校验） | `packages/api-contract` 提供统一类型，前端 re-export，类型体系一致 |
| DATA-04 | 空状态（empty state）正确处理，无数据时显示友好提示 | 现有页面内联处理空状态，缺少共享 EmptyState 组件 |
| ENG-01 | CI 门禁建立（lint/type-check/test） | 现有 CI 存在但运行 test，需按 D-01 修改为 lint + type-check |
| ENG-02 | 回归测试套件覆盖核心业务流程 | 现有 Vitest 测试存在于 `api/src/**/*.test.ts`，由开发者本地维护 |

---

## Mock Data Landscape

### 后端 API Mock 数据

| 文件 | 行号 | 问题 | 修复方式 |
|------|------|------|----------|
| `api/src/routes/v1/reports.ts` | 30 | `GET /reports` 返回 `res.json([])` | 调用 `defaultReportService.list(orgId)` 替换 |

**验证方法：**
```bash
grep -rn "res\.json\(\[\]\)" api/src/routes/
```
结果：仅 `reports.ts:30` 一处。

### 前端 Mock 数据

| 位置 | 状态 | 说明 |
|------|------|------|
| `tenant-web/src/lib/api/*.ts` | 无 Mock | 使用 `api.get/post/put/delete` 调用真实后端 |
| `admin-web/src/lib/api/*.ts` | 无 Mock | 同上 |
| `tenant-web/src/app/**/page.tsx` | 无 Mock | TanStack Query 调用 API |

**结论：** 前端无 Mock 数据问题。Mock 数据仅存在于后端一处。

---

## Repository Coverage

### 已实现的 Repository

| Repository | 路径 | 状态 |
|------------|------|------|
| ApartmentRepository | `api/src/repositories/apartment.repo.ts` | 已实现，使用 Prisma |
| RoomRepository | `api/src/repositories/room.repo.ts` | 已实现 |
| TenantRepository | `api/src/repositories/tenant.repo.ts` | 已实现 |
| LeaseRepository | `api/src/repositories/lease.repo.ts` | 已实现 |
| BillRepository | `api/src/repositories/bill.repo.ts` | 已实现 |
| UtilityRepository | `api/src/repositories/utility.repo.ts` | 已实现 |
| ReportRepository | `api/src/repositories/report.repo.ts` | 已实现 |
| OrganizationRepository | `api/src/repositories/organization.repo.ts` | 已实现 |
| AuthRepository | `api/src/repositories/auth.repo.ts` | 已实现 |
| SubscriptionRepository | `api/src/repositories/subscription.repo.ts` | 已实现 |
| NotificationRepository | `api/src/repositories/notification.repo.ts` | 已实现 |
| AdminRepository | `api/src/repositories/admin.repo.ts` | 已实现 |
| PermissionRepository | `api/src/repositories/permission.repo.ts` | 已实现 |
| CustomRoleRepository | `api/src/repositories/customRole.repo.ts` | 已实现 |
| ServiceProductRepository | `api/src/repositories/service-product.repo.ts` | 已实现 |
| UsageRepository | `api/src/repositories/usage.repo.ts` | 已实现 |

**结论：** Repository 层已全覆盖，Mock 数据问题仅存在于路由层（`reports.ts` 直接返回空数组）。

---

## API Contract & Type Consistency

### 类型定义来源

| 来源 | 位置 | 使用方 |
|------|------|--------|
| `packages/api-contract/src/*.ts` | 定义接口类型 | 后端（Zod schema）、前端（import 类型） |
| `tenant-web/src/types/index.ts` | re-export api-contract | tenant-web 页面组件 |
| `admin-web/src/lib/api/admin-client.ts` | re-export api-contract | admin-web API 客户端 |

### 已验证的一致性

| 类型 | API Contract | 前端使用 | 状态 |
|------|--------------|----------|------|
| `Apartment` | `packages/api-contract/src/apartments.ts` | `tenant-web/src/types/index.ts` | 一致 |
| `Room` | `packages/api-contract/src/apartments.ts` | `tenant-web/src/types/index.ts` | 一致 |
| `Bill` | `packages/api-contract/src/bills.ts` | `tenant-web/src/types/index.ts` | 一致 |
| `Lease` | `packages/api-contract/src/leases.ts` | `tenant-web/src/types/index.ts` | 一致 |
| `Tenant` | `packages/api-contract/src/tenants.ts` | `tenant-web/src/types/index.ts` | 一致 |

### 潜在问题

**`reports.ts` 返回类型不匹配：**
- 当前：`GET /reports` 返回 `[]`（空数组）
- 预期：应返回 `Report[]` 类型
- API Contract：`packages/api-contract/src/reports.ts` 定义了 `Report` 接口

**修复后需验证：**
```typescript
// api/src/routes/v1/reports.ts
import { defaultReportService } from '../../services/report.service.js';

// 替换
// res.json([]);
// 为
const reports = await defaultReportService.list(orgId);
res.json(reports);
```

---

## CI Infrastructure

### 现有 CI 配置

**文件：** `.github/workflows/ci.yml`

**问题（与 D-01 冲突）：**
- 第 122-125 行：`Test` 步骤运行 `pnpm --filter apartment-ultra-api run test`
- 第 172 行：tenant-web 运行 `test:run`
- 第 224 行：admin-web 运行 `test:run`

**D-01 决策：** CI 门禁包含 `lint` + `type-check`，不强制在 CI 中运行 test suite

**需要修改的内容：**
1. 移除 API job 中的 `Test` 步骤
2. 移除 tenant-web job 中的 `Run tests` 步骤
3. 移除 admin-web job 中的 `Run tests` 步骤
4. 保留 `Run ESLint` 和 `Type check` 步骤

### 推荐的 CI 结构（修改后）

```yaml
# api job
- name: Run ESLint
  run: pnpm --filter apartment-ultra-api run lint
- name: Type check
  run: pnpm --filter apartment-ultra-api run type-check
# 移除 Test 步骤

# tenant-web job
- name: Run ESLint
  run: pnpm --filter apartment-ultra-tenant run lint
- name: Type check
  run: pnpm --filter apartment-ultra-tenant run type-check
# 移除 Run tests 步骤
# 保留 Build 步骤（构建验证）

# admin-web job
- name: Run ESLint
  run: pnpm --filter apartment-ultra-admin run lint
- name: Type check
  run: pnpm --filter apartment-ultra-admin run type-check
# 移除 Run tests 步骤
# 保留 Build 步骤（构建验证）
```

---

## Empty State Components

### 现有 Empty State 处理

| 页面 | 文件 | 方式 |
|------|------|------|
| 公寓列表（空） | `tenant-web/src/app/apartments/page.tsx:388-400` | 内联 Card + content |
| 账单列表（空） | `tenant-web/src/app/bills/page.tsx` | DataTable 组件处理 |
| 租客列表（空） | `tenant-web/src/app/tenants/page.tsx` | 内联处理 |
| 房间列表（空） | `tenant-web/src/app/rooms/page.tsx` | 内联处理 |

### 现有组件库

**共享 UI 组件（`packages/shared-ui/src/components/ui/`）：**
- `card.tsx` - 卡片容器
- `skeleton.tsx` - 加载骨架
- `button.tsx` - 按钮
- `table.tsx` - 表格

**缺失组件：**
- `empty-state.tsx` - 统一的空状态组件

### 建议的 EmptyState 组件设计

```typescript
// packages/shared-ui/src/components/ui/empty-state.tsx
interface EmptyStateProps {
  icon: React.ReactNode;      // 图标
  title: string;             // 主标题
  description?: string;      // 描述文案
  action?: React.ReactNode;  // 可选操作按钮
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 text-muted-foreground">{icon}</div>
        <h3 className="mb-2 text-lg font-medium">{title}</h3>
        {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
        {action}
      </CardContent>
    </Card>
  );
}
```

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | catalog (14.x) | React 框架 | App Router 提供更好的服务端组件支持 |
| TanStack Query | catalog (5.x) | 数据获取与缓存 | 内置缓存、乐观更新、后台刷新 |
| Vitest | catalog (1.x) | 单元测试 | 与 Vite 集成，快速 |
| Zod | catalog (3.x) | Schema 验证 | 类型安全的运行时验证 |
| Prisma | catalog (7.x) | ORM | 类型安全的数据库访问 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ESLint | catalog (8.x) | 代码检查 | 所有包 |
| TypeScript | catalog (5.x) | 类型系统 | 所有包 |
| axios | catalog | HTTP 客户端 | API 调用 |
| sonner | catalog (1.x) | Toast 通知 | UI 反馈 |

---

## Architecture Patterns

### Layered Architecture (API)
```
routes/ -> controllers/ -> services/ -> repositories/ -> Prisma
```

### Frontend Data Fetching
```
Page Component -> TanStack Query -> API Client -> Backend API
```

### Repository Pattern
```typescript
// api/src/repositories/apartment.repo.ts
export interface ApartmentRepository {
  findById(id: string): Promise<Apartment | null>;
  findByOrgIdWithRooms(orgId: string): Promise<ApartmentWithRooms[]>;
  create(data: Prisma.ApartmentCreateInput): Promise<Apartment>;
  // ...
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP Client | 自己封装 fetch | `@apartment-ultra/web-api-client` | 已封装 token 刷新、错误处理 |
| API 类型 | 手动定义 | `packages/api-contract` | 统一类型，避免不一致 |
| 数据库访问 | 直接写 SQL | Prisma ORM + Repository | 类型安全、可测试 |
| 状态管理 | Redux | TanStack Query + React Context | 数据获取专用，轻量 |

---

## Common Pitfalls

### Pitfall 1: CI 配置与决策冲突
**What goes wrong:** CI 工作流运行 test suite 导致 CI 时间过长，且与 D-01 决策冲突
**Why it happens:** CI 工作流创建时未考虑 D-01 决策
**How to avoid:** 按 D-01 修改 CI 工作流，移除 test 步骤
**Warning signs:** `pnpm test` 在 CI 中运行

### Pitfall 2: Mock 数据残留
**What goes wrong:** `reports.ts` 返回空数组导致前端页面显示空白而非友好提示
**Why it happens:** 路由层直接返回静态数据而非调用服务
**How to avoid:** 扫描所有 `res.json([])` 和 `res.json({})` 模式，确保使用真实服务调用
**Warning signs:** `grep -rn "res\.json\(\[\]\)" api/src/routes/`

### Pitfall 3: 空状态不一致
**What goes wrong:** 不同页面空状态样式不统一
**Why it happens:** 没有共享 EmptyState 组件，各页面内联实现
**How to avoid:** 创建共享 EmptyState 组件并逐步替换内联实现
**Warning signs:** 搜索 `border-dashed` 和空状态内联代码

---

## Code Examples

### 修复 Mock 数据（reports.ts）

**Before:**
```typescript
// api/src/routes/v1/reports.ts
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json([]);  // MOCK DATA!
  } catch (e) {
    next(e);
  }
});
```

**After:**
```typescript
// api/src/routes/v1/reports.ts
import { defaultReportService } from '../../services/report.service.js';

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = await requireOrgMembership(req);
    const reports = await defaultReportService.list(orgId);
    res.json(reports);
  } catch (e) {
    next(e);
  }
});
```

### CI 修改

**移除 test 步骤后：**
```yaml
# api job
- name: Run ESLint
  run: pnpm --filter apartment-ultra-api run lint
- name: Type check
  run: pnpm --filter apartment-ultra-api run type-check
# Test 步骤已移除

# tenant-web job
- name: Run ESLint
  run: pnpm --filter apartment-ultra-tenant run lint
- name: Type check
  run: pnpm --filter apartment-ultra-tenant run type-check
- name: Run tests  # 移除
  run: pnpm --filter apartment-ultra-tenant run test:run  # 移除
- name: Build
  run: pnpm --filter apartment-ultra-tenant run build
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 直接 Prisma 查询 | Repository 模式 | 初始实现 | 可测试、可替换 |
| 前端内联 API 调用 | API 客户端封装 | 初始实现 | 代码复用、类型安全 |
| 无 CI 门禁 | GitHub Actions CI | 初始实现 | 质量保障 |

**Deprecated/outdated:**
- 无

---

## Open Questions

1. **reports.ts GET / 返回类型**
   - What we know: 当前返回空数组，未调用 service
   - What's unclear: `ReportService.list()` 是否存在且返回正确类型
   - Recommendation: 检查 `report.service.ts` 中的 `list` 方法实现

2. **EmptyState 组件具体文案**
   - What we know: 各页面已有内联空状态文案
   - What's unclear: 统一的空状态文案规范尚未确定
   - Recommendation: 在 COMP-03（Phase 3）中建立组件时统一规范

---

## Environment Availability

**Step 2.6: SKIPPED** — Phase 1 不依赖外部工具，所有改动为代码/配置层

---

## Validation Architecture

> 注意：`workflow.nyquist_validation` 在 `.planning/config.json` 中设置为 `false`，此 section 仅作记录。

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `api/vitest.config.ts` (如存在) |
| Quick run command | `pnpm --filter apartment-ultra-api run test:watch` |
| Full suite command | `pnpm --filter apartment-ultra-api run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Manual/Automated |
|--------|----------|-----------|------------------|
| DATA-01 | 租客端 API 调用使用真实数据 | - | 手动验证（观察网络请求） |
| DATA-02 | 运营后台 API 调用使用真实数据 | - | 手动验证（观察网络请求） |
| DATA-03 | 类型一致性 | - | 自动化（type-check 通过） |
| DATA-04 | 空状态显示 | - | 手动验证（UI 观察） |
| ENG-01 | CI lint/type-check 通过 | - | 自动化（CI 执行） |

**No automated tests for DATA requirements** — DATA-01/02 需要手动验证 API 调用，DATA-04 需要 UI 验证。

---

## Sources

### Primary (HIGH confidence)
- `.github/workflows/ci.yml` — CI 工作流配置
- `api/src/routes/v1/reports.ts:30` — Mock 数据位置
- `packages/api-contract/src/*.ts` — API 契约类型定义
- `api/src/repositories/*.repo.ts` — Repository 实现

### Secondary (MEDIUM confidence)
- `tenant-web/src/app/apartments/page.tsx` — 空状态处理示例
- `tenant-web/src/lib/api/*.ts` — API 客户端实现
- `admin-web/src/lib/api/admin-client.ts` — Admin API 客户端

### Tertiary (LOW confidence)
- 无

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 项目已有明确技术栈定义
- Architecture: HIGH — 分层架构已建立并遵循
- Pitfalls: HIGH — CI 配置和 Mock 数据问题已确认

**Research date:** 2026-03-26
**Valid until:** 2026-04-25（30 天，架构稳定）
