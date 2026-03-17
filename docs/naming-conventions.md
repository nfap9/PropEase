# 命名规范

本文档统一约束 Apartment Ultra 在数据库、API、前端类型与测试中的命名方式。

## 总原则

- 业务含义优先，命名要稳定、可预测。
- API 与数据库字段尽量保持一致，减少无意义映射。
- 前端局部变量可以用更符合 TypeScript/React 习惯的 `camelCase`，但对外契约保持一致。

## 数据库

- 表名：`snake_case` 复数形式或现有 Prisma `@@map` 映射名称
- 字段名：`snake_case`
- 外键字段：`{entity}_id`
- 时间字段：优先使用 `created_at`、`updated_at`
- 布尔字段：优先使用 `is_*`、`has_*`

示例：

- `organization_id`
- `created_at`
- `is_active`

## API 路径与参数

- 路径段：`kebab-case` 或已有 REST 风格路径，避免大小写混用
- 查询参数：`snake_case`
- 请求体 / 响应体字段：`snake_case`

示例：

- `/api/v1/service-products`
- `?org_id=xxx`
- `{ "full_name": "张三" }`

## 前端

### 类型与接口

- 与 API 直接对应的字段名：保留 `snake_case`
- 组件名、类型名、Hook 名：使用 TypeScript 常规风格

示例：

- `interface Tenant { full_name: string | null }`
- `function TenantListPage()`
- `function useSubscriptionStatus()`

### 局部变量

- 使用 `camelCase`
- 仅在承接 API 原始对象结构时保留 `snake_case`

示例：

- `const selectedOrgId = organization?.id`
- `const fullName = tenant.full_name`

## 文件命名

- React 组件文件：`kebab-case.tsx`
- 工具文件：`kebab-case.ts`
- 测试文件：`*.test.ts`、`*.spec.ts`
- 页面目录遵循 Next.js App Router 约定

## 测试命名

- E2E `describe` / `test` 名称使用中文，描述业务行为
- `data-testid` 使用稳定、可读、可搜索的短横线格式

示例：

- `subscription-upgrade-btn`
- `admin-org-count`

## 文档命名

- 面向开发者的模块说明：`AGENTS.md`
- 面向目录索引或总览：`README.md`
- 测试说明优先使用中文文件名，按业务域分目录

## 何时需要更新本文档

出现以下情况时，应同步更新：

- 新增跨层命名约定
- API 字段风格发生调整
- 测试 ID 规范统一升级
- 模块目录命名规则发生变化
