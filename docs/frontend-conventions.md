# 前端开发规范

本文档统一规范 `tenant-web/` 和 `admin-web/` 两个前端项目的结构和约定。

## 技术栈（统一）

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript (strict mode) |
| UI 组件 | shadcn/ui + Radix UI |
| 样式 | Tailwind CSS |
| 表单 | React Hook Form + Zod |
| 数据获取 | TanStack Query + Axios |
| 图表 | Recharts |
| 测试 | Vitest + Testing Library |

## 项目结构（统一）

```
src/
├── app/                 # Next.js App Router 路由层
│   ├── layout.tsx       # 布局组件
│   ├── page.tsx         # 首页
│   ├── (auth)/          # 认证相关路由组
│   ├── [feature]/       # 业务功能路由
│   │   ├── page.tsx     # 路由入口（应保持简洁）
│   │   └── [id]/         # 详情页路由
│   └── ...
│
├── components/          # 通用 UI 组件
│   ├── ui/              # shadcn/ui 原始组件
│   ├── layout/          # 布局组件（MainLayout, Sidebar 等）
│   ├── common/           # 跨业务复用组件（DataTable, PermissionGuard 等）
│   └── charts/           # 图表组件
│
├── features/            # 业务领域模块（可选，仅复杂模块使用）
│   └── [feature]/       # 按业务域组织
│       ├── components/   # 该领域的业务组件
│       ├── hooks/        # 该领域的自定义 hooks
│       ├── schemas/      # Zod schemas
│       ├── *.columns.tsx # DataTable columns 定义
│       └── *.utils.ts   # 领域工具函数
│
├── hooks/               # 顶层全局 hooks
├── lib/                 # 库和工具
│   ├── api/             # API 客户端（按领域分文件）
│   ├── auth/            # 认证上下文
│   ├── utils.ts         # 通用工具函数
│   └── constants/       # 常量定义
│
└── types/               # TypeScript 类型定义
```

## `app/` 与 `features/` 职责划分

### 规则

| 目录 | 职责 | 复杂度阈值 |
|------|------|-----------|
| `app/` | 路由入口 + 简单组装（< 100 行） | 简单页面 |
| `features/` | 复杂业务逻辑、组件、hooks、schemas | 复杂页面（> 100 行） |

### 示例

**简单页面（直接写在 app/）**
```tsx
// app/tenants/page.tsx
export default function TenantsPage() {
  return <TenantsPageContent />;
}
```

**复杂页面（提取到 features/）**
```
app/leases/page.tsx              # 7行，路由入口
features/leases/components/      # 20+ 业务组件
features/leases/hooks/           # useLeaseOperations
features/leases/leases.columns.tsx
```

## 命名规范（统一）

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | kebab-case | `lease-dialogs.tsx` |
| 组件名 | PascalCase | `LeaseDialogs` |
| 类型/接口 | PascalCase | `LeaseFormData` |
| API 字段 | snake_case | `full_name`, `organization_id` |
| 局部变量 | camelCase | `leaseId`, `isLoading` |
| 常量 | UPPER_CASE | `PERMISSIONS` |
| 目录 | kebab-case | `lease-fee-items/` |

## TypeScript 规则（统一）

- 禁止使用 `any`
- Props 必须定义类型
- API 响应必须定义类型
- 使用 Zod 进行运行时验证

```typescript
// ✅ 正确
interface Lease {
  id: number;
  room_id: number;
  start_date: string;
}

// ❌ 错误
const lease: any = fetchData();
```

## API 客户端组织（统一）

```
lib/api/
├── index.ts           # 统一导出
├── client.ts          # Axios 实例配置
├── apartments.ts      # 公寓相关 API
├── leases.ts          # 租约相关 API
├── tenants.ts         # 租客相关 API
└── ...
```

## Tailwind CSS 规则（统一）

content 配置应统一使用简洁形式：

```typescript
// tailwind.config.ts
content: [
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
  "../packages/shared-ui/src/**/*.{js,ts,jsx,tsx,mdx}",
]
```

## 组件导出规范（统一）

优先使用命名导出，避免默认导出混淆：

```typescript
// ✅ 命名导出
export function LeasesPageContent() { ... }
export function LeaseCard() { ... }

// ❌ 默认导出（禁止）
export default function LeasesPageContent() { ... }
```

## 测试规范（统一）

- 组件测试放在组件同目录下：`LeaseDialog.test.tsx`
- 测试文件使用 `.test.tsx` 后缀
- 使用 Testing Library 的 `render` 和 `screen`

## 两项目特殊差异

### tenant-web
- 端口：`3000`
- 额外依赖：`@radix-ui/react-switch`
- 有 `components/settings/` 目录

### admin-web
- 端口：`3001`
- 额外配置：`vitest.config.ts`
- 有 `test/` 目录用于 E2E 测试辅助

---

更新各项目 AGENTS.md 时，应引用本文档而非重复定义规范。
