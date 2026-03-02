# E2E 测试用例编写指南（AI 助手用）

本文档面向 AI 助手与人工编写 Playwright E2E 用例，约定写法、定位策略与验收标准，以保证用例可运行、可维护并与 [docs/测试用例.md](../docs/测试用例.md) 对齐。详细规范见 [docs/e2e-writing-guide.md](../docs/e2e-writing-guide.md)。

## AI 助手必读（必查）

在编写或修改 `e2e/` 下任何 `*.spec.ts` 之前，**必须**阅读本指南与 [docs/e2e-writing-guide.md](../docs/e2e-writing-guide.md)。用例依赖已登录态（`storageState`），**不要**在业务端/运营端用例中再写登录步骤。

### 代码与文档位置

- **本目录**：`e2e/business.spec.ts`（业务端）、`e2e/admin.spec.ts`（运营端）、`e2e/*.auth.setup.ts`（登录态）
- **规范详情**：`docs/e2e-writing-guide.md`（定位器、弹窗、等待、禁止项、黄金示例）
- **用例来源**：`docs/测试用例.md`（功能用例编号与步骤，test 名中需标注对应编号）
- **前端 UI 文案**：以 `web/src/app/` 下实际页面为准，所有定位与断言使用**中文**

### 规则（必须遵守）

- **开始工作前**
  - 阅读 [docs/e2e-writing-guide.md](../docs/e2e-writing-guide.md) 与目标模块在 [docs/测试用例.md](../docs/测试用例.md) 中的步骤与预期
  - 确认要改的 `describe`/`test` 属于业务端（business）还是运营端（admin），勿在业务端写登录
  - 如需定位新页面，先看 `web/src/app/` 下对应页面的按钮/标题/表单 label 中文文案

- **工作中**
  - 仅用 `getByRole` / `getByLabel` / `getByPlaceholder` / `getByText` 定位，确需时再用 `locator(...)` 并注释原因
  - 弹窗内所有操作限定在 `page.getByRole('dialog').filter({ hasText: '...' })` 内
  - 禁止 `waitForTimeout`、固定 sleep；用 `expect(...).toBeVisible({ timeout })` 等断言作为等待
  - 每个 test 独立、可乱序运行；需数据时在本 test 内创建，名称用唯一值（如 `` `E2E公寓_${Date.now()}` ``）

- **完成时**
  - 自检 [docs/e2e-writing-guide.md](../docs/e2e-writing-guide.md) 第 8 节「验收自检」清单
  - 运行对应模块用例，例如：`pnpm exec playwright test business -- --grep "公寓管理"`，确认全部通过

## 项目结构

- **业务端**：`e2e/business.spec.ts`，依赖 `e2e/business.auth.setup.ts` → `.auth/business.json`，用例中不写登录。
- **运营端**：`e2e/admin.spec.ts`，依赖 `e2e/admin.auth.setup.ts` → `.auth/admin.json`。
- **运行**：先启动 API（8000）与前端（3000），如 `pnpm run dev:local`；业务端需 `SEED_E2E_USER=true` 启动 API 一次以创建测试用户。执行 `pnpm run test:e2e` 或 `pnpm exec playwright test business`（仅业务端）。
- **配置**：`playwright.config.ts` 中 `baseURL: 'http://localhost:3000'`，未配置 webServer，需手动启动前后端。

## 定位器策略（摘要）

1. **优先**：`getByRole('button', { name: '创建' })`、`getByRole('heading', { name: '公寓管理' })`、`getByLabel('公寓名称')`、`getByPlaceholder('搜索...')`、`getByText('暂无公寓')`。
2. **弹窗**：`page.getByRole('dialog').filter({ hasText: '新增公寓' })` 内再 `.getByLabel()` / `.getByRole()`。
3. **确认框**：`page.getByRole('alertdialog').filter({ hasText: '确认删除' })`，按钮用 `getByRole('button', { name: /^删除/ })` 兼容「删除」「删除中...」。
4. **下拉菜单**：先点触发按钮，再 `getByRole('menuitem', { name: '编辑' })`。
5. **仅必要时**：`locator('a[href^="/apartments/"]')` 等，并加注释。

**禁止**：依赖 class、复杂 CSS、裸的 `locator('div.xxx')`、长 DOM 链。

## 等待与稳定性

- **禁止**：`waitForTimeout`、`page.waitForTimeout`、固定 `setTimeout`。
- **推荐**：Playwright 自动等待；关键步骤用 `expect(...).toBeVisible({ timeout: 10000 })`、`expect(dialog).toBeHidden({ timeout: 10000 })`；必要时 `await page.waitForLoadState('networkidle')`。

## 中文 UI 与可选状态

- 按钮、链接、标题、占位符、错误提示与**当前界面中文**一致（如「创建」「新增公寓」「请输入公寓名称」），不得用英文（如 "Submit"、"Add"）。
- 列表可能为空时，用「有 A 或有 B」的断言，例如：`const hasList = ...; const hasEmpty = ...; expect(hasList || hasEmpty).toBe(true)`；或 `if (await newBtn.isVisible()) { ... } else { ... }`。不断言“一定存在某条数据”（除非本 test 刚创建）。

## 数据隔离与用例对应

- 每个 test **独立**、不依赖执行顺序；需要数据在本 test 内创建（如先创建公寓再编辑/删除）。
- 创建实体用**唯一名称**：`` `E2E公寓_${Date.now()}` ``、`` `E2E公寓_编辑_${Date.now()}` ``。
- 在 `test.describe` 或 test 名称中标注 [docs/测试用例.md](../docs/测试用例.md) 编号，例如「业务端 - 公寓管理（对应测试用例 3.1、3.2）」、test 名末尾「（APT-C-01）」。

## 禁止项（硬性约束）

- 不使用 `waitForTimeout`、固定 sleep。
- 不在 `business.spec.ts` 中写登录步骤；不在 `admin.spec.ts` 中写运营端登录步骤。
- 不使用英文 UI 文案（如 "Submit"、"Add Apartment"）。
- 不依赖 class/复杂 CSS 的脆弱选择器。
- 不依赖测试顺序或跨 test 共享可变状态；创建数据用唯一名。

## 验收自检（写完用例后）

- [ ] 仅使用 getByRole / getByLabel / getByPlaceholder / getByText，必要时才用 locator 并注释原因？
- [ ] 弹窗内操作是否都限定在 `getByRole('dialog')` 或 `.filter({ hasText: '...' })` 内？
- [ ] 是否存在 `waitForTimeout` 或固定 sleep？
- [ ] 业务端/运营端是否未重复写登录步骤？
- [ ] 创建的数据是否使用 `Date.now()` 或其它唯一标识？
- [ ] 运行 `pnpm exec playwright test business -- --grep "公寓管理"`（或对应模块）是否全部通过？

## 黄金示例（公寓管理）

```typescript
// 列表页：标题 + 有列表或空状态
test('公寓管理页有标题且为列表或空状态（APT-L-01）', async ({ page }) => {
  await page.goto('/apartments');
  await expect(page.getByRole('heading', { name: '公寓管理' })).toBeVisible({ timeout: 10000 });
  const hasList = (await page.locator('a[href^="/apartments/"]').count()) > 0;
  const hasEmpty = await page.getByText('暂无公寓').isVisible().catch(() => false);
  expect(hasList || hasEmpty).toBe(true);
});

// 创建：弹窗内 getByLabel，唯一名，断言弹窗关闭与列表出现
test('可创建新公寓并出现在列表（APT-C-01）', async ({ page }) => {
  await page.goto('/apartments');
  const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
  if (!(await newBtn.isVisible())) return;
  await newBtn.click();
  const name = `E2E公寓_${Date.now()}`;
  const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
  await dialog.getByLabel('公寓名称').fill(name);
  await dialog.getByLabel('地址').fill('E2E测试地址');
  await dialog.getByRole('button', { name: '创建' }).click();
  await expect(dialog).toBeHidden({ timeout: 10000 });
  await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible({ timeout: 10000 });
});
```

扩展其它模块时，保持：**同一套定位优先级、弹窗限定、可选状态处理、唯一名与独立性**。

## 常用命令

```bash
# 全量 E2E（需先 pnpm run dev:local）
pnpm run test:e2e

# 仅业务端
pnpm exec playwright test business

# 按模块过滤
pnpm exec playwright test business -- --grep "公寓管理"
pnpm exec playwright test admin -- --grep "运营"
```
