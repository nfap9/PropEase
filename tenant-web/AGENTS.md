# Web 前端开发指南

## AI 助手必读（必查）

在修改 `tenant-web/src/` 下的任何前端代码之前，**必须**阅读周围的注释和相关文件。这些注释包含必要的上下文（组件用途、数据流、状态管理）。

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

与 API 及后端统一的规范见 [docs/naming-conventions.md](../docs/naming-conventions.md)，摘要如下：

- 组件文件使用 `kebab-case.tsx`（如 `data-table.tsx`）
- 组件名使用 `PascalCase`（如 `DataTable`）
- 类型/接口使用 `PascalCase`
- **与 API 一致的字段名使用 snake_case**（如 `full_name`、`organization_id`、`created_at`），类型定义与请求/响应体与此一致
- 局部变量、函数参数使用 `camelCase`
- 常量使用 `UPPER_CASE`

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
tenant-web/
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
├── tailwind.config.ts
└── tsconfig.json
```