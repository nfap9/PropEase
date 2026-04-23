# 租户端开发指南

Vite + React Router，面向租客端用户，端口 3000。

## 技术栈

- **框架**: Vite + React Router 6
- **语言**: TypeScript (strict mode)
- **UI**: ant Design
- **样式**: Tailwind CSS
- **表单**: antd Form（内置校验，无需第三方表单库）
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
import { useQuery } from '@tanstack/react-query';
import { Button, Form } from 'antd';
import { cn } from '@/utils';
import { LeaseCard } from '@/pages/leases/components';
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

### 格式化

- 使用 Prettier，两个空格缩进，单引号，trailing comma

## 前端分层架构

项目采用 **视图层 → 业务层 → 基础设施层 → 工具层** 的四层架构，通过 ESLint `import/no-restricted-paths` 强制约束引用方向。

```
视图层 (pages/ components/ routes/)
    ↓ 引用
业务层 (hooks/ schemas/)
    ↓ 引用
基础设施层 (api/ contexts/ i18n/)
    ↓ 引用
工具层 (utils/ types/ constants/)
```

| 层级 | 目录 | 职责 | 可引用 |
|------|------|------|--------|
| **视图层** | `pages/`, `components/`, `routes/` | UI 渲染、页面路由、组件展示 | 业务层、基础设施层、工具层 |
| **业务层** | `hooks/`, `schemas/` | 业务逻辑、数据获取、表单类型定义 | 基础设施层、工具层 |
| **基础设施层** | `api/`, `contexts/`, `i18n/` | HTTP 客户端、全局状态、国际化上下文 | 工具层 |
| **工具层** | `utils/`, `types/`, `constants/` | 纯函数、类型声明、静态常量 | 工具层（仅同层） |

**禁止的反向引用（由 ESLint 拦截）：**

- 工具层 → 上层任意层（`utils/` 禁止引用 `api/`、`contexts/`、`i18n/`、`hooks/`、`schemas/`、`components/`、`pages/`）
- 基础设施层 → 业务层、视图层
- 业务层 → 视图层

**`schemas/` 与 `constants/` 的区别：**
- `schemas/`：业务层，存放类型定义（接口/type）和纯函数（如 `getDefaultXxx()`）
- `constants/`：工具层，存放静态配置和枚举（如 `BILLS`、`PERMISSION_LABELS`、`LAYOUT_OPTIONS`）

**i18n 消息的获取方式：**
- 视图层：`useTranslation()` hook 或直接 import `tenantMessages`
- 业务层（hooks）：从 `@/constants/messages` 导入，**禁止直接 import `@/i18n`**

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
