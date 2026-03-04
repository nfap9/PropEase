---
name: frontend-component-guidelines
description: 前端组件拆分指南。用于审查组件职责、判断是否需要拆分、选择合适的拆分模式。当编写或重构 React 组件时自动应用。
---

# 前端组件拆分指南

## 核心原则

**单一职责**：每个组件只做一件事，只有一个改变的理由。

## 组件大小阈值

| 行数 | 建议 |
|------|------|
| < 150 行 | 通常不需要拆分 |
| 150-250 行 | 检查职责是否单一 |
| > 250 行 | 必须评估是否需要拆分 |

## 需要拆分的信号

1. **职责混杂**：组件做了多件不相关的事
2. **重复渲染**：部分 JSX 在条件分支中重复出现
3. **状态隔离**：某些状态只被组件的某一部分使用
4. **可复用性**：组件的某部分在其他地方也需要使用
5. **测试困难**：难以单独测试组件的某个功能

## 拆分模式

### 模式 A：子组件抽取
适用：表单字段分组、卡片内容区域、列表项

```tsx
// 抽取独立的子组件
function DateFields({ form }) {
  return (
    <div className="grid grid-cols-2 gap-4">...</div>
  );
}
```

### 模式 B：职责分离
适用：选择器 + 创建功能、列表 + 详情面板

```tsx
// 1. 纯选择器
function TenantSelect({ value, onValueChange }) { ... }

// 2. 创建对话框
function CreateTenantDialog({ open, onSuccess }) { ... }

// 3. 组合组件（按需使用）
function TenantSelectWithCreate() { ... }
```

### 模式 C：Hook 抽取
适用：表单重置逻辑、数据获取、复杂状态管理

```tsx
function useLeaseFormReset(form, room, open) {
  useEffect(() => { ... }, [room, open, form]);
}
```

## 命名约定

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 选择器 | `xxx-select.tsx` | `tenant-select.tsx` |
| 对话框 | `xxx-dialog.tsx` | `create-tenant-dialog.tsx` |
| 表单 | `xxx-form.tsx` | `lease-form.tsx` |
| 列表 | `xxx-list.tsx` | `apartment-list.tsx` |

## 代码审查检查清单

- [ ] 组件行数是否超过 250 行？
- [ ] 组件是否只做一件事？
- [ ] 是否有可以复用的子区块？
- [ ] 状态是否隔离良好？
- [ ] 是否内嵌了独立的功能（如对话框）？
- [ ] 测试是否容易编写？
