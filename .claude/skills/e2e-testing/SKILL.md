---
name: e2e-testing
description: E2E 测试编写规范。使用 Playwright 编写测试时必须遵循的定位器策略、等待策略、数据隔离规则。编写或审查 E2E 测试时自动应用。
---

# E2E 测试编写规范

## 定位器优先级

1. **角色 + 可访问名称**（首选）
   ```typescript
   page.getByRole('button', { name: '创建' })
   page.getByRole('link', { name: '公寓管理' })
   page.getByRole('heading', { name: '公寓管理' })
   ```

2. **标签/占位符**
   ```typescript
   page.getByLabel('公寓名称')
   page.getByPlaceholder('搜索...')
   ```

3. **文本**（辅助）
   ```typescript
   page.getByText('暂无公寓')
   page.getByText(/E2E公寓_\d+/)
   ```

4. **弹窗内限定**
   ```typescript
   const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' })
   await dialog.getByLabel('公寓名称').fill(name)
   ```

**禁止**：依赖 class、复杂 CSS、裸的 `locator('div.xxx')`

## 弹窗处理

```typescript
// Dialog
const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' })
await dialog.getByRole('button', { name: '创建' }).click()
await expect(dialog).toBeHidden({ timeout: 10000 })

// AlertDialog（确认框）
const alert = page.getByRole('alertdialog').filter({ hasText: '确认删除' })
await alert.getByRole('button', { name: /^删除/ }).click()
```

## 等待策略

- **禁止**：`waitForTimeout`、固定 `setTimeout`
- **推荐**：
  ```typescript
  await expect(element).toBeVisible({ timeout: 10000 })
  await expect(dialog).toBeHidden()
  await page.waitForLoadState('networkidle')
  ```

## 中文 UI 约定

所有按钮、链接、标题、占位符、错误提示必须与当前界面中文一致：

- 空状态：`暂无公寓`、`暂无通知`、`暂无数据`
- 确认按钮：`删除` / `删除中...`、`保存` / `保存中...`、`创建` / `创建中...`
- 错误信息：`请输入公寓名称`、`请输入租客姓名`

## 数据隔离

- 每个 test 必须可**独立运行**
- 创建数据使用**唯一名称**：`` `E2E公寓_${Date.now()}` ``
- 不依赖其他 test 留下的数据

## 黄金示例

```typescript
test('可创建新公寓（APT-C-01）', async ({ page }) => {
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
  await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
});
```

## 禁止项

- ❌ `waitForTimeout` 或固定 sleep
- ❌ 业务端测试中写登录步骤
- ❌ 英文 UI 文案（Submit、Add 等）
- ❌ 依赖 class/CSS 的脆弱选择器
- ❌ 依赖测试顺序或跨 test 共享状态
