# 租户端开发指南

Next.js 14 (App Router)，面向租客端用户，端口 3000。

---

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript (strict mode)
- **UI**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **表单**: React Hook Form + Zod
- **数据获取**: TanStack Query + Axios
- **测试**: Vitest + Testing Library

---

## 目录结构

```
src/
├── api/                  # API 客户端（按领域分文件）
├── auth/                 # 认证上下文
├── constants/            # 常量定义
├── contexts/             # React Context
├── features/             # 业务领域模块（可选，复杂模块使用）
│   └── [feature]/        # 按业务域组织
│       ├── components/   # 该领域的业务组件
│       ├── hooks/        # 该领域的自定义 hooks
│       ├── schemas/      # Zod schemas
│       └── *.columns.tsx # DataTable columns 定义
├── hooks/                # 顶层全局 hooks
├── i18n/                 # 国际化
├── utils/                # 通用工具函数（cn 合并 class 等）
├── app/                  # Next.js App Router 路由层
│   ├── layout.tsx        # 布局组件
│   ├── page.tsx         # 首页
│   └── [feature]/       # 业务功能路由
├── components/           # 通用 UI 组件
│   ├── ui/               # shadcn/ui 原始组件
│   ├── layout/           # 布局组件
│   ├── common/           # 跨业务复用组件（DataTable, PermissionGuard 等）
│   ├── charts/           # 图表组件
│   └── settings/         # 设置相关组件
└── types/                # TypeScript 类型定义
```

---

## 代码风格

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| API 字段 | snake_case | `full_name`, `organization_id` |
| 局部变量 | camelCase | `leaseId`, `isLoading` |
| 组件名 | PascalCase | `LeaseDialogs` |
| 组件文件 | kebab-case | `lease-dialogs.tsx` |
| 类型/接口 | PascalCase | `LeaseFormData` |
| 常量 | UPPER_CASE | `PERMISSIONS` |
| 目录 | kebab-case | `lease-fee-items/` |

### 导入顺序

1. Node 内置模块
2. 第三方包
3. 内部包（`@/` alias）
4. 相对导入（`./`, `../`）

```typescript
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/utils';
import { LeaseCard } from '@/features/leases/components';
```

### 组件导出

**优先使用命名导出**，避免默认导出：

```typescript
// ✅ 正确
export function LeasesPageContent() { ... }
export function LeaseCard() { ... }

// ❌ 禁止
export default function LeasesPageContent() { ... }
```

### TypeScript 规则

- **禁止使用 `any`**
- Props 必须定义类型
- API 响应必须定义类型
- 使用 Zod 进行运行时验证

### 格式化

- 使用 Prettier，两个空格缩进，单引号，trailing comma

---

## app/ 与 features/ 职责划分

| 目录 | 职责 | 复杂度阈值 |
|------|------|-----------|
| `app/` | 路由入口 + 简单组装（< 100 行） | 简单页面 |
| `features/` | 复杂业务逻辑、组件、hooks、schemas | 复杂页面（> 100 行） |

```tsx
// 简单页面（直接写在 app/）
export default function TenantsPage() {
  return <TenantsPageContent />;
}

// 复杂页面（提取到 features/）
// app/leases/page.tsx              # 路由入口
// features/leases/components/      # 业务组件
// features/leases/hooks/           # useLeaseOperations
// features/leases/leases.columns.tsx
```

---

## API 客户端组织

```
api/
├── index.ts           # 统一导出
├── client.ts          # Axios 实例配置
├── apartments.ts      # 公寓相关 API
├── leases.ts          # 租约相关 API
├── tenants.ts         # 租客相关 API
└── ...
```

---

## 测试规范

- 组件测试放在组件同目录下：`LeaseDialog.test.tsx`
- 使用 Testing Library 的 `render` 和 `screen`
- 测试文件后缀：`.test.tsx`

---

## 额外依赖

- `@radix-ui/react-switch`（其他项目可能没有）
