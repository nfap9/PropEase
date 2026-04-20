# 布局与间距规范

本规范定义页面级布局的统一间距取值，确保不同页面之间的结构一致性。

## 页面容器

```
┌─────────────────────────────────────────┐
│ main (p-6, 24px)                        │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ page-header (space-y-6)         │   │
│   │                                 │   │
│   │   page-title                   │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ card-grid (gap-4)               │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ section (space-y-6)             │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

## 间距取值

| 层级 | 用途 | Tailwind | 值 |
|------|------|----------|----|
| 页面容器 | main 内边距 | `p-6` | 24px |
| 页面级区块 | 标题区 / 卡片行 / 图表区之间 | `space-y-6` | 24px |
| 卡片网格 | 统计卡片、ChartCard 之间 | `gap-4` | 16px |

## 命名扩展

在 `tailwind.config.ts` 中扩展语义化间距名称：

```ts
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      spacing: {
        'page': '24px',      // 页面级区块间距
        'card-gap': '16px',  // 卡片网格间距
      }
    }
  }
}
```

对应 Tailwind 工具类：

- `space-y-page` → 24px
- `gap-card-gap` → 16px

## 具体示例

```tsx
// 典型页面结构
<main className="flex-1 overflow-y-auto bg-gray-50 p-6">
  <div className="space-y-page">                    {/* 24px 区块间距 */}
    {/* 页面标题 */}
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">标题</h1>
      <Button>操作</Button>
    </div>

    {/* 统计卡片行 */}
    <div className="grid gap-card-gap grid-cols-2 lg:grid-cols-4">
      <Card>...</Card>
      <Card>...</Card>
    </div>

    {/* 图表区域 */}
    <div className="space-y-page">
      <ChartCard title="图表">...</ChartCard>
      <ChartCard title="另一个图表">...</ChartCard>
    </div>
  </div>
</main>
```

## 组件内间距

组件内部间距使用组件库自身 API，不额外覆盖：

- Antd Card：`styles={{ body: { padding: '12px 16px' }}}`
- ChartCard 内置 padding（通过组件 prop 控制）

## 不要做的事

- 混用多种间距值（如 `space-y-4` + `space-y-6` + `gap-6` 在同一层级）
- 在页面级区块使用 `mt-6` 而非 `space-y-6`
- 用固定 px 值替代 Tailwind 工具类
