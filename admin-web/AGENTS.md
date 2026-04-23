# 运营后台开发指南

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

- **框架**: Vite + React Router 6
- **语言**: TypeScript (strict mode)
- **UI**: ant Desigh
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
- 使用 Zod 进行运行时验证

### 格式化

- 使用 Prettier，两个空格缩进，单引号，trailing comma

---

## 前端分层架构

项目采用 **视图层 → 业务层 → 基础层** 的三层架构，通过 ESLint `import/no-restricted-paths` 强制约束引用方向。

| 层级 | 目录 | 职责 | 可引用 |
|------|------|------|--------|
| **视图层** | `pages/`, `components/`, `router/` | UI 渲染、页面路由、组件展示、路由配置 | 业务层、基础层 |
| **业务层** | `hooks/`, `schemas/` | 业务逻辑、数据获取、状态管理、表单校验 | 基础层 |
| **基础层** | `api/`, `utils/`, `types/`, `constants/`, `contexts/`, `i18n/`, `styles/` | 工具函数、类型定义、常量、API 客户端、国际化 | 仅同层或更底层 |

**禁止的反向引用（由 lint 拦截）：**
- 业务层 → 视图层（如 `hooks/` 引用 `components/`）
- 基础层 → 视图层（如 `utils/` 引用 `pages/`）
- 基础层 → 业务层（如 `utils/` 引用 `schemas/`）

## pages/ 与 features/ 职责划分

| 目录 | 职责 | 复杂度阈值 |
|------|------|-----------|
| `pages/` | 路由入口 + 简单组装（< 100 行） | 简单页面 |
| `features/` | 复杂业务逻辑、组件、hooks、schemas | 复杂页面（> 100 行） |

---

## API 客户端组织

- `src/api/admin-client.ts`：运营后台专用 API 客户端
- API 方法按功能模块分文件组织

---

## 测试规范

- 组件测试放在组件同目录下：`SomeDialog.test.tsx`
- 使用 Testing Library 的 `render` 和 `screen`
- 测试文件后缀：`.test.tsx`

---

## 相关文档

- [仓库总览](../README.md)
- [布局与间距规范](../docs/layout-conventions.md)
- [API 契约说明](../docs/api-contract/README.md)
