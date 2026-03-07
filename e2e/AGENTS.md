# E2E 测试编写指南

本文档为 AI 助手编写 Playwright E2E 用例的快速参考。详细规范见 [docs/e2e-writing-guide.md](../docs/e2e-writing-guide.md)。

## 代码位置

- **业务端**：`e2e/business.spec.ts`
- **运营端**：`e2e/admin.spec.ts`
- **用例来源**：`docs/测试用例.md`（可选在 test 名称中标注用例编号，如 `APT-C-01`）

## 定位器优先级

1. **data-testid**（首选）

  你可以自己将需要的id写入 /e2e/testids.ts 后使用

   ```typescript
   page.getByTestId('btn-create-apartment')
   page.getByTestId('input-apartment-name')
   ```
2. **角色 + 可访问名称**
   ```typescript
   page.getByRole('button', { name: '创建' })
   page.getByRole('dialog').filter({ hasText: '新增公寓' })
   ```
3. **标签/占位符**：`getByLabel()`、`getByPlaceholder()`
4. **文本**：`getByText()`（辅助）

**禁止**：依赖 class、复杂 CSS、`locator('div.xxx')`

## 核心规则

- **不写登录**：用例依赖 `storageState`，业务端/运营端不再写登录步骤
- **不固定等待**：禁止 `waitForTimeout`、固定 sleep；用 `expect(...).toBeVisible({ timeout })` 等断言
- **数据隔离**：每个 test 独立运行，创建数据用唯一名（如 `` `E2E公寓_${Date.now()}` ``）
- **中文 UI**：所有文案与界面一致，禁止英文

## 运行命令

```bash
# 全量 E2E（需先启动前后端）
pnpm run test:e2e

# 仅业务端
pnpm exec playwright test business

# 按模块过滤
pnpm exec playwright test business -- --grep "公寓管理"
```

## 黄金示例

```typescript
test('可创建新公寓（APT-C-01）', async ({ page }) => {
  await page.goto('/apartments');
  const newBtn = page.getByTestId('btn-new-apartment').first();
  if (!(await newBtn.isVisible())) return;

  await newBtn.click();
  const name = `E2E公寓_${Date.now()}`;
  const dialog = page.getByTestId('dialog-create-apartment');

  await dialog.getByTestId('input-apartment-name').fill(name);
  await dialog.getByTestId('input-address').fill('E2E测试地址');
  await dialog.getByTestId('btn-submit').click();

  await expect(dialog).toBeHidden({ timeout: 10000 });
  await expect(page.getByTestId('apartment-link').filter({ hasText: name })).toBeVisible();
});
```

## 验收自检

- [ ] 定位器优先使用 `getByTestId`，其次 `getByRole`/`getByLabel`？
- [ ] 无 `waitForTimeout` 或固定 sleep？
- [ ] 业务端/运营端未重复写登录？
- [ ] 创建数据使用唯一名？
- [ ] 运行对应模块用例全部通过？
