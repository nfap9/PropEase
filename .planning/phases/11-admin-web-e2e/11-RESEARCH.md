# Phase 11: admin-web E2E 测试架构重新设计 - Research

**研究日期:** 2026-03-20
**领域:** Playwright E2E 测试架构
**置信度:** MEDIUM-HIGH

## 摘要

Phase 11 的目标是重新设计 admin-web E2E 测试架构。当前 admin E2E 测试（`e2e/admin/*.spec.ts`）存在以下核心问题：

1. **严重依赖 `waitForTimeout(500)`** — 违反 AGENTS.md 规范，且测试不稳定
2. **未使用 Page Objects** — `e2e/pages/base-page.ts` 和 `list-page.ts` 存在但 admin 测试完全未使用
3. **每个 `beforeEach` 都重新调用 `adminLogin`** — 无状态复用，测试慢
4. **fixtures.ts 的 `adminPage` fixture 存在但 admin 测试完全未用** — admin 测试直接 `import { test, expect } from '@playwright/test'`
5. **`ADMIN_BASE_URL` 在每个 spec 文件中重复定义** — 维护性差
6. **无 admin 专用测试数据生成器** — TestDataGenerator 只服务租户端
7. **playwright.config.ts 的 webServer 只启动 tenant-web** — 不支持独立运行 admin 测试
8. **测试断言薄弱** — 大多是"按钮存在"检查，无实际业务验证

**核心建议：** 建立 admin 专用 Page Objects 层 + fixtures 状态复用 + API 层测试数据管理 + 消除所有 `waitForTimeout`。

## Standard Stack

### 核心
| 库 | 版本 | 用途 | 为什么是标准 |
|----|------|------|-------------|
| @playwright/test | ^1.58.2 | 测试框架 | 已锁定，Phase 6 已引入 |
| @playwright/browser | (bundled) | 浏览器驱动 | 由 @playwright/test 引入 |

**安装：** 无需安装 — 已存在于 `package.json` devDependencies。

### 现有基础设施（保持不变）
| 文件 | 作用 |
|------|------|
| `e2e/fixtures.ts` | 扩展 Playwright test，提供 basePage/authenticatedPage/adminPage 等 fixture |
| `e2e/helpers/auth.ts` | login/adminLogin/logout 等认证函数 |
| `e2e/helpers/api.ts` | ApiHelper 类，封装 HTTP 请求 |
| `e2e/helpers/test-data.ts` | TestDataGenerator，测试数据创建与清理 |
| `e2e/helpers/ui.ts` | waitForLoading/clickConfirm/submitFormAndWait 等 UI 辅助函数 |
| `e2e/helpers/navigation.ts` | goToDashboard/goToApartments 等导航函数 |
| `e2e/testids.ts` | 所有 data-testid 常量（ADMIN_* 命名空间已存在） |
| `e2e/pages/base-page.ts` | 通用 BasePage（存在但 admin 测试未用） |
| `e2e/pages/list-page.ts` | 列表页 BasePage（存在但 admin 测试未用） |

### 新增依赖
| 库 | 用途 | 何时需要 |
|----|------|----------|
| 无 | 所有能力已由现有栈提供 | — |

## Architecture Patterns

### 推荐项目结构
```
e2e/
├── fixtures.ts                    # 扩展 Playwright fixtures（已存在）
├── testids.ts                     # data-testid 常量（已存在）
├── helpers/
│   ├── auth.ts                    # 认证辅助（已存在）
│   ├── api.ts                     # API 辅助（已存在）
│   ├── test-data.ts               # 租户端测试数据（已存在）
│   ├── ui.ts                      # UI 辅助（已存在）
│   ├── navigation.ts              # 租户端导航（已存在）
│   ├── admin/
│   │   ├── auth.ts               # admin 认证辅助（重写 adminLogin）
│   │   ├── navigation.ts         # admin 导航辅助（新增）
│   │   └── test-data.ts          # admin 测试数据生成器（新增）
│   └── index.ts                   # helpers 导出（已存在）
├── pages/
│   ├── base-page.ts               # 通用基类（已存在，admin 未用）
│   ├── list-page.ts               # 列表页基类（已存在，admin 未用）
│   ├── admin/
│   │   ├── base-admin-page.ts    # admin 页面基类（新增）
│   │   ├── overview-page.ts      # 概览页 Page Object（新增）
│   │   ├── organizations-page.ts  # 组织管理页（新增）
│   │   ├── plans-page.ts         # 服务配置页（新增）
│   │   ├── registered-users-page.ts  # 注册用户页（新增）
│   │   ├── roles-page.ts         # 角色管理页（新增）
│   │   ├── users-page.ts         # 运营账号页（新增）
│   │   ├── subscriptions-page.ts # 订阅管理页（新增）
│   │   ├── brand-page.ts         # 品牌配置页（新增）
│   │   └── pricing-page.ts       # 定价配置页（新增）
│   └── index.ts                   # pages 导出（已存在）
├── admin/                         # admin E2E 测试用例
│   ├── overview.spec.ts           # 重写
│   ├── organizations.spec.ts      # 重写
│   ├── plans.spec.ts              # 重写
│   ├── registered-users.spec.ts   # 重写
│   ├── roles.spec.ts              # 新增
│   ├── users.spec.ts              # 重写
│   ├── subscriptions.spec.ts      # 新增
│   ├── brand.spec.ts              # 新增
│   └── pricing.spec.ts            # 新增
└── playwright.config.ts           # 扩展 webServer（重写）
```

### Pattern 1: Admin Page Object

**What:** 为每个 admin 页面创建专用 Page Object，封装该页面的所有 locators 和操作。

**When to use:** 任何 admin 页面超过 3 个测试用例时。

**Example:**
```typescript
// e2e/pages/admin/base-admin-page.ts
import { Page } from '@playwright/test';
import { ADMIN_LOGIN } from '../../testids';

export class BaseAdminPage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = ''): Promise<void> {
    // 使用环境变量或 baseURL，避免硬编码
    const baseUrl = process.env.E2E_ADMIN_BASE_URL || 'http://localhost:3001';
    await this.page.goto(`${baseUrl}${path}`);
  }

  async isOnPage(headingTestId: string): Promise<boolean> {
    return this.page.locator(`[data-testid="${headingTestId}"]`).isVisible();
  }

  async waitForHeading(headingTestId: string): Promise<void> {
    await this.page.waitForSelector(`[data-testid="${headingTestId}"]`, { timeout: 10000 });
  }
}
```

```typescript
// e2e/pages/admin/overview-page.ts
import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN } from '../../testids';

export class OverviewPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN.OVERVIEW_HEADING}"]`);
  readonly orgCountCard = this.page.locator(`[data-testid="${ADMIN.ORG_COUNT}"]`);
  readonly userCountCard = this.page.locator(`[data-testid="${ADMIN.USER_COUNT}"]`);
  readonly logoutButton = this.page.locator(`[data-testid="${ADMIN.LOGOUT_BUTTON}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/');
    await this.waitForHeading(ADMIN.OVERVIEW_HEADING);
  }

  async getStatValue(testId: string): Promise<string> {
    const card = this.page.locator(`[data-testid="${testId}"]`);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    return card.textContent() ?? '';
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForSelector(`[data-testid="${ADMIN_LOGIN.PAGE}"]`, { timeout: 10000 });
  }
}
```

### Pattern 2: Fixtures 状态复用

**What:** 使用 Playwright `storageState` 复用 admin 认证状态，避免每个测试都重新登录。

**When to use:** 所有 admin 测试。

**Example:**
```typescript
// 在 fixtures.ts 中扩展 adminPage fixture
adminPage: [
  async ({ page, context }, use) => {
    // 尝试复用已保存的认证状态
    const storageStatePath = 'e2e/results/.auth/admin.json';

    // 如果已有保存的状态，直接使用
    try {
      const fs = await import('fs');
      if (fs.existsSync(storageStatePath)) {
        await context.storageState({ path: storageStatePath });
      }
    } catch {}

    await adminLogin(page);

    await use(page);

    // 可选：更新保存的状态
    await context.storageState({ path: storageStatePath });
  },
  { scope: 'worker' }, // worker 级复用，整个进程共享
],
```

### Pattern 3: API 层测试数据隔离

**What:** 在 `beforeAll` 中通过 API 创建测试数据，在 `afterAll` 中清理。与 UI 操作创建的测试数据隔离。

**When to use:** 需要确定性测试数据的场景（组织创建、服务配置、用户管理等）。

**Example:**
```typescript
// e2e/helpers/admin/test-data.ts
export class AdminTestDataGenerator {
  private api: ApiHelper;
  private request: APIRequestContext;
  private createdOrgs: string[] = [];
  private createdPlans: string[] = [];
  private createdUsers: string[] = [];

  async createOrganization(name?: string): Promise<{ id: string; name: string }> {
    const org = await this.api.post<{ id: string; name: string }>('/api/v1/admin/organizations', {
      name: name || `E2E_Org_${Date.now()}`,
    });
    this.createdOrgs.push(org.id);
    return org;
  }

  async createPlan(name?: string): Promise<{ id: string; name: string }> {
    const plan = await this.api.post<{ id: string; name: string }>('/api/v1/admin/plans', {
      name: name || `E2E_Plan_${Date.now()}`,
    });
    this.createdPlans.push(plan.id);
    return plan;
  }

  async cleanup(): Promise<void> {
    for (const planId of this.createdPlans) {
      try { await this.api.delete(`/api/v1/admin/plans/${planId}`); } catch {}
    }
    for (const orgId of this.createdOrgs) {
      try { await this.api.delete(`/api/v1/admin/organizations/${orgId}`); } catch {}
    }
    // 清理顺序：先删子资源再删父资源
  }
}
```

### Pattern 4: Playwright 自动等待替代 waitForTimeout

**What:** 使用 `page.waitForSelector`、`page.waitForResponse`、`page.waitForURL` 等 Playwright 自动等待机制替代硬编码的 `waitForTimeout`。

**When to use:** 所有等待场景。

**Anti-pattern (当前 admin 测试中大量存在):**
```typescript
// 错误 — 不要这样做
await page.waitForTimeout(500);
await page.waitForTimeout(500);
```

**正确做法:**
```typescript
// 方法 1: 等待元素可见
await page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.LIST}"]`).waitFor({ state: 'visible', timeout: 10000 });

// 方法 2: 等待 API 响应
await page.waitForResponse(resp => resp.url().includes('/api/v1/admin/organizations'));

// 方法 3: 等待 URL 变化
await page.waitForURL(/\/admin\/organizations/, { timeout: 15000 });

// 方法 4: 等待网络空闲
await page.waitForLoadState('networkidle');

// 方法 5: 在 beforeEach 中用 load 替代 goto + timeout
// 正确：页面对象 load() 方法中处理所有等待
async load() {
  await this.goto('/admin/organizations');
  await this.waitForHeading(ADMIN_ORGANIZATIONS.HEADING);
  await this.waitForListVisible(); // 等待列表加载
}
```

### Pattern 5: Sidebar 导航替代 Direct goto

**What:** 测试侧边栏导航的可用性，而非直接 goto 绕过导航。

**When to use:** 导航相关测试。

**当前问题:** admin 测试中大量使用 `page.goto(\`${ADMIN_BASE_URL}/admin/...\`)`，不测试侧边栏。

**Example:**
```typescript
// 在 AdminNavigation helper 中
export async function goToAdminPage(page: Page, navTestId: string): Promise<void> {
  await page.click(`[data-testid="${navTestId}"]`);
}

// 测试用例
test('通过侧边栏导航到组织管理', async ({ adminPage }) => {
  await adminPage.goto('/'); // 先到概览页
  await goToAdminPage(adminPage, 'admin-nav-organizations');
  await adminPage.waitForURL(/\/admin\/organizations/);
});
```

### Pattern 6: 组织级测试隔离

**What:** 每个测试文件使用独立的测试组织，避免并行测试之间的数据污染。

**When to use:** 并行运行 admin E2E 测试时。

**Implementation:**
```typescript
// 每个 spec 文件的 beforeAll
test.describe.serial('组织管理', () => {
  let orgId: string;

  test.beforeAll(async ({ request }) => {
    const api = createApiHelper(request, process.env.API_BASE_URL || 'http://localhost:8000');
    const { accessToken } = await apiLogin(request, ADMIN_TEST_ACCOUNTS.admin.username, ADMIN_TEST_ACCOUNTS.admin.password);
    api.setToken(accessToken);
    // 创建测试组织
    const org = await api.post<{ id: string }>('/api/v1/admin/organizations', {
      name: `E2E_Org_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    });
    orgId = org.id;
  });

  test.afterAll(async () => {
    // 清理测试组织
    // ...
  });
});
```

## Don't Hand-Roll

| 问题 | 不要自己造 | 用这个 | 为什么 |
|------|-----------|--------|--------|
| Admin 认证状态复用 | 在每个 beforeEach 中调用 adminLogin | Playwright storageState + worker-scoped fixture | 避免重复登录，提升速度 |
| 等待页面加载 | `waitForTimeout(500)` | `page.waitForSelector(locator, { state: 'visible' })` | 稳定、可预测、超时可控 |
| Admin 页面元素定位 | 硬编码 `data-testid` 字符串 | Page Objects 封装 | 改一个 testid 只需改一处 |
| Admin 测试数据创建 | 在 UI 上手动创建 | AdminTestDataGenerator API 层创建/清理 | 快速、确定性、独立于 UI |
| Admin URL | 在每个 spec 文件重复定义 `ADMIN_BASE_URL` | 环境变量 + 单一常量 | 单一修改点 |
| Admin 导航 | 在每个测试中重复 `adminPage.click('[data-testid="..."]')` | AdminNavigation helper | DRY 原则 |

**关键洞察：** Playwright 生态已提供充足的工具，Phase 11 的重点是"整合"而非"发明"。

## Common Pitfalls

### Pitfall 1: `waitForTimeout` 导致的测试不稳定

**What goes wrong:** `waitForTimeout(500)` 在 CI 和本地环境运行时间不一致，导致测试随机失败（本地通过、CI 失败，或反之）。

**Why it happens:** `waitForTimeout` 是固定等待，不考虑实际加载时间。网络慢时 500ms 不够，浪费等待时间时又过长。

**How to avoid:**
- 用 `page.waitForSelector` 等待真实条件
- 用 `page.waitForResponse` 等待 API 返回
- 用 `page.waitForLoadState('networkidle')` 等待网络空闲

**当前 admin 测试中的典型问题代码:**
```typescript
// e2e/admin/overview.spec.ts:46
await page.waitForTimeout(500); // 问题

// e2e/admin/organizations.spec.ts:23
await page.waitForTimeout(500); // 问题
```

### Pitfall 2: Admin 测试不使用 fixtures

**What goes wrong:** admin 测试直接 `import { test, expect } from '@playwright/test'`，绕过了 `fixtures.ts` 中的 `adminPage` 和 `basePage` fixture，导致重复登录、basePage 能力不可用。

**Why it happens:** fixtures.ts 中的 fixture 需要在 test 声明文件中导出，但 admin spec 是在 e2e 根目录下的独立文件，没有从 fixtures.ts 导入。

**How to avoid:**
```typescript
// 正确：使用 fixtures
import { test, expect } from '../fixtures';
test('...', async ({ adminPage }) => { ... });

// 错误：绕过 fixtures（当前 admin 测试都是这样）
import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await adminLogin(page); }); // 重复登录
```

### Pitfall 3: Admin 测试只有 smoke 断言

**What goes wrong:** 当前 admin 测试只检查"按钮存在"或"页面加载"，没有实际验证业务行为（如创建组织后列表更新、停用组织后状态变化）。

**Why it happens:** 为了避免破坏性操作，测试被有意设计为只读。但这导致测试覆盖率极低。

**How to avoid:**
- 创建真实测试数据（通过 API）
- 执行写操作（创建/编辑/停用）
- 验证响应变化（列表更新、状态变化、toast 提示）

### Pitfall 4: 测试数据残留污染并行测试

**What goes wrong:** 测试 A 创建的组织未清理，测试 B 看到了不属于它的数据，导致断言失败。

**Why it happens:** 没有 cleanup 机制，或 cleanup 在测试失败时跳过。

**How to avoid:**
```typescript
test('创建组织', async ({ request }) => {
  const generator = new AdminTestDataGenerator(request);
  let orgId: string;

  try {
    const org = await generator.createOrganization();
    orgId = org.id;
    // 测试业务逻辑
  } finally {
    // 无论成功失败都清理
    if (orgId) {
      await generator.deleteOrganization(orgId);
    }
  }
});
```

### Pitfall 5: Admin webServer 配置缺失

**What goes wrong:** `playwright.config.ts` 的 `webServer` 只配置了 `pnpm dev:web`（port 3000），运行 admin E2E 测试时 admin-web（port 3001）未启动，导致测试直接失败。

**Why it happens:** 初始配置时只考虑了租户端测试，admin 测试后来添加但配置未更新。

**How to avoid:** 扩展 playwright.config.ts webServer 配置为数组或使用 `concurrently` 启动多服务。

### Pitfall 6: Page Objects 过载（反面教训）

**What goes wrong:** 有人会尝试在 BaseAdminPage 中塞入太多方法，导致 Page Object 变成万能类。

**How to avoid:** BaseAdminPage 只做通用操作（goto、waitForHeading）。具体页面逻辑放在各页面专用 Page Object 中。超过 200 行的方法类需要拆分。

## Code Examples

### 示例 1: 消除 waitForTimeout，重构概览页测试

**Source:** 基于 `e2e/admin/overview.spec.ts` 和 `e2e/pages/admin/overview-page.ts`

```typescript
// e2e/pages/admin/overview-page.ts
import { Page } from '@playwright/test';
import { ADMIN, ADMIN_LOGIN } from '../../testids';

export class OverviewPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async load(): Promise<void> {
    const baseUrl = process.env.E2E_ADMIN_BASE_URL || 'http://localhost:3001';
    await this.page.goto(`${baseUrl}/`);
    await this.page.waitForSelector(`[data-testid="${ADMIN.OVERVIEW_HEADING}"]`, {
      timeout: 15000,
    });
  }

  async getStatValue(testId: string): Promise<string> {
    const card = this.page.locator(`[data-testid="${testId}"]`);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    return (await card.textContent()) ?? '';
  }

  async logout(): Promise<void> {
    await this.page.click(`[data-testid="${ADMIN.LOGOUT_BUTTON}"]`);
    await this.page.waitForSelector(`[data-testid="${ADMIN_LOGIN.PAGE}"]`, { timeout: 10000 });
  }
}
```

```typescript
// e2e/admin/overview.spec.ts (重写后)
import { test, expect } from '../fixtures';
import { OverviewPage } from '../pages/admin/overview-page';
import { ADMIN } from '../testids';

test.describe('运营后台概览页', () => {
  let overviewPage: OverviewPage;

  test.beforeEach(async ({ adminPage }) => {
    overviewPage = new OverviewPage(adminPage);
    await overviewPage.load();
  });

  test('显示统计数据卡片', async () => {
    await expect(overviewPage.getStatValue(ADMIN.ORG_COUNT)).resolves.toBeTruthy();
    await expect(overviewPage.getStatValue(ADMIN.USER_COUNT)).resolves.toBeTruthy();
  });

  test('退出登录成功', async () => {
    await overviewPage.logout();
    await expect(overviewPage.page).toHaveURL(/admin\/login/);
  });
});
```

### 示例 2: Admin Fixtures 状态复用

**Source:** 基于 `e2e/fixtures.ts` 扩展

```typescript
// fixtures.ts 中 adminPage fixture 改进
adminPage: [
  async ({ page, context }, use) => {
    // adminLogin 函数现在支持跳过已登录状态
    await adminLogin(page);
    await use(page);
  },
  { scope: 'function' }, // 每个测试函数后保留状态
],
```

### 示例 3: Admin 测试数据生成器

**Source:** 新建 `e2e/helpers/admin/test-data.ts`

```typescript
// 核心思路：基于现有 TestDataGenerator 扩展 admin 能力
// 不需要新建完整类 — 扩展现有 ApiHelper 使用方式

import { APIRequestContext } from '@playwright/test';
import { ApiHelper, apiLogin } from '../api';
import { ADMIN_TEST_ACCOUNTS } from '../auth';

export class AdminTestDataGenerator {
  private api: ApiHelper;
  private apiUrl: string;

  constructor(request: APIRequestContext, adminUsername: string, adminPassword: string) {
    this.apiUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    this.api = new ApiHelper(request, this.apiUrl);
    this.init = this.init.bind(this);
  }

  async init(): Promise<void> {
    const { accessToken } = await apiLogin(
      this.request as any,
      ADMIN_TEST_ACCOUNTS.admin.username,
      ADMIN_TEST_ACCOUNTS.admin.password
    );
    this.api.setToken(accessToken);
  }

  // 可扩展：createOrganization, createPlan, createAdminUser 等
}
```

### 示例 4: 组织管理测试（含 CRUD）

**Source:** 重写 `e2e/admin/organizations.spec.ts`

```typescript
// e2e/admin/organizations.spec.ts (重写建议)
import { test, expect } from '../fixtures';
import { OrganizationsPage } from '../pages/admin/organizations-page';
import { AdminTestDataGenerator } from '../helpers/admin/test-data';
import { ADMIN_ORGANIZATIONS } from '../testids';

test.describe.serial('组织管理', () => {
  let orgPage: OrganizationsPage;
  let testData: AdminTestDataGenerator;
  let testOrgId: string;

  test.beforeAll(async ({ request }) => {
    testData = new AdminTestDataGenerator(request);
    await testData.init();
  });

  test.afterAll(async () => {
    if (testOrgId) {
      await testData.deleteOrganization(testOrgId);
    }
  });

  test.beforeEach(async ({ adminPage }) => {
    orgPage = new OrganizationsPage(adminPage);
    await orgPage.load();
  });

  test('显示组织列表', async () => {
    await expect(orgPage.list).toBeVisible();
  });

  test('创建组织成功', async ({ page }) => {
    await orgPage.clickCreate();
    await orgPage.fillForm({ name: `E2E_Org_${Date.now()}` });
    await orgPage.submit();

    // 验证 toast 提示
    await page.waitForSelector('[data-testid="common-success"]', { timeout: 5000 });
  });
});
```

## State of the Art

| 旧做法 | 当前做法 | 何时改变 | 影响 |
|--------|----------|----------|------|
| Raw locators in tests | Page Objects 封装 | Phase 11 | 维护性大幅提升，UI 变更只需改 Page Object |
| 每个测试重新登录 | storageState 复用 | Phase 11 | 测试速度提升 3-5x |
| waitForTimeout 等待 | Playwright 自动等待 | Phase 11 | 测试稳定性提升，CI 失败率降低 |
| smoke test 只读断言 | 真实 CRUD 操作 + 验证 | Phase 11 | 测试覆盖率实质提升 |
| 无 admin 测试数据管理 | AdminTestDataGenerator | Phase 11 | 测试数据隔离，并行测试安全 |
| 单一 webServer | 多服务并行启动 | Phase 11 | admin E2E 可独立运行 |

**当前 Phase 11 状态：** 处于"旧做法"端，需要全面迁移到右侧。

## Open Questions

1. **Admin API 端点是否完整？**
   - What we know: `e2e/helpers/api.ts` 封装了 ApiHelper，支持 GET/POST/PUT/DELETE/PATCH
   - What's unclear: admin API（`/api/v1/admin/...`）端点是否完整可用，认证方式（Bearer token vs session）是否与租户端一致
   - Recommendation: Phase 11 计划实施前，先验证 admin API 的 CRUD 端点可用性

2. **Admin 侧边栏导航的 data-testid 是否齐全？**
   - What we know: `testids.ts` 中有 `ADMIN.*` 命名空间，但可能缺少侧边栏导航项的 testid
   - What's unclear: 侧边栏每个 nav item 的 `data-testid` 是否都已标记
   - Recommendation: 实施前先审计 admin-web 源码，补充缺失的 testid

3. **Admin 端是否需要 storageState？**
   - What we know: `auth.setup.ts` 中有 admin 认证 setup，但 auth.ts 的 `adminLogin` 在每个 beforeEach 中被调用
   - What's unclear: admin token 的过期策略，storageState 是否能有效复用
   - Recommendation: 实施前验证 admin token 有效期，避免复用过期 token

4. **多浏览器测试是否必要？**
   - What we know: playwright.config.ts 默认只运行 chromium，CI 配置中有 firefox/webkit 注释
   - What's unclear: admin-web 是否有特定浏览器兼容性问题需要多浏览器覆盖
   - Recommendation: Phase 11 保持 chromium only，后续根据 CI 反馈扩展

5. **组织数据隔离策略？**
   - What we know: `TestDataGenerator` 通过时间戳+随机数保证唯一性，cleanup() 逐个删除
   - What's unclear: admin 测试创建的组织是否会与租户端测试数据冲突（共享数据库）
   - Recommendation: Admin 测试使用 `E2E_Admin_*` 前缀，与租户端 `E2E_*` 前缀区分

## Validation Architecture

> nyquist_validation 在 `.planning/config.json` 中设置为 `false`，跳过此章节。

## Sources

### Primary (HIGH confidence)
- Playwright 官方文档 — https://playwright.dev/docs/test-fixtures — fixtures 模式
- Playwright 官方文档 — https://playwright.dev/docs/page-objects — Page Object 最佳实践
- Playwright 官方文档 — https://playwright.dev/docs/api/class-page#page-wait-for-selector — 自动等待机制
- Playwright 官方文档 — https://playwright.dev/docs/test-setup#global-setup — storageState 复用

### Secondary (MEDIUM confidence)
- Playwright 官方 GitHub — https://github.com/microsoft/playwright — v1.48+ 最新特性
- 现有 codebase 源码分析（置信度基于：所有源文件已读取）

### Tertiary (LOW confidence)
- 行业博客/社区讨论（未验证，需在实施阶段确认）

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH — @playwright/test ^1.58.2 已在项目中验证，其他均为标准 Playwright 模式
- Architecture: MEDIUM-HIGH — Page Objects + Fixtures + Test Data Generator 是 Playwright 生态标准模式；具体 API 端点需实施前验证
- Pitfalls: HIGH — 所有问题均从现有代码中发现，具体可迁移

**研究日期:** 2026-03-20
**有效期至:** 2026-04-19（30 天，Playwright E2E 模式稳定）
