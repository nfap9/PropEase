# api-legacy 与 api 接口对比

本文档对比 **api-legacy**（Python FastAPI）与 **api**（Node/Express/TypeScript）的接口在路径、类型、参数、响应体及功能上的一致性。两套 API 前缀均为 `/api/v1`（根路径 `/health` 无前缀）。

---

## 对比说明

- **路径**：legacy 使用 `{org_id}` 等占位符，api 使用 `:orgId` / `:org_id`（部分路由与 legacy 一致用下划线）。路径语义一致即视为一致。
- **组织上下文**：legacy 多数接口通过 **query `org_id`** 传组织；api 通过 **请求头/ JWT 解析出当前组织**（`requireOrgMembership(req)`），无 query `org_id`。功能上等价，仅传参方式不同。
- **响应包装**：api 成功响应统一为 `{ code: 0, data, message }`（部分路径不包装）；legacy 多为直接返回资源或 204。对比时以「业务数据」为准。

---

## 1. 根路径

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/health` | ✓ `{ status, app, version }` | ✓ 同 | ✅ 一致 |

---

## 2. 认证 `/api/v1/auth`

| 方法 | 路径 | legacy 请求/响应 | api 请求/响应 | 一致性 |
|------|------|------------------|----------------|--------|
| POST | `/register` | Body: `UserCreate` → 201 `UserResponse` | Body: phone, full_name, password, verification_code → 201 用户对象 | ✅ 路径与功能一致；字段名 snake_case 与 legacy 对齐 |
| POST | `/login` | Body: `UserLogin` → `Token` | Body: phone + (password \| verification_code) → access_token, refresh_token, token_type | ✅ 一致 |
| POST | `/sms/send` | Body: `SendSmsCode` → 204 | Body: phone, purpose → 204 | ✅ 一致 |
| POST | `/refresh` | Body: `RefreshTokenRequest` → `Token` | Body: refresh_token → Token | ✅ 一致 |
| GET | `/me` | - → `UserResponse` | - → 当前用户（Console JWT） | ✅ 一致 |

---

## 3. 组织 `/api/v1/organizations`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | - → 组织列表 | - → 当前用户组织列表（含 role） | ✅ |
| POST | `/` | Body: `OrganizationCreate` → 201 | Body: name, slug? → 201 | ✅ |
| GET | `/personal` | - → 个人团队组织 | - → 同 | ✅ |
| POST | `/personal/migrate` | Body: `MigratePersonalTeamRequest` → `MigrationStatsResponse` | Body: target_org_id → apartments, rooms, ... | ✅ |
| GET | `/:orgId` | path org_id | path orgId（api 命名） | ✅ 路径一致 |
| PUT | `/:orgId` | Body: `OrganizationUpdate` | Body: name?, settings? | ✅ |
| GET | `/:orgId/deletion-preview` | - → DeletionPreview | - → can_delete, blockers, stats, org_name, is_personal | ✅ |
| DELETE | `/:orgId` | Body: ConfirmDeletionRequest? | Body: confirmed_name | ✅ |
| GET | `/:orgId/members` | - → 成员列表 | - → 成员列表（含 user_phone, user_full_name） | ✅ |
| POST | `/:orgId/members` | query/body: phone, role | query/body: phone, role? | ✅ |
| PUT | `/:orgId/members/:userId` | query: role | query/body: role | ✅ |
| DELETE | `/:orgId/members/:userId` | - | - | ✅ |
| GET | `/:orgId/usage` | - → OrganizationUsageResponse | - → plan, *_used, max_*, *_remaining, can_* | ✅ |

**差异**：legacy 用 query `org_id`；api 用 path `:orgId` 且组织权限由 JWT/上下文校验。

---

## 4. 公寓与房间 `/api/v1/apartments`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | query org_id → 列表(含统计) | 上下文 org → 列表(含 rooms、room_stats) | ✅ 功能一致；api 无 query org_id |
| POST | `/` | Body: ApartmentCreate | Body: name, address?, description? | ✅ |
| GET | `/:id` | path apartment_id, query org_id | path id，上下文 org | ✅ |
| PUT | `/:id` | Body: ApartmentUpdate | Body: name?, address?, description? | ✅ |
| DELETE | `/:id` | - | - | ✅ |
| GET | `/:apartmentId/rooms` | - → 房间列表 | - → 房间列表 | ✅ |
| POST | `/:apartmentId/rooms` | Body: RoomCreate | Body: room_number, layout?, monthly_rent, area?, notes?, status? | ✅ |
| POST | `/:apartmentId/rooms/batch` | Body: RoomBatchCreate | Body: room_numbers[], layout?, monthly_rent, ... | ✅ |
| GET | `/rooms/:roomId` | path room_id | path roomId | ✅ |
| PUT | `/rooms/:roomId` | Body: RoomUpdate | Body: room_number?, layout?, status?, monthly_rent?, area?, notes? | ✅ |
| DELETE | `/rooms/:roomId` | - | - | ✅ |
| GET | `/:apartmentId/utility-config` | - → UtilityConfig | - → UtilityConfig 或 404 | ✅ |
| POST | `/:apartmentId/utility-config` | Body: UtilityConfigCreate | Body: water_price_per_unit?, electricity_*, effective_from, ... | ✅ |
| PUT | `/:apartmentId/utility-config` | Body: UtilityConfigUpdate | Body: partial 同上 | ✅ |
| DELETE | `/:apartmentId/utility-config` | - | - | ✅ api 返回 204 |

**说明**：legacy 为 `GET /apartments/{apartment_id}`，api 为 `GET /apartments/:id`，语义一致。

---

## 5. 租客 `/api/v1/tenants`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | query org_id | 上下文 org | ✅ |
| POST | `/` | Body: TenantCreate | Body: name, phone?, id_card?, emergency_*, notes? | ✅ |
| GET | `/:id` | path tenant_id | path id | ✅ |
| PUT | `/:id` | Body: TenantUpdate | Body: 同上字段可选 | ✅ |
| DELETE | `/:id` | - | - | ✅ api 返回 204 |

---

## 6. 租约 `/api/v1/leases`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | query org_id, **active_only**? | 上下文 org，**无 active_only** | ⚠️ api 未实现 active_only 过滤 |
| POST | `/` | Body: LeaseCreate | Body: room_id, tenant_id, start_date, end_date?, billing_day?, monthly_rent, deposit?, water_rate?, electricity_rate?, notes? | ✅ |
| GET | `/:id` | path lease_id | path id | ✅ |
| PUT | `/:id` | Body: LeaseUpdate | Body: 同上可选 | ✅ |
| POST | `/:id/terminate` | - → message, lease | - → message: 'Lease terminated' | ✅ |
| DELETE | `/:id` | - | - | ✅ api 返回 204 |

**差异**：legacy 的 `GET /leases?active_only=true` 可只返回在租租约；api 当前返回全部租约。

---

## 7. 水电读数 `/api/v1/utilities`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | query org_id, **room_id?, period_year?, period_month?** | 上下文 org，**无过滤参数** | ⚠️ api 未实现 room_id/period 过滤 |
| POST | `/` | Body: UtilityReadingCreate | Body: room_id, period_year, period_month, reading_date, water_reading?, electricity_reading?, ... | ✅ |
| POST | `/batch` | Body: BatchUtilityReadingCreate | Body: room_id, period_*, reading_date, readings[] | ✅ |
| GET | `/export` | query org_id, period_year, period_month, days_range? → UtilityExportRoom[] | 上下文 org → id, room_number, apartment_name | ⚠️ legacy 有 period/days_range，api 无 |
| GET | `/:id` | path reading_id | path id | ✅ |
| PUT | `/:id` | Body: UtilityReadingUpdate | Body: 同上可选 | ✅ |
| DELETE | `/:id` | - | - | ✅ api 返回 204 |

**差异**：legacy 列表与 export 支持按房间、账期等过滤；api 列表与 export 未暴露这些 query。

---

## 8. 账单 `/api/v1/bills`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | query org_id, **lease_id?, year?, month?, status?** | 上下文 org，**无过滤** | ⚠️ api 未实现 lease_id/year/month/status 过滤 |
| POST | `/generate` | Body: GenerateBillsRequest | Body: bill_year, bill_month, due_date, lease_ids? | ✅ |
| POST | `/` | Body: BillCreate | Body: lease_id, bill_year, bill_month, due_date, rent_amount?, ... | ✅ |
| GET | `/export/excel` | query org_id, status?, year?, month?, exportType? | query status?, year?, month?, exportType? | ✅ 功能一致 |
| GET | `/:id` | path bill_id | path id | ✅ |
| PUT | `/:id` | Body: BillUpdate | Body: rent_amount?, water_amount?, ..., status?, notes? | ✅ |
| DELETE | `/:id` | - | - | ✅ api 返回 204 |
| POST | `/:id/payments` | Body: PaymentCreate | Body: amount, payment_date, payment_method?, reference?, notes? | ✅ |
| GET | `/:id/payments` | - → PaymentResponse[] | - → payments 数组 | ✅ |
| GET | `/:id/pdf` | - → PDF 流 | - → PDF 流 | ✅ |

**差异**：legacy 的 `GET /bills` 支持按租约、年月、状态筛选；api 当前返回当前组织下全部账单。

---

## 9. 报表 `/api/v1/reports`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | 无（legacy 无此路径） | 返回 `[]` | ➕ api 多出（占位） |
| GET | `/overview` | query org_id → dict | 上下文 org → apartments, rooms, tenants, active_leases | ✅ |
| GET | `/income` | query org_id, **year, start_month?, end_month?** → dict | 上下文 org，**无 year/月份参数** → total_income, by_month | ⚠️ api 无时间范围参数；by_month 可能为空对象 |
| GET | `/occupancy` | query org_id, **year** → dict | 上下文 org，**无 year** → total, occupied, rate | ⚠️ api 无 year 参数 |

**差异**：legacy 的 income/occupancy 支持按年（及月份范围）；api 未支持，且 income 的 by_month 未按月份聚合。

---

## 10. 权限 `/api/v1/permissions`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | - → Permission[] | - → Permission 列表 | ✅ |
| GET | `/grouped` | - → dict[str, Permission[]] | - → Record<resource, Permission[]> | ✅ |
| GET | `/organization/:org_id/roles/:role` | path org_id, role | 同 | ✅ |
| PUT | `/organization/:org_id/roles/:role` | Body: UpdateRolePermissionsRequest | Body: 需确认是否接收 permissions 列表 | ✅ 路径一致 |
| GET | `/me` | **query org_id** → UserPermissionsResponse | 上下文/无 query → permissions: string[] | ✅ 功能一致，传参方式不同 |
| GET | `/system-roles` | - → SystemRoleConfig[] | - → 同 | ✅ |
| POST | `/system-roles/grant` | Body: GrantSystemRoleRequest | Body: user_id, role | ✅ |
| POST | `/system-roles/revoke` | Body: RevokeSystemRoleRequest | Body: user_id, role | ✅ |
| GET | `/system-roles/me` | - → list[str] | - → 当前用户系统角色数组 | ✅ |

---

## 11. 订阅（业务侧）`/api/v1/subscriptions`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/plans` | query active_only? | - | ✅ 功能等价 |
| GET | `/plans/:plan_id` | path plan_id | 同 | ✅ |
| GET | `/organizations/:org_id/subscription` | path org_id | 同 | ✅ |
| GET | `/organizations/:org_id/subscription/status` | path org_id | 同 | ✅ |
| POST | `/organizations/:org_id/subscription` | Body: SubscribeRequest | Body: plan_id, billing_cycle? | ✅ |
| PUT | `/organizations/:org_id/subscription` | Body: ChangePlanRequest | Body: plan_id | ✅ |
| POST | `/organizations/:org_id/subscription/cancel` | Body: CancelSubscriptionRequest? | - | ✅ 均支持 |
| POST | `/organizations/:org_id/orders` | Body: SubscriptionOrderCreate | Body: plan_id, billing_cycle? | ✅ |
| GET | `/organizations/:org_id/orders/:order_id` | path org_id, order_id | 同 | ✅ |
| POST | **`/admin/plans`** | Body: SubscriptionPlanCreate → 201 | **无**（在 /admin/plans 下） | ⚠️ legacy 有 console 下 admin 创建计划；api 仅在 /api/v1/admin/plans 提供 |
| PUT | **`/admin/plans/:plan_id`** | Body: SubscriptionPlanUpdate | 同左，在 admin | ✅ 路径不同，功能在 admin 已覆盖 |
| DELETE | **`/admin/plans/:plan_id`** | - | 同左，在 admin | ✅ |

**说明**：legacy 的「订阅管理」同时有 `/api/v1/subscriptions/admin/plans` 与 `/api/v1/admin/plans`；api 仅保留 `/api/v1/admin/plans`，业务侧仅使用 `/api/v1/subscriptions/plans` 等。

---

## 12. 通知 `/api/v1/notifications`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/` | query unread_only?, limit, offset | - → 最多 50 条 | ⚠️ api 未支持 unread_only/limit/offset |
| GET | `/unread-count` | - → UnreadCountResponse | - → { count } | ✅ |
| POST | `/:id/read` | path notification_id | path id | ✅ |
| POST | `/mark-all-read` | query org_id? | - | ✅ 功能一致 |

---

## 13. 自定义角色 `/api/v1/custom-roles`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/orgs/:org_id/roles` | path org_id, **query active_only?** | path org_id，**无 active_only** | ⚠️ api 未实现 active_only |
| POST | `/orgs/:org_id/roles` | Body: CustomRoleCreate | Body: name, description?, permissions? | ✅ |
| GET | `/orgs/:org_id/roles/:role_id` | 同 | 同 | ✅ |
| PUT | `/orgs/:org_id/roles/:role_id` | Body: CustomRoleUpdate | Body: name?, description?, permissions?, is_active? | ✅ |
| DELETE | `/orgs/:org_id/roles/:role_id` | - | - | ✅ api 返回 204 |
| POST | `/orgs/:org_id/roles/init` | - → dict | - → message | ✅ |

---

## 14. 运营后台 `/api/v1/admin`

### 14.1 Admin 认证

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| POST | `/admin/auth/login` | Body: AdminLogin → AdminToken | Body: username, password → access_token, token_type（无 refresh） | ✅ 语义一致；api 无 refresh_token |

### 14.2 Admin 用户 / 角色 / 组织 / 注册用户 / 计划 / 订阅 / 统计

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| GET | `/admin/users/me` | - | - | ✅ |
| GET | `/admin/users` | query skip?, limit? | - | ⚠️ api 未支持分页 |
| POST | `/admin/users` | Body: AdminUserCreate | Body: username, password, name, email?, role_id | ✅ |
| GET | `/admin/users/:user_id` | path user_id | 同 | ✅ |
| PUT | `/admin/users/:user_id` | Body: AdminUserUpdate | Body: name?, email?, role_id?, is_active? | ✅ |
| DELETE | `/admin/users/:user_id` | - → 204 | - → 204 | ✅ |
| POST | `/admin/users/:user_id/reset-password` | Body: AdminPasswordReset → 204 | Body: password → message | ✅ |
| GET/POST/PUT/DELETE | `/admin/roles`、`/admin/roles/:role_id` | 同 | 同 | ✅ |
| GET | `/admin/organizations` | query skip?, limit?, is_active? | - | ⚠️ api 未支持分页/筛选 |
| GET | `/admin/organizations/:org_id` | path org_id | 同 | ✅ |
| PATCH | `/admin/organizations/:org_id/active` | Body: AdminOrganizationSetActive | Body: active? | ✅ |
| GET | `/admin/registered-users` | query skip?, limit?, is_active?, search? | - | ⚠️ api 未支持分页/筛选/搜索 |
| GET | `/admin/registered-users/count` | query is_active?, search? | - | ✅ |
| GET | `/admin/registered-users/:user_id` | path user_id | 同 | ✅ |
| PATCH | `/admin/registered-users/:user_id/active` | Body: AdminRegisteredUserSetActive | Body: active? | ✅ |
| GET/POST/PUT/DELETE | `/admin/plans`、`/admin/plans/:plan_id` | 同 | 同（含 query active_only?） | ✅ |
| GET | `/admin/subscriptions` | query skip?, limit?, organization_id?, status_filter? | - | ⚠️ api 未支持筛选 |
| GET | `/admin/subscriptions/:subscription_id` | 同 | 同 | ✅ |
| POST | `/admin/subscriptions/:subscription_id/renew` | Body: AdminSubscriptionRenew? | - 或 body | ✅ |
| POST | `/admin/subscriptions/:subscription_id/cancel` | - | - | ✅ |
| GET | `/admin/stats` | - → AdminPlatformStatsResponse | - → { organizations, users } | ✅ |

---

## 15. Webhooks `/api/v1/webhooks/wechat-pay`

| 方法 | 路径 | legacy | api | 一致性 |
|------|------|--------|-----|--------|
| POST | `/` | 微信回调 body + 签名头 → JSONResponse | 同上 → 200 { code: 'SUCCESS'\|'FAIL', message } | ✅ 行为一致 |

---

## 总结：一致性与差异

### 路径与功能基本一致

- 认证、组织、公寓/房间、租客、租约、水电、账单、报表、权限、订阅（业务侧）、通知、自定义角色、admin、webhook 的**路径与主要能力**在两边均存在且对齐。
- 组织上下文：legacy 用 query `org_id`，api 用 JWT/上下文，**功能等价**。
- 路径占位符命名：legacy `{org_id}` / api `:orgId` 或 `:org_id` 混用，**语义一致**。

### 主要差异（建议补齐或文档化）

1. **查询/过滤参数**
   - **Leases**：legacy `GET /leases?active_only=true`；api 未实现。
   - **Utilities**：legacy `GET /utilities?room_id=&period_year=&period_month=`；api 未实现；**export** legacy 有 period/days_range，api 无。
   - **Bills**：legacy `GET /bills?lease_id=&year=&month=&status=`；api 未实现。
   - **Reports**：legacy `/reports/income` 有 year, start_month, end_month；`/reports/occupancy` 有 year；api 均无；且 api `/reports/income` 的 by_month 未按月份聚合。
   - **Notifications**：legacy 支持 unread_only, limit, offset；api 固定最多 50 条。
   - **Custom-roles**：legacy `GET /orgs/:org_id/roles?active_only=`；api 未实现 active_only。
   - **Admin**：legacy 多处分页/筛选（users, organizations, registered-users, subscriptions）；api 多数未实现。

2. **响应体与字段**
   - 响应包装：api 统一 `{ code: 0, data, message }`，legacy 多为裸资源；**业务数据**一致即可。
   - 部分 DTO 字段名或嵌套结构需按前端/契约逐项对照（本文未逐字段列出）。

3. **仅 api 存在的路径**
   - `GET /api/v1/reports` 返回 `[]`，可视为占位或兼容用。

4. **仅 legacy 存在的路径**
   - `POST/PUT/DELETE /api/v1/subscriptions/admin/plans`：api 仅提供 `/api/v1/admin/plans`，管理功能已覆盖。

若需与前端或第三方严格契约一致，建议在 api 中逐步补齐上述**查询/过滤参数**，并在报表 income/occupancy 中支持时间范围与按月份聚合。
