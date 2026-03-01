# 前后端命名规范

本文档约定 API 契约与前后端代码中的命名风格，便于与数据库、Python 遗留（api-legacy）保持一致，并避免前后端歧义。

## 原则

- **API 契约**（请求/响应 JSON、路径参数、查询参数）：统一 **snake_case**，与数据库列名、api-legacy 一致。
- **前端**：与 API 直接对应的类型和字段使用 snake_case；组件内局部变量、函数参数使用 **camelCase**（符合 TypeScript/React 惯例）。
- **后端**：与 Prisma/API 对应的字段使用 snake_case；局部变量、函数参数可沿用 camelCase 或 snake_case（与现有 api 代码风格一致）。

## API 契约（snake_case）

以下一律使用 **snake_case**：

| 范围       | 示例 |
|------------|------|
| 路径参数   | `:org_id`、`:id` |
| 查询参数   | `org_id`、`organization_id`、`active_only` |
| 请求体字段 | `full_name`、`verification_code`、`organization_id` |
| 响应体字段 | `created_at`、`user_full_name`、`access_token` |

- 后端（api）在序列化、路由参数、Zod schema 中保持上述命名。
- 前端在类型定义（如 `User`、`OrganizationMember`）、请求体、以及直接展示 API 数据的属性访问（如 `row.original.organization_id`）中使用相同命名，**不做** snake_case ↔ camelCase 的自动转换。

## 前端（web）命名

| 范围           | 约定           | 示例 |
|----------------|----------------|------|
| 组件文件名     | kebab-case     | `data-table.tsx`、`auth-guard.tsx` |
| 组件名         | PascalCase     | `DataTable`、`AuthGuard` |
| 类型/接口名    | PascalCase     | `User`、`OrganizationMember` |
| **与 API 一致的字段** | **snake_case** | `full_name`、`organization_id`、`created_at` |
| 局部变量、函数参数 | camelCase   | `currentOrg`、`fullName`（发请求时再映射为 `full_name`） |
| 常量           | UPPER_CASE     | `API_BASE`、`DEFAULT_PAGE_SIZE` |

说明：从 API 取到的对象（如 `user`、`member`）其属性名与 API 一致，使用 snake_case（如 `user.full_name`）；仅在纯前端逻辑中的变量、参数使用 camelCase。

## 后端（api）命名

| 范围                 | 约定         | 示例 |
|----------------------|--------------|------|
| Prisma 模型/列       | snake_case   | 与 schema 一致 |
| 路由路径参数、查询   | snake_case   | `req.params.org_id`、`req.query.organization_id` |
| 请求/响应 body、Zod  | snake_case   | `full_name`、`organization_id` |
| 局部变量、函数参数   | 与现有风格一致 | 可 camelCase 或 snake_case |

## 参考

- API 契约格式：[docs/api-contract/README.md](api-contract/README.md)
- 前端开发约定：`web/AGENTS.md` 中「命名约定」一节以本文为准；类型与 API 字段名遵循本文「API 契约」与「前端」表格。
