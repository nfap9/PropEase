# 运营后台开发指南

> 修改 `admin-web/` 目录下的任何代码前，**优先阅读本文件**。
> 仓库总览见 [`../AGENTS.md`](../AGENTS.md)。

Vite + React Router，面向平台运营人员，端口 3001。

## 定位与职责

运营后台（admin-web）是**平台运营视角**的管理系统，不涉及公寓、房间、租客、租约等业务数据的管理。

**核心关注点：**
- 平台收益（订阅收入、服务收入）
- 平台运营数据（团队数、用户数、活跃订阅）
- 服务定价与计费配置
- 商店配置与订阅管理
- 品牌与界面定制
- 团队与账号管理

**不涉及的功能：**
- 公寓/房间/租客/租约管理
- 账单、水电费管理
- 房源管理

## 技术栈

| 类别 | 技术 |
|------|------|
| 构建工具 | Vite 6，默认端口 `3001` |
| 框架 | React 18 + React Router DOM 7 |
| UI 库 | Ant Design 6 |
| 样式 | Tailwind CSS 3.4 + `tailwindcss-animate` |
| 表单 | antd Form（实际配合 react-hook-form + Controller 使用，见 `STANDARDS.md`） |
| 数据获取 | TanStack Query 5 + Axios |
| 测试 | Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/jest-dom` |

## 构建与测试命令

```bash
pnpm dev          # vite
pnpm build        # tsc && vite build
pnpm preview      # vite preview
pnpm lint         # eslint src --ext ts,tsx
pnpm type-check   # tsc --noEmit
pnpm test         # vitest (watch)
pnpm test:run     # vitest run
pnpm test:coverage # vitest run --coverage
```

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

### 组件导出

**优先使用命名导出**，避免默认导出：

```typescript
// ✅ 正确
export function SubscriptionsPageContent() { ... }

// ❌ 禁止
export default function SubscriptionsPageContent() { ... }
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
视图层 (pages/ components/ router/)
    ↓ 引用
业务层 (hooks/ schemas/)
    ↓ 引用
基础设施层 (api/ contexts/ i18n/)
    ↓ 引用
工具层 (utils/ types/ constants/)
```

| 层级 | 目录 | 职责 | 可引用 |
|------|------|------|--------|
| **视图层** | `pages/`, `components/`, `router/` | UI 渲染、页面路由、组件展示 | 业务层、基础设施层、工具层 |
| **业务层** | `hooks/`, `schemas/` | 业务逻辑、数据获取、表单类型定义 | 基础设施层、工具层 |
| **基础设施层** | `api/`, `contexts/`, `i18n/` | HTTP 客户端、全局状态、国际化上下文 | 工具层 |
| **工具层** | `utils/`, `types/`, `constants/` | 纯函数、类型声明、静态常量 | 工具层（仅同层） |

**禁止的反向引用（由 ESLint 拦截）：**

- 工具层 → 上层任意层（`utils/` 禁止引用 `api/`、`contexts/`、`i18n/`、`hooks/`、`schemas/`、`components/`、`pages/`）
- 基础设施层 → 业务层、视图层
- 业务层 → 视图层

**`schemas/` 与 `constants/` 的区别：**
- `schemas/`：业务层，存放类型定义（interface/type）和纯函数（如 `validatePassword()`）
- `constants/`：工具层，存放静态配置和枚举（如 `BILLS`、`NAV_CONFIG`）

**i18n 消息的获取方式：**
- 视图层：`useTranslation()` hook 或直接 import `adminMessages`
- 业务层（hooks）：从 `@/constants/messages` 导入，**禁止直接 import `@/i18n`**

## pages/ 与 features/ 职责划分

| 目录 | 职责 | 复杂度阈值 |
|------|------|-----------|
| `pages/` | 路由入口 + 简单组装（< 100 行） | 简单页面 |
| `features/` | 复杂业务逻辑、组件、hooks、schemas | 复杂页面（> 100 行） |

## API 客户端组织

- `src/api/admin-client.ts`：运营后台专用 API 客户端
- API 方法按功能模块分文件组织

## 测试规范

- **框架**: Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/jest-dom`
- **Setup**: `src/test/setup.ts`
- **Coverage**: v8 provider
- **测试文件命名**: `.test.tsx` / `.test.ts`
- **组件测试位置**: 放在组件同目录下（如 `SomeDialog.test.tsx`）
- 使用 Testing Library 的 `render` 和 `screen`

## 相关文档

- [仓库总览](../README.md)
- [布局与间距规范](../docs/layout-conventions.md)
- [API 契约说明](../docs/api-contract/README.md)
