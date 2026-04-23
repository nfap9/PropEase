# 租户端开发指南

Vite + React Router，面向租客端用户，端口 3000。

## 技术栈

- **框架**: Vite + React Router 6
- **语言**: TypeScript (strict mode)
- **UI**: ant Design
- **样式**: Tailwind CSS
- **表单**: React Hook Form + Zod
- **数据获取**: TanStack Query + Axios
- **测试**: Vitest + Testing Library

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

## 前端分层架构

项目采用 **视图层 → 业务层 → 基础层** 的三层架构，通过 ESLint `import/no-restricted-paths` 强制约束引用方向。

| 层级 | 目录 | 职责 | 可引用 |
|------|------|------|--------|
| **视图层** | `pages/`, `components/`, `routes/` | UI 渲染、页面路由、组件展示、路由配置 | 业务层、基础层 |
| **业务层** | `hooks/`, `schemas/` | 业务逻辑、数据获取、状态管理、表单校验 | 基础层 |
| **基础层** | `api/`, `utils/`, `types/`, `constants/`, `contexts/`, `i18n/`, `styles/` | 工具函数、类型定义、常量、API 客户端、国际化 | 仅同层或更底层 |

**禁止的反向引用（由 lint 拦截）：**
- 业务层 → 视图层（如 `hooks/` 引用 `components/`）
- 基础层 → 视图层（如 `utils/` 引用 `pages/`）
- 基础层 → 业务层（如 `utils/` 引用 `schemas/`）

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

## 测试规范

- 组件测试放在组件同目录下：`LeaseDialog.test.tsx`
- 使用 Testing Library 的 `render` 和 `screen`
- 测试文件后缀：`.test.tsx`
