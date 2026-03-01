# api-ts 与 Python 接口对照

前缀均为 `/api/v1`。✓ 表示 api-ts 已实现，✗ 表示未实现。

## 1. 认证 `/auth`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| POST | /register | ✓ | ✓ |
| POST | /login | ✓ | ✓ |
| POST | /sms/send | ✓ | ✓ |
| POST | /refresh | ✓ | ✓ |
| GET | /me | ✓ | ✓ |

## 2. 组织 `/organizations`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | / | 列表 | ✓ |
| POST | / | 创建 | ✗ |
| GET | /:org_id | 详情 | ✓ |
| PUT | /:org_id | 更新 | ✗ |
| GET | /:org_id/deletion-preview | 删除预览 | ✗ |
| DELETE | /:org_id | 删除 | ✗ |
| GET | /:org_id/members | 成员列表 | ✗ |
| POST | /:org_id/members | 添加成员 | ✗ |
| PUT | /:org_id/members/:user_id | 更新成员角色 | ✗ |
| DELETE | /:org_id/members/:user_id | 移除成员 | ✗ |
| GET | /:org_id/usage | 用量统计 | ✗ |
| GET | /personal | 个人团队 | ✗ |
| POST | /personal/migrate | 迁移个人团队 | ✗ |

## 3. 公寓与房间 `/apartments`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | / | 列表(需 org_id) | ✓ |
| POST | / | 创建 | ✗ |
| GET | /:apartment_id | 详情 | ✓ |
| PUT | /:apartment_id | 更新 | ✗ |
| DELETE | /:apartment_id | 删除 | ✗ |
| GET | /:apartment_id/rooms | 房间列表 | ✗ |
| POST | /:apartment_id/rooms | 创建房间 | ✗ |
| POST | /:apartment_id/rooms/batch | 批量创建房间 | ✗ |
| GET | /rooms/:room_id | 房间详情 | ✗ |
| PUT | /rooms/:room_id | 更新房间 | ✗ |
| DELETE | /rooms/:room_id | 删除房间 | ✗ |
| GET | /:apartment_id/utility-config | 水电配置 | ✗ |
| POST | /:apartment_id/utility-config | 创建水电配置 | ✗ |
| PUT | /:apartment_id/utility-config | 更新水电配置 | ✗ |
| DELETE | /:apartment_id/utility-config | 删除水电配置 | ✗ |

## 4. 租客 `/tenants`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | / | 列表(需 org_id) | ✓ |
| POST | / | 创建 | ✗ |
| GET | /:tenant_id | 详情 | ✓ |
| PUT | /:tenant_id | 更新 | ✗ |
| DELETE | /:tenant_id | 删除 | ✗ |

## 5. 租约 `/leases`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | / | 列表(需 org_id) | ✓ |
| POST | / | 创建 | ✗ |
| GET | /:lease_id | 详情 | ✓ |
| PUT | /:lease_id | 更新 | ✗ |
| POST | /:lease_id/terminate | 终止 | ✗ |
| DELETE | /:lease_id | 删除 | ✗ |

## 6. 水电读数 `/utilities`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | / | 列表(需 org_id) | ✓ |
| POST | / | 创建 | ✗ |
| POST | /batch | 批量创建 | ✗ |
| GET | /export | 导出房间列表 | ✗ |
| GET | /:reading_id | 详情 | ✓ |
| PUT | /:reading_id | 更新 | ✗ |
| DELETE | /:reading_id | 删除 | ✗ |

## 7. 账单 `/bills`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | / | 列表(需 org_id) | ✓ |
| POST | /generate | 批量生成账单 | ✗ |
| POST | / | 创建 | ✗ |
| GET | /export/excel | 导出 Excel | ✗ |
| GET | /:bill_id | 详情 | ✓ |
| PUT | /:bill_id | 更新 | ✗ |
| DELETE | /:bill_id | 删除 | ✗ |
| POST | /:bill_id/payments | 登记收款 | ✗ |
| GET | /:bill_id/payments | 收款列表 | ✗ |
| GET | /:bill_id/pdf | 导出 PDF | ✗ |

## 8. 报表 `/reports`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | /overview | 概览 | ✓ |
| GET | /income | 收入 | ✓ |
| GET | /occupancy | 入住率 | ✓ |

## 9. 权限 `/permissions`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | / | 全部权限 | ✓ |
| GET | /grouped | 按组 | ✓ |
| GET | /organization/:org_id/roles/:role | 角色权限 | ✓ |
| PUT | /organization/:org_id/roles/:role | 更新角色权限 | ✓ |
| GET | /me | 当前用户权限 | ✓ |
| GET | /system-roles | 系统角色列表 | ✓ |
| POST | /system-roles/grant | 授予系统角色 | ✓（501） |
| POST | /system-roles/revoke | 撤销系统角色 | ✓（501） |
| GET | /system-roles/me | 我的系统角色 | ✓ |

## 10. 订阅 `/subscriptions`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | /plans | 套餐列表 | ✓ |
| GET | /plans/:plan_id | 套餐详情 | ✓ |
| GET | /organizations/:org_id/subscription | 组织订阅 | ✓ |
| GET | /organizations/:org_id/subscription/status | 订阅状态 | ✓ |
| POST | /organizations/:org_id/subscription | 开通/变更订阅 | ✓ |
| PUT | /organizations/:org_id/subscription | 变更套餐 | ✓ |
| POST | /organizations/:org_id/orders | 创建支付订单 | ✓ |
| GET | /organizations/:org_id/orders/:order_id | 订单详情 | ✓ |
| POST | /organizations/:org_id/subscription/cancel | 取消订阅 | ✓ |

## 11. 通知 `/notifications`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | / | 列表 | ✓ |
| GET | /unread-count | 未读数 | ✓ |
| POST | /:notification_id/read | 标已读 | ✓ |
| POST | /mark-all-read | 全部已读 | ✓ |

## 12. 自定义角色 `/custom-roles`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | /orgs/:org_id/roles | 角色列表 | ✓ |
| POST | /orgs/:org_id/roles | 创建角色 | ✓ |
| GET | /orgs/:org_id/roles/:role_id | 角色详情 | ✓ |
| PUT | /orgs/:org_id/roles/:role_id | 更新角色 | ✓ |
| DELETE | /orgs/:org_id/roles/:role_id | 删除角色 | ✓ |
| POST | /orgs/:org_id/roles/init | 初始化默认角色 | ✓ |

## 13. 运营后台 `/admin`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| POST | /auth/login | 登录 | ✓ |
| GET | /users | 用户列表 | ✓ |
| GET | /users/me | 当前管理员 | ✓ |
| GET | /users/:user_id | 用户详情 | ✓ |
| POST | /users | 创建管理员 | ✓ |
| PUT | /users/:user_id | 更新管理员 | ✓ |
| DELETE | /users/:user_id | 删除管理员 | ✓ |
| POST | /users/:user_id/reset-password | 重置密码 | ✓ |
| GET | /roles | 角色列表 | ✓ |
| GET | /roles/:role_id | 角色详情 | ✓ |
| POST | /roles | 创建角色 | ✓ |
| PUT | /roles/:role_id | 更新角色 | ✓ |
| DELETE | /roles/:role_id | 删除角色 | ✓ |
| GET | /organizations | 组织列表 | ✓ |
| GET | /organizations/:org_id | 组织详情 | ✓ |
| PATCH | /organizations/:org_id/active | 启用/停用组织 | ✓ |
| GET | /registered-users | 注册用户列表 | ✓ |
| GET | /registered-users/count | 注册用户总数 | ✓ |
| GET | /registered-users/:user_id | 注册用户详情 | ✓ |
| PATCH | /registered-users/:user_id/active | 启用/停用用户 | ✓ |
| GET | /plans | 套餐列表 | ✓ |
| GET | /plans/:plan_id | 套餐详情 | ✓ |
| POST | /plans | 创建套餐 | ✓ |
| PUT | /plans/:plan_id | 更新套餐 | ✓ |
| DELETE | /plans/:plan_id | 删除套餐 | ✓ |
| GET | /subscriptions | 订阅列表 | ✓ |
| GET | /subscriptions/:subscription_id | 订阅详情 | ✓ |
| POST | /subscriptions/:subscription_id/renew | 续期 | ✓ |
| POST | /subscriptions/:subscription_id/cancel | 取消 | ✓ |
| GET | /stats | 平台统计 | ✓ |

## 14. Webhooks `/webhooks/wechat-pay`

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| POST | / | 微信支付回调 | ✓（占位） |

## 15. 健康检查

| 方法 | 路径 | Python | api-ts |
|-----|------|--------|--------|
| GET | /health | ✓ | ✓ |

---

## 汇总

- **已实现**：对照表中除部分 501 占位（如 Excel/PDF 导出、system-roles grant/revoke）外，均已实现；Webhook 为占位、健康检查可用。
- **501 占位**：`/bills/export/excel`、`/bills/:id/pdf`、`/permissions/system-roles/grant`、`/permissions/system-roles/revoke`；账单生成 `POST /bills/generate` 返回“未实现”说明。
