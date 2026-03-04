---
name: naming-conventions
description: 前后端命名规范。API 契约使用 snake_case，前端类型与 API 一致用 snake_case，局部变量用 camelCase。编写 API 或前端类型时必须遵循。
---

# 前后端命名规范

## 核心原则

- **API 契约**：统一 **snake_case**，与数据库列名一致
- **前端类型**：与 API 对应的字段使用 **snake_case**
- **局部变量**：前端局部变量、函数参数使用 **camelCase**

## API 契约（snake_case）

| 范围 | 示例 |
|------|------|
| 路径参数 | `:org_id`、`:id` |
| 查询参数 | `org_id`、`organization_id`、`active_only` |
| 请求体字段 | `full_name`、`verification_code`、`organization_id` |
| 响应体字段 | `created_at`、`user_full_name`、`access_token` |

## 前端命名

| 范围 | 约定 | 示例 |
|------|------|------|
| 组件文件名 | kebab-case | `data-table.tsx`、`auth-guard.tsx` |
| 组件名 | PascalCase | `DataTable`、`AuthGuard` |
| 类型/接口名 | PascalCase | `User`、`OrganizationMember` |
| **与 API 一致的字段** | **snake_case** | `full_name`、`organization_id`、`created_at` |
| 局部变量、函数参数 | camelCase | `currentOrg`、`fullName` |
| 常量 | UPPER_CASE | `API_BASE`、`DEFAULT_PAGE_SIZE` |

## 示例

```typescript
// ✅ 正确：API 字段用 snake_case
interface User {
  id: string;
  full_name: string;      // snake_case
  organization_id: string; // snake_case
  created_at: string;      // snake_case
}

// ✅ 正确：局部变量用 camelCase
const currentUser = user;
const orgId = user.organization_id;

// ❌ 错误：API 字段用 camelCase
interface User {
  fullName: string;        // ❌ 应为 full_name
  organizationId: string;  // ❌ 应为 organization_id
}
```

## 后端命名

| 范围 | 约定 | 示例 |
|------|------|------|
| Prisma 模型/列 | snake_case | 与 schema 一致 |
| 路由路径参数、查询 | snake_case | `req.params.org_id` |
| 请求/响应 body、Zod | snake_case | `full_name`、`organization_id` |
