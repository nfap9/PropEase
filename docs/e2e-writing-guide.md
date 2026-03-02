# E2E 测试编写规范

本文档约定 Playwright E2E 测试的写法，供人工与 AI 实现用例时遵循，以保证用例可运行、可维护并与 [测试用例.md](./测试用例.md) 对齐。

## 1. 项目结构

- **业务端**：`e2e/business.spec.ts`，依赖 `e2e/business.auth.setup.ts` 提供的登录态（`.auth/business.json`），用例中**不要**再写登录步骤。
- **运营端**：`e2e/admin.spec.ts`，依赖 `e2e/admin.auth.setup.ts`（`.auth/admin.json`）。
- **运行**：先启动 API（端口 8000）与前端（端口 3000），例如 `pnpm run dev:local`；业务端密码登录需以 `SEED_E2E_USER=true` 启动 API 一次以创建测试用户。执行 `pnpm run test:e2e` 或 `pnpm exec playwright test business`（仅业务端）。
- **配置**：`playwright.config.ts` 中 `baseURL: 'http://localhost:3000'`，未配置 webServer，需手动启动前后端。

## 2. 定位器策略

### 2.1 优先级（从高到低）

1. **角色 + 可访问名称**：`getByRole('button', { name: '创建' })`、`getByRole('link', { name: '公寓管理' })`、`getByRole('heading', { name: '公寓管理' })`、`getByRole('menuitem', { name: '编辑' })`。
2. **标签/占位符**：`getByLabel('公寓名称')`、`getByPlaceholder('搜索...')`。
3. **文本**：`getByText('暂无公寓')`、`getByText(/E2E公寓_\\d+/)`，用于无更好语义时的辅助。
4. **弹窗内限定**：先取 `page.getByRole('dialog')` 或 `.filter({ hasText: '新增公寓' })`，再在其上 `.getByLabel()` / `.getByRole()`，避免点到其他同名控件。
5. **仅当必要时**：`locator('a[href^="/apartments/"]')` 等基于 DOM 的定位，用于列表链接、无稳定可访问名的场景，并加注释说明原因。

**禁止**：依赖 class、复杂 CSS、裸的 `locator('div.xxx')`、基于 DOM 层级的长链（如 `div > form > input:nth-child(3)`），除非确无更好方式并已注释。

### 2.2 弹窗与确认框

- **Dialog**：用 `page.getByRole('dialog').filter({ hasText: '新增公寓' })` 限定到当前弹窗，所有表单操作和断言都在该 locator 下进行；关闭后可用 `expect(dialog).toBeHidden()`。
- **AlertDialog（确认删除等）**：用 `page.getByRole('alertdialog').filter({ hasText: '确认删除' })`；按钮用 `getByRole('button', { name: '取消' })`、`getByRole('button', { name: /^删除/ })`（兼容「删除」「删除中...」）。

**弹窗/确认框文案约定（与 E2E 强绑定，修改前端时请同步用例）**：

- **弹窗标题**：`新增公寓`、`编辑公寓`、`新增租客`、`编辑租客`、`新增租约`、`编辑租约`、`新增房间`、`批量添加房间`、`编辑房间`、`费用配置`、`登记付款`、`创建组织`、`编辑组织`、`邀请成员`、`批量导入水电读数`、`新建角色`、`新建运营账号`、`新建套餐` 等。
- **确认框标题**：`确认删除`、`确认终止租约`、`确认退租`、`确认取消订阅`、`确认移除` 等。
- **确认/提交按钮**：`删除` / `删除中...`、`保存` / `保存中...`、`创建` / `创建中...`、`取消`、`确认退租` 等；确认类按钮须有可见文案，便于 `getByRole('button', { name: /^删除/ })` 等定位。

### 2.3 下拉菜单

- 先点击触发按钮（如卡片内唯一按钮），再 `getByRole('menuitem', { name: '编辑' })` 或 `name: '删除'` 点击。

### 2.4 E2E 依赖的 UI 文案（修改前端时请同步更新 E2E）

以下文案与 E2E 断言强绑定，修改时需同步改对应用例或本列表。

- **空状态**：`暂无公寓`（公寓列表）、`暂无通知`（通知列表）、`暂无数据`（通用表格，见 `data-table.tsx`）。
- **校验/错误**：`请输入公寓名称`（公寓名称必填）、`请输入租客姓名`、`请输入联系电话` 等 Zod 错误信息；toast 或页内错误用正则匹配时常用 `/超过|限制|已达|不能|错误|失败|请重试/`。
- 新增表单或空状态时，若 E2E 会断言该文案，请在本小节或 [e2e/AGENTS.md](../e2e/AGENTS.md) 中补充说明。

## 3. 等待与稳定性

- **禁止**：`waitForTimeout`、`page.waitForTimeout`、固定 `setTimeout`。
- **推荐**：依赖 Playwright 的自动等待；对关键步骤或较慢接口使用 `expect(...).toBeVisible({ timeout: 10000 })`、`expect(...).toBeHidden({ timeout: 10000 })`；必要时 `await page.waitForLoadState('networkidle')`。
- 弹窗关闭、列表刷新等用 `expect(dialog).toBeHidden()`、`expect(page.getByText(name)).toBeVisible()` 等断言作为“等待完成”的条件。

## 4. 中文 UI 与可选状态

- 所有按钮、链接、标题、占位符、错误提示必须与**当前界面中文**一致（如「创建」「新增公寓」「请输入公寓名称」），不得使用英文占位（如 "Submit"、"Add"）。
- 列表可能为空时，用「有 A 或有 B」的断言，例如：`const hasList = ...; const hasEmpty = ...; expect(hasList || hasEmpty).toBe(true)`；或 `if (await newBtn.isVisible()) { ... } else { await expect(page.getByText('暂无公寓')).toBeVisible(); }`。不要断言“一定存在列表”或“一定存在某条数据”（除非该用例前置步骤刚创建了该数据）。

## 5. 数据隔离与独立性

- 每个 test 应可**独立运行**、不依赖执行顺序；需要数据时在**本 test 内**创建（如先创建公寓再编辑/删除）。
- 创建实体时使用**唯一名称**，例如 `` `E2E公寓_${Date.now()}` ``、`` `E2E公寓_编辑_${Date.now()}` ``，避免并行或重复运行冲突。
- 不依赖其他 test 留下的数据；不共享可变状态。

## 6. 与测试用例文档对应

- 在 `test.describe` 或 test 名称中标注对应 [测试用例.md](./测试用例.md) 的编号或模块，例如「业务端 - 公寓管理（对应测试用例 3.1、3.2）」、test 名末尾「（APT-C-01）」。
- 步骤与预期结果应与文档中「测试步骤」「预期结果」一致；若实现有差异（如仅测部分分支），在 test 内注释说明。

## 7. 禁止项（给 AI / 人工的硬性约束）

- 不使用 `waitForTimeout`、固定 sleep。
- 不在 `business.spec.ts` 中写登录步骤（已用 storageState）；不在 `admin.spec.ts` 中写运营端登录步骤。
- 不使用英文 UI 文案；不写「Submit」「Add Apartment」等。
- 不依赖 class/复杂 CSS 的脆弱选择器；优先 `getByRole` / `getByLabel` / `getByText`。
- 不依赖测试顺序或跨 test 共享可变状态；创建数据用唯一名。

## 8. 验收自检（写完用例后）

- [ ] 仅使用 getByRole / getByLabel / getByPlaceholder / getByText，必要时才用 locator 并注释原因？
- [ ] 弹窗内操作是否都限定在 `getByRole('dialog')` 或 `.filter({ hasText: '...' })` 内？
- [ ] 是否存在 `waitForTimeout` 或固定 sleep？
- [ ] 业务端/运营端是否未重复写登录步骤？
- [ ] 创建的数据是否使用 `Date.now()` 或其它唯一标识？
- [ ] 运行 `pnpm exec playwright test business -- --grep "公寓管理"`（或对应模块）是否全部通过？

## 9. 黄金示例（公寓管理）

以下片段可作为「公寓管理」类用例的参考风格（定位方式、弹窗限定、可选状态、唯一名创建）。

```typescript
// 列表页：标题 + 有列表或空状态
test('公寓管理页有标题且为列表或空状态（APT-L-01）', async ({ page }) => {
  await page.goto('/apartments');
  await expect(page.getByRole('heading', { name: '公寓管理' })).toBeVisible({ timeout: 10000 });
  const hasList = (await page.locator('a[href^="/apartments/"]').count()) > 0;
  const hasEmpty = await page.getByText('暂无公寓').isVisible().catch(() => false);
  expect(hasList || hasEmpty).toBe(true);
});

// 创建：弹窗内用 getByLabel，唯一名，断言弹窗关闭与列表出现
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

// 编辑：先创建再在卡片上打开下拉 -> 编辑 -> 保存，断言新名称出现
// 删除：先创建再打开下拉 -> 删除 -> 确认，断言该卡片消失
```

扩展其它模块时，保持：**同一套定位优先级、弹窗限定、可选状态处理、唯一名与独立性**。
