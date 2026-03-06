# 前端添加 data-testid 指南

## 概述

本文档说明如何在 React/Next.js 组件中添加 `data-testid` 属性，用于 E2E 测试定位元素。

## 为什么使用 data-testid

| 方式 | 优点 | 缺点 |
|------|------|------|
| 文案定位 | 直观 | ❌ 文案变更导致测试失败 |
| CSS 类名 | 精确 | ❌ 样式变更导致测试失败 |
| **data-testid** | ⭐ 稳定、语义化、独立于UI | 需要额外添加属性 |

## 基本用法

### 1. 页面标题

```tsx
// ❌ 不推荐
<h1 className="text-3xl font-bold">首页</h1>

// ✅ 推荐
<h1 className="text-3xl font-bold" data-testid="dashboard-heading">
  首页
</h1>
```

### 2. 按钮

```tsx
// ❌ 不推荐
<button onClick={handleCreate}>新增公寓</button>

// ✅ 推荐
<button
  onClick={handleCreate}
  data-testid="apartments-new-btn"
>
  新增公寓
</button>
```

### 3. 输入框

```tsx
// ❌ 不推荐
<input
  type="text"
  placeholder="请输入公寓名称"
  value={name}
  onChange={e => setName(e.target.value)}
/>

// ✅ 推荐
<input
  type="text"
  placeholder="请输入公寓名称"
  value={name}
  onChange={e => setName(e.target.value)}
  data-testid="apartments-name-input"
/>
```

### 4. 链接

```tsx
// ❌ 不推荐
<Link href="/apartments">公寓管理</Link>

// ✅ 推荐
<Link
  href="/apartments"
  data-testid="nav-apartments"
>
  公寓管理
</Link>
```

### 5. 列表

```tsx
// ✅ 推荐：列表容器
<div className="grid gap-4" data-testid="apartments-list">
  {apartments.map(apt => (
    <Card key={apt.id} data-testid={`apartment-${apt.id}`}>
      <CardContent>
        <h3>{apt.name}</h3>
      </CardContent>
    </Card>
  ))}
</div>
```

### 6. 弹窗/对话框

```tsx
// ❌ 不推荐
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>新增公寓</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>

// ✅ 推荐
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent data-testid="apartments-create-dialog">
    <DialogHeader>
      <DialogTitle data-testid="apartments-create-dialog-title">
        新增公寓
      </DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### 7. 下拉选择

```tsx
// ❌ 不推荐
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="请选择" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">选项1</SelectItem>
  </SelectContent>
</Select>

// ✅ 推荐
<Select
  value={value}
  onValueChange={setValue}
  data-testid="leases-apartment-select"
>
  <SelectTrigger data-testid="leases-apartment-select-trigger">
    <SelectValue placeholder="请选择" />
  </SelectTrigger>
  <SelectContent data-testid="leases-apartment-select-content">
    <SelectItem value="option1">选项1</SelectItem>
  </SelectContent>
</Select>
```

### 8. 空状态

```tsx
// ✅ 推荐
{items.length === 0 && (
  <div className="text-center py-12" data-testid="apartments-empty-state">
    <Building2 className="mx-auto h-16 w-16 text-muted-foreground" />
    <p className="mt-4">暂无公寓</p>
    <Button className="mt-4">新增公寓</Button>
  </div>
)}
```

### 9. 表单

```tsx
// ✅ 推荐：整个表单容器
<form onSubmit={handleSubmit} data-testid="apartments-create-form">
  <div className="space-y-4">
    <div data-testid="apartments-name-field">
      <Label>公寓名称</Label>
      <Input
        name="name"
        data-testid="apartments-name-input"
      />
    </div>

    <div data-testid="apartments-address-field">
      <Label>地址</Label>
      <Input
        name="address"
        data-testid="apartments-address-input"
      />
    </div>
  </div>

  <div className="flex gap-2">
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      data-testid="apartments-cancel-btn"
    >
      取消
    </Button>
    <Button
      type="submit"
      data-testid="apartments-confirm-btn"
    >
      创建
    </Button>
  </div>
</form>
```

### 10. 卡片/统计卡片

```tsx
// ✅ 推荐
<Card data-testid="dashboard-apartment-count">
  <CardHeader>
    <CardTitle>公寓数量</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">12</div>
  </CardContent>
</Card>
```

### 11. 导航菜单

```tsx
// ✅ 推荐：侧栏导航
<nav className="space-y-1" data-testid="main-nav">
  <Link
    href="/dashboard"
    data-testid="nav-dashboard"
    className="flex items-center gap-3 px-3 py-2"
  >
    <Home className="h-4 w-4" />
    首页
  </Link>

  <Link
    href="/apartments"
    data-testid="nav-apartments"
    className="flex items-center gap-3 px-3 py-2"
  >
    <Building2 className="h-4 w-4" />
    公寓管理
  </Link>
</nav>
```

### 12. 表格

```tsx
// ✅ 推荐：表格容器和行
<Table data-testid="apartments-table">
  <TableHeader>
    <TableRow>
      <TableHead>名称</TableHead>
      <TableHead>地址</TableHead>
      <TableHead>操作</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {apartments.map(apt => (
      <TableRow
        key={apt.id}
        data-testid={`apartment-row-${apt.id}`}
      >
        <TableCell data-testid={`apartment-name-${apt.id}`}>
          {apt.name}
        </TableCell>
        <TableCell data-testid={`apartment-address-${apt.id}`}>
          {apt.address}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger data-testid={`apartments-more-menu-${apt.id}`}>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleEdit(apt)}
                data-testid={`apartments-edit-btn-${apt.id}`}
              >
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(apt)}
                data-testid={`apartments-delete-btn-${apt.id}`}
              >
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 13. Tab 切换

```tsx
// ✅ 推荐
<Tabs defaultValue="overview" className="w-full">
  <TabsList data-testid="reports-tabs">
    <TabsTrigger value="overview" data-testid="reports-overview-tab">
      总览
    </TabsTrigger>
    <TabsTrigger value="income" data-testid="reports-income-tab">
      收入分析
    </TabsTrigger>
    <TabsTrigger value="occupancy" data-testid="reports-occupancy-tab">
      入住率
    </TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* 总览内容 */}
  </TabsContent>
  <TabsContent value="income">
    {/* 收入分析内容 */}
  </TabsContent>
  <TabsContent value="occupancy">
    {/* 入住率内容 */}
  </TabsContent>
</Tabs>
```

### 14. 通知/提示

```tsx
// ✅ 推荐
{error && (
  <div
    className="bg-destructive text-destructive-foreground px-4 py-3 rounded-md"
    data-testid="common-error"
  >
    {error}
  </div>
)}

{success && (
  <div
    className="bg-green-500 text-white px-4 py-3 rounded-md"
    data-testid="common-success"
  >
    {success}
  </div>
)}
```

### 15. 加载状态

```tsx
// ✅ 推荐
{isLoading ? (
  <div className="flex justify-center py-12" data-testid="common-loading">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
) : (
  <div data-testid="content-container">
    {/* 内容 */}
  </div>
)}
```

## 命名约定

### 格式

```
page-section-element
```

### 示例

| 元素类型 | 命名示例 | 说明 |
|---------|---------|------|
| 页面标题 | `dashboard-heading`, `apartments-heading` | page-heading |
| 按钮 | `apartments-new-btn`, `leases-confirm-btn` | section-action-btn |
| 输入框 | `apartments-name-input`, `tenants-phone-input` | section-field-input |
| 链接 | `nav-apartments`, `settings-team-link` | section-link |
| 列表 | `apartments-list`, `tenants-list` | section-list |
| 空状态 | `apartments-empty-state` | section-empty-state |
| 弹窗 | `apartments-create-dialog` | section-action-dialog |
| 下拉选择 | `leases-apartment-select` | section-field-select |
| 卡片 | `dashboard-apartment-count` | section-metric-card |

### 动态元素

```tsx
// 列表项、表格行等动态元素使用动态 testid
{items.map(item => (
  <div key={item.id} data-testid={`item-${item.id}`}>
    {item.name}
  </div>
))}

{items.map(item => (
  <TableRow key={item.id} data-testid={`row-${item.id}`}>
    <TableCell>{item.name}</TableCell>
  </TableRow>
))}
```

## 何时添加 data-testid

### ✅ 应该添加

- 页面标题
- 导航链接/菜单项
- 主要操作按钮（新增、编辑、删除等）
- 表单输入控件
- 下拉选择器
- 弹窗对话框
- 列表/表格容器
- 空状态提示
- 统计卡片
- Tab 切换
- 加载状态
- 错误/成功提示

### ❌ 不需要添加

- 纯装饰元素（图标、分割线等）
- 临时提示信息（可用其他方式定位）
- 非关键操作的次要元素
- 嵌套的重复元素（父元素已有 testid）

## 在现有组件中添加

### 示例 1: 修改现有组件

```tsx
// 修改前
<h1 className="text-3xl font-bold">首页</h1>

// 修改后
<h1 className="text-3xl font-bold" data-testid="dashboard-heading">
  首页
</h1>
```

### 示例 2: 为 Button 添加

```tsx
// shadcn/ui Button 组件
<Button
  onClick={handleCreate}
  data-testid="apartments-new-btn" // 添加这个属性
>
  新增公寓
</Button>
```

### 示例 3: 为 Input 添加

```tsx
// shadcn/ui Input 组件
<Input
  placeholder="请输入公寓名称"
  value={name}
  onChange={e => setName(e.target.value)}
  data-testid="apartments-name-input" // 添加这个属性
/>
```

### 示例 4: 为 Dialog 添加

```tsx
// shadcn/ui Dialog 组件
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent data-testid="apartments-create-dialog">
    <DialogHeader>
      <DialogTitle>新增公寓</DialogTitle>
    </DialogHeader>
    {/* 内容 */}
  </DialogContent>
</Dialog>
```

## 代码审查检查点

在代码审查时，检查以下内容：

### 新增页面/组件

- [ ] 页面标题有 `data-testid`
- [ ] 主要操作按钮有 `data-testid`
- [ ] 表单输入有 `data-testid`
- [ ] 列表容器有 `data-testid`
- [ ] 空状态有 `data-testid`

### 修改现有组件

- [ ] 如果修改了文案，确认测试是否有依赖
- [ ] 如果移除了元素，确认 testid 也要移除
- [ ] 如果重构了布局，确认 testid 仍然有效

## 常见问题

### Q1: data-testid 会影响生产环境性能吗？

**A:** 不会。`data-testid` 是一个自定义属性，不会被浏览器渲染到 DOM 树中，不会影响性能。

### Q2: 生产环境需要保留 data-testid 吗？

**A:** 可以在生产环境保留，不会有负面影响。如果担心代码体积，可以在构建时移除（一般不需要）。

### Q3: 一个元素可以添加多个 testid 吗？

**A:** 不推荐。每个元素只应有一个 `data-testid`。

### Q4: 动态生成的 testid 如何处理？

**A:** 使用模板字符串或 ID 组合：
```tsx
data-testid={`apartment-${apt.id}`}
```

### Q5: testid 命名需要遵循某种风格吗？

**A:** 建议使用 kebab-case，例如：`apartments-new-btn`。参考 `e2e/testids.ts` 中的命名。

## 参考资源

- [Playwright Test Locators](https://playwright.dev/docs/locators)
- [data-testid Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#using-testid)
- [Testing Library Guidelines](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library#using-the-wrong-query)
