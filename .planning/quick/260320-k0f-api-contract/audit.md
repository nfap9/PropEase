# api-contract adherence audit

**Audit date:** 2026-03-20
**Auditor:** 260320-k0f quick task

## Summary

本审计检查 api、tenant-web、admin-web 三个模块的 API 类型定义是否遵循 `@apartment-ultra/api-contract` 契约。

**结论：整体架构正确**，web-api-client 正确解包 SuccessBody，responseWrapper 正确包装响应。三个前端模块均从 `@/types`（即 api-contract）导入类型。但存在若干类型对齐缺口，主要在 api 模块的服务层/仓库层。

---

## api 模块

### 响应包装与错误处理

| 位置 | 状态 | 说明 |
|------|------|------|
| `api/src/middlewares/responseWrapper.ts` | [ok] | 正确使用 `BusinessCode.SUCCESS` 和 `SuccessBody` 从 api-contract |
| `api/src/errors/base.ts` | [ok] | `getBusinessCode()` 正确映射到 `BusinessCode` 枚举值；`toResponse()` 返回结构符合 `ErrorResponseBody` |

### 控制器层

| 位置 | 状态 | 说明 |
|------|------|------|
| `api/src/routes/v1/apartments.controller.ts` | [gap] | 控制器无显式返回类型注解，返回 Prisma 模型类型（如 `Apartment`）。`responseWrapper` 运行时包装，但控制器类型未声明返回 `SuccessBody<T>` |
| `api/src/routes/v1/bills.controller.ts` | [gap] | 同上，返回原始 Bill 模型 |
| `api/src/routes/v1/organizations.controller.ts` | [gap] | 同上 |
| `api/src/routes/v1/subscriptions.controller.ts` | [gap] | 同上 |

**说明：** 控制器不显式类型化返回 `SuccessBody<T>` 是可接受的设计——运行时由 `responseWrapper` 中间件统一包装。但缺少类型声明意味着 TypeScript 无法在编译期验证响应结构。

### 服务层与仓库层

| 位置 | 状态 | 说明 |
|------|------|------|
| `api/src/services/apartment.service.ts` | [gap] | 使用 `Prisma.ApartmentCreateInput` 和 `Prisma.ApartmentUpdateInput`，返回 `Apartment`（Prisma 类型） |
| `api/src/repositories/apartment.repo.ts` | [gap] | `ApartmentWithStats` 在 repo 本地定义，未从 api-contract 导入。定义结构为 `Apartment & { rooms: Room[]; room_stats: RoomStats }`，与 api-contract 的 `ApartmentWithStats` 结构一致但无关联 |

### Prisma 类型 vs api-contract 类型不匹配（已知缺口）

| 字段 | Prisma 类型 | api-contract 类型 | 运行时行为 |
|------|------------|-----------------|-----------|
| `created_at`, `updated_at` | `DateTime` | `string` | Express `res.json()` 将 Date 序列化为 ISO 字符串，行为正确 |
| `land_area`, `total_area`, `landlord_rent`, `operating_cost` | `Decimal` | `number` | Prisma `Decimal` 序列化为字符串（如 `"123.45"`），JSON.parse 后为 string，非 number |

**影响评估：** 运行时行为正确（数据可正常传输），但 TypeScript 类型不准确，前端收到的数据中 decimal 字段类型为 string 而非 number。

### 二进制响应（例外）

| 路由 | 状态 | 说明 |
|------|------|------|
| `/bills/export/excel` | [ok] | 返回 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，跳过 SuccessBody 包装（由 `shouldSkipResponseWrap` 控制） |
| `/bills/:id/pdf` | [ok] | 同上，返回 PDF 二进制流 |

---

## tenant-web 模块

| 位置 | 状态 | 说明 |
|------|------|------|
| `tenant-web/src/types/index.ts` | [ok] | `export * from '@apartment-ultra/api-contract'`，统一导出契约类型 |
| `tenant-web/src/lib/api/apartments.ts` | [ok] | 从 `@/types` 导入 `Apartment`, `ApartmentWithStats`, `Room`, `UtilityConfig` 等 |
| `tenant-web/src/lib/api/bills.ts` | [gap] | `BillFeeItem` 从 `@apartment-ultra/api-contract` 直接导入而非 `@/types`（不一致） |
| `tenant-web/src/lib/api/organizations.ts` | [ok] | 从 `@/types` 导入所有类型 |
| `tenant-web/src/lib/api/client.ts` | [ok] | 使用 `createBrowserApiClient`，响应拦截器正确解包 `SuccessBody<T>` |

---

## admin-web 模块

| 位置 | 状态 | 说明 |
|------|------|------|
| `admin-web/src/types/index.ts` | [ok] | `export * from '@apartment-ultra/api-contract'` |
| `admin-web/src/lib/api/apartments.ts` | [ok] | 从 `@/types` 导入类型，与 tenant-web 一致 |
| `admin-web/src/lib/api/client.ts` | [ok] | 使用 `createBrowserApiClient`，响应拦截器正确解包 |
| `admin-web/src/lib/api/client.ts` (admin-client.ts) | [ok] | `createAdminApiClient`，无 refresh token，行为正确 |

---

## web-api-client 包

| 位置 | 状态 | 说明 |
|------|------|------|
| `packages/web-api-client/src/index.ts` | [ok] | 导入 `SuccessBody`, `BusinessCode`, `ErrorResponseBody` 等从 api-contract；响应拦截器正确解包 `SuccessBody<T>` 到 `data` 字段 |

---

## 已知未遵循 api-contract 的类型/位置

| 模块 | 文件 | 类型/变量 | api-contract 对应 | 严重程度 |
|------|------|-----------|------------------|---------|
| api | `api/src/repositories/apartment.repo.ts` | `ApartmentWithStats`（本地定义） | `packages/api-contract/src/apartments.ts` 中的 `ApartmentWithStats` | 低（结构一致但未导入） |
| api | Prisma `Decimal` 字段 | `land_area`, `total_area`, `landlord_rent`, `operating_cost` | api-contract 定义为 `number` | 低（运行时正确，类型不匹配） |
| tenant-web | `tenant-web/src/lib/api/bills.ts` | `BillFeeItem` 导入来源 | 应统一从 `@/types` 导入 | 低（功能正常，导入来源不一致） |
| api | 所有 controller | 返回类型无 `SuccessBody<T>` 标注 | `SuccessBody<T>` | 低（运行时正确，编译期类型不精确） |

---

## 结论

### 已正确遵循 api-contract 的主要模块

- **packages/web-api-client**：响应拦截器正确处理 `SuccessBody` 包装/解包
- **packages/api-contract**：定义完整，类型导出规范
- **responseWrapper.ts**：运行时正确使用 `BusinessCode` 和 `SuccessBody` 包装响应
- **AppError**：错误码映射到 `BusinessCode`，结构符合 `ErrorResponseBody`
- **tenant-web types**：统一从 `@/types`（即 api-contract）re-export
- **admin-web types**：同上
- **前端 API clients**：正确从 `@/types` 导入类型，`BillFeeItem` 例外

### 主要缺口

1. **Prisma Decimal 序列化**：`land_area` 等字段在 api-contract 定义为 `number`，但 Prisma `Decimal` 序列化后为字符串，前端收到的是 string 而非 number。运行时功能正常但类型不准确。

2. **ApartmentWithStats 定义位置**：`ApartmentWithStats` 在 repo 层本地定义，结构与 api-contract 一致但未从 api-contract 导入或导出，造成类型定义分散。

3. **BillFeeItem 导入来源不一致**：`tenant-web/src/lib/api/bills.ts` 从 `@apartment-ultra/api-contract` 直接导入，而其他文件均通过 `@/types`。

4. **控制器返回类型**：控制器返回 Prisma 模型类型而非显式 `SuccessBody<T>`，TypeScript 编译期无法验证响应结构是否对齐契约。

### 建议

1. 在 `packages/api-contract/src/apartments.ts` 中导出 `ApartmentWithStats` 类型定义，并在 repo 层引用该类型
2. 考虑在 API 层添加统一的序列化步骤（Prisma extension 或 toJSON），确保 Decimal 和 Date 字段类型与 api-contract 一致
3. 统一 `BillFeeItem` 等类型的导入来源，均通过 `@/types`
4. （可选）为控制器返回类型添加 `SuccessBody<T>` 标注，提升编译期类型安全性
