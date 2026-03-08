# Web 前端开发指南

## AI 助手必读（必查）

在修改 `web/src/` 下的任何前端代码之前，**必须**阅读周围的注释和相关文件。这些注释包含必要的上下文（组件用途、数据流、状态管理）。

### 代码位置指南

- **组件顶部注释**：组件用途、Props 说明、使用场景
- **复杂逻辑注释**：解释业务逻辑和数据处理
- **类型定义**：TypeScript 类型必须完整且准确

### 规则（必须遵守）

- **开始工作前**
  - 阅读你要修改区域的代码和注释
  - 理解组件的职责边界
  - 检查相关 API 接口定义

- **工作中**
  - 所有组件要保证职责单一，能够拆分的功能使用独立的组件/hooks/utils实现
  - 复用现有组件和工具函数
  - 保持类型定义同步

- **完成时**
  - 确保没有 TypeScript 错误
  - 确保没有 ESLint 警告
  - 验证 UI 显示正确的中文文本
  - 删除或重写任何可能被误认为当前指导但不再适用的注释。
  - 保持文档字符串和注释简洁准确；它们旨在防止重复发现。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript (strict mode)
- **UI 组件**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **表单**: React Hook Form + Zod
- **数据获取**: TanStack Query + Axios
- **图表**: Recharts

## 代码风格

### 命名约定

与 API 及后端统一的规范见 [docs/naming-conventions.md](../../docs/naming-conventions.md)，摘要如下：

- 组件文件使用 `kebab-case.tsx`（如 `data-table.tsx`）
- 组件名使用 `PascalCase`（如 `DataTable`）
- 类型/接口使用 `PascalCase`
- **与 API 一致的字段名使用 snake_case**（如 `full_name`、`organization_id`、`created_at`），类型定义与请求/响应体与此一致
- 局部变量、函数参数使用 `camelCase`
- 常量使用 `UPPER_CASE`

### 组件结构

```tsx
// 1. 导入
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. 类型定义
interface ExampleProps {
  title: string
  onSubmit: () => void
}

// 3. 组件定义
export function Example({ title, onSubmit }: ExampleProps) {
  // 3.1 Hooks
  const [isOpen, setIsOpen] = useState(false)

  // 3.2 派生状态
  const buttonText = isOpen ? '关闭' : '打开'

  // 3.3 事件处理
  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  // 3.4 渲染
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>{buttonText}</Button>
    </div>
  )
}
```

### 通用规则

- 使用函数组件和 Hooks
- 优先使用命名导出（`export function`）而非默认导出
- 保持组件简洁，复杂逻辑提取到自定义 Hook
- 使用 `cn()` 工具函数合并 Tailwind 类名

### 类型规则

- 永远不要使用 `any` 类型
- 为所有 Props 定义类型
- 使用 Zod 进行运行时验证
- API 响应必须定义类型

```tsx
// 好的做法
interface User {
  id: number
  name: string
  email: string
}

// 避免
const user: any = fetchData()
```

## 项目结构

```
web/
├── src/
│   ├── app/                 # Next.js App Router 页面
│   │   ├── layout.tsx       # 根布局
│   │   ├── page.tsx         # 首页
│   │   ├── login/           # 登录页
│   │   ├── register/        # 注册页
│   │   ├── dashboard/       # 仪表盘
│   │   ├── apartments/      # 公寓管理
│   │   ├── rooms/           # 房间管理
│   │   ├── tenants/         # 租客管理
│   │   ├── leases/          # 租约管理
│   │   ├── utilities/       # 水电读数
│   │   │   └── history/     # 历史水电记录
│   │   ├── bills/           # 账单管理
│   │   ├── reports/         # 报表分析
│   │   └── settings/        # 设置
│   ├── components/          # React 组件
│   │   ├── ui/              # shadcn/ui 原始组件
│   │   ├── layout/          # 布局组件
│   │   └── common/          # 通用业务组件
│   ├── lib/                 # 库和工具
│   │   ├── api/             # API 客户端
│   │   ├── auth/            # 认证上下文
│   │   └── utils.ts         # 工具函数
│   ├── hooks/               # 自定义 Hooks
│   └── types/               # TypeScript 类型定义
├── public/                  # 静态资源
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 数据获取模式

### API 客户端

使用 `lib/api/` 下的模块化 API 客户端：

```tsx
// lib/api/apartments.ts
import { apiClient } from './client'

export const apartmentsApi = {
  list: (orgId: number) =>
    apiClient.get(`/apartments?org_id=${orgId}`),

  create: (orgId: number, data: ApartmentCreate) =>
    apiClient.post(`/apartments?org_id=${orgId}`, data),
}
```

### TanStack Query 使用

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apartmentsApi } from '@/lib/api/apartments'

// 查询
function useApartments(orgId: number) {
  return useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
  })
}

// 变更
function useCreateApartment(orgId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ApartmentCreate) =>
      apartmentsApi.create(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] })
    },
  })
}
```

## 表单处理

使用 React Hook Form + Zod：

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 1. 定义 Schema
const apartmentSchema = z.object({
  name: z.string().min(1, '请输入公寓名称'),
  address: z.string().min(1, '请输入地址'),
  description: z.string().optional(),
})

type ApartmentForm = z.infer<typeof apartmentSchema>

// 2. 使用表单
function ApartmentForm() {
  const form = useForm<ApartmentForm>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  })

  const onSubmit = (data: ApartmentForm) => {
    // 处理提交
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* 表单字段 */}
      </form>
    </Form>
  )
}
```

## UI 组件使用

### shadcn/ui 组件

项目使用 shadcn/ui，组件位于 `components/ui/`。常用组件：

- `Button` - 按钮
- `Input` - 输入框
- `Select` - 下拉选择
- `Dialog` - 对话框
- `Table` - 表格
- `Form` - 表单
- `Card` - 卡片
- `Badge` - 标签

### 样式约定

- 使用 Tailwind CSS 类名
- 使用 `cn()` 合并类名
- 遵循现有设计模式

```tsx
import { cn } from '@/lib/utils'

// 条件类名
<div className={cn(
  'base-class',
  isActive && 'active-class',
  className
)}>
```

## 国际化（中文）

**重要**: 所有用户界面文本必须使用中文。

```tsx
// 好的做法
<Button>保存</Button>
<span>加载中...</span>
<p>请输入有效的邮箱地址</p>

// 避免
<Button>Save</Button>
<span>Loading...</span>
```

## 认证流程

### AuthGuard 组件

需要认证的页面使用 `AuthGuard` 包裹：

```tsx
import { AuthGuard } from '@/components/layout/auth-guard'

export default function ProtectedPage() {
  return (
    <AuthGuard>
      {/* 页面内容 */}
    </AuthGuard>
  )
}
```

### 获取当前用户

```tsx
import { useAuth } from '@/lib/auth/context'

function Component() {
  const { user, organization, isLoading } = useAuth()

  if (isLoading) return <div>加载中...</div>

  return <div>欢迎, {user?.full_name}</div>
}
```

## 常用命令

```bash
# 开发（在项目根目录执行）
pnpm dev:web           # 启动前端开发服务器

# 代码质量（在 web 目录执行）
pnpm lint              # 运行 ESLint
pnpm lint:fix          # ESLint 并自动修复
pnpm type-check        # TypeScript 类型检查（tsc --noEmit）
pnpm build             # 构建（含类型检查）

# 添加 UI 组件
npx shadcn@latest add button
npx shadcn@latest add dialog
```

如需修改 API 地址，编辑 `.env.local` 中的 `NEXT_PUBLIC_API_URL`。

## 常见问题

### 如何添加新页面？

1. 在 `src/app/` 下创建文件夹
2. 创建 `page.tsx` 文件
3. 如果需要认证，用 `AuthGuard` 包裹

### 如何添加新 API 接口？

1. 在 `src/lib/api/` 下添加或更新模块
2. 定义请求/响应类型
3. 在组件中使用 TanStack Query

### 如何添加新组件？

1. 通用 UI 组件放在 `src/components/ui/`
2. 业务组件放在 `src/components/common/`
3. 布局组件放在 `src/components/layout/`

## 访问地址

- 开发服务器: http://localhost:3000
- 登录页面: http://localhost:3000/login
- 仪表盘: http://localhost:3000/dashboard
