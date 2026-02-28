# Apartment Ultra 商业化功能实现计划

> 创建日期: 2026-02-28
> 最后更新: 2026-02-28
> 状态: ✅ P3 阶段完成

## 📊 进度概览

**总进度: 4/4 阶段完成 (P0～P3 全部完成)**

| 阶段 | 状态 | 预计周期 | 描述 |
|-----|------|---------|------|
| P0 核心商用 | ✅ 100% | 3-4周 | 公用费用✅、免费限制✅、订阅基础✅、账单自动生成✅ |
| P1 体验提升 | ✅ 100% | 2-3周 | 个人团队✅、团队删除✅、事务提醒✅、自定义角色✅ |
| P2 运营系统 | ✅ 100% | 3-4周 | 运营后台✅、账号管理✅、组织管理✅、订阅管理✅、运营分析✅ |
| P3 支付集成 | ✅ 100% | 2周 | 微信支付 Native✅、订阅订单✅、支付页与结果页✅、购买/续费/升级流程✅ |

---

## 目标

实现公寓管理系统的商业化功能，使其能够：
1. 支持免费用户和付费会员的差异化限制
2. 支持订阅套餐管理和付费
3. 提供独立的运营管理后台
4. 完善用户体验和事务提醒

---

## P0 - 核心商用必需 ✅ 已完成

### 1. 公用费用配置 ✅ 已完成

**目标：** 支持公寓维度配置水电单价、网费、管理费、服务费

#### 已完成工作

- [x] **后端模型** - `UtilityConfig` 模型已创建
- [x] **后端 Schema** - 请求/响应 Schema 已创建
- [x] **后端 Repository** - 数据访问层已创建
- [x] **后端 Service** - 业务逻辑层已创建
- [x] **后端 API** - CRUD 接口已添加到 `/apartments/{id}/utility-config`
- [x] **数据库迁移** - 迁移脚本已创建
- [x] **前端 API** - API 客户端已添加
- [x] **前端组件** - `UtilityConfigDialog` 组件已创建
- [x] **前端集成** - 已集成到公寓详情页

### 2. 免费用户限制 ✅ 已完成

**目标：** 限制免费用户的公寓和房间数量

#### 已完成工作

- [x] **限制服务** - `PlanLimitService` 已创建，包含限制配置和检查逻辑
- [x] **API 端点** - `/organizations/{id}/usage` 获取使用情况和限制
- [x] **创建公寓限制** - 添加公寓数量限制检查
- [x] **创建房间限制** - 添加房间数量限制检查（包括批量创建）
- [x] **前端类型** - `OrganizationUsage` 类型已添加
- [x] **前端 API** - `getUsage` API 已添加

### 3. 订阅套餐基础 ✅ 已完成

**目标：** 支持订阅套餐管理和组织订阅关系

#### 已完成工作

- [x] **后端模型** - `SubscriptionPlan` 和 `OrganizationSubscription` 已创建
- [x] **后端 Schema** - 请求/响应 Schema 已创建
- [x] **后端 Repository** - 数据访问层已创建
- [x] **后端 Service** - 订阅业务逻辑已创建
- [x] **后端 API** - 套餐查询、订阅管理接口已添加
- [x] **数据库迁移** - 创建表迁移已完成
- [x] **种子数据** - 默认套餐已初始化（免费版/专业版/企业版）
- [x] **前端 API** - API 客户端已添加
- [x] **前端页面** - 订阅管理页面已创建 `/settings/subscription`

### 4. 账单自动生成（定时任务） ✅ 已完成

**目标：** 定时自动扫描出账日生成账单

#### 已完成工作

- [x] **后端依赖** - APScheduler 依赖已添加
- [x] **后端 Scheduler** - 定时任务调度器已创建 `app/scheduler/`
- [x] **账单生成任务** - 每月1号00:05自动生成上月账单
- [x] **集成到应用** - 调度器在应用启动时自动启动
- [x] **手动触发接口** - `generate_bills_for_organization()` 函数可手动触发

#### 调度器实现

```
api/app/scheduler/
├── __init__.py           # 调度器配置和管理
└── jobs/
    ├── __init__.py
    ├── bill_generation.py   # 账单生成任务
    └── notification_checks.py # 通知检查任务
```

#### 功能说明

- **定时任务**: 每月1号00:05自动运行
- **生成逻辑**: 为上个月的所有活跃租约生成账单
- **账单计算**:
  - 租金: 使用租约的月租金
  - 水费: 水表读数 × 水费单价（优先租约单价，其次公寓配置）
  - 电费: 电表读数 × 电费单价（优先租约单价，其次公寓配置）
  - 附加费: 网费、管理费、服务费（来自公寓公用费用配置）

---

## P1 - 商用体验提升 ✅ 已完成

### 5. 个人团队机制 ✅ 已完成

**目标：** 用户注册时自动创建个人团队，支持迁移到正式团队

#### 业务规则

- 用户注册时自动创建"个人团队"
- 个人团队不可邀请成员
- 个人团队可迁移到正式团队（数据合并）
- 用户可创建多个正式团队

#### 已完成工作

- [x] **后端模型修改** - Organization 添加 is_personal 字段
- [x] **后端 Service** - 注册时创建个人团队 (`AuthService.register`)
- [x] **后端 Service** - 团队迁移逻辑 (`OrganizationService.migrate_personal_team`)
- [x] **后端 API** - 迁移接口 `POST /organizations/personal/migrate`
- [x] **后端 API** - 获取个人团队 `GET /organizations/personal`
- [x] **后端限制** - 个人团队禁止邀请成员（`add_member` 抛出异常）
- [x] **数据库迁移** - `add_is_personal_to_organization`
- [x] **前端类型** - `Organization.is_personal` 已添加
- [x] **前端 API** - `getPersonalTeam`, `migratePersonalTeam` 已添加

---

### 6. 团队删除功能 ✅ 已完成

**目标：** 高危操作需要严格确认

#### 业务规则

- 团队必须无活跃订阅才能删除
- 需要二次确认（输入团队名称）
- 删除前显示将要删除的数据统计
- 硬删除（级联删除关联数据）

#### 已完成工作

- [x] **后端 Service** - 删除前检查逻辑 (`get_deletion_preview`)
- [x] **后端 Service** - 名称确认删除 (`confirm_and_delete`)
- [x] **后端 API** - 删除预览接口 `GET /organizations/{id}/deletion-preview`
- [x] **后端 API** - 确认删除接口 `DELETE /organizations/{id}` (需提供 confirmed_name)
- [x] **前端类型** - `DeletionPreview` 已添加
- [x] **前端 API** - `getDeletionPreview`, `delete` 已更新

---

### 7. 事务提醒系统 ✅ 已完成

**目标：** 租约到期、账单逾期等提醒

#### 已完成工作

- [x] **后端模型** - `Notification` 模型已创建 (`app/models/notification.py`)
- [x] **后端枚举** - `NotificationType` 定义通知类型
- [x] **后端 Repository** - `NotificationRepository` 数据访问层
- [x] **后端 Service** - `NotificationService` 通知创建和查询
- [x] **后端定时任务** - 租约到期检查（每日 08:00）
- [x] **后端定时任务** - 账单逾期检查（每日 08:05）
- [x] **后端 API** - 通知列表 `GET /notifications`
- [x] **后端 API** - 未读数量 `GET /notifications/unread-count`
- [x] **后端 API** - 标记已读 `POST /notifications/{id}/read`
- [x] **后端 API** - 全部已读 `POST /notifications/mark-all-read`
- [x] **数据库迁移** - `add_notifications_table`
- [x] **前端类型** - `Notification` 类型已添加

#### 通知类型

| 类型 | 触发条件 | 说明 |
|------|---------|------|
| `lease_expiring` | 租约到期前7/3/1天 | 租约即将到期 |
| `bill_overdue` | 账单超过截止日期 | 账单逾期提醒 |
| `payment_received` | 收到付款 | 付款到账通知 |

---

### 8. 自定义角色管理 ✅ 已完成

**目标：** 支持团队内自定义角色和权限

#### 已完成工作

- [x] **后端模型** - `CustomRole` 模型已创建 (`app/models/custom_role.py`)
- [x] **后端模型** - `OrganizationMember` 添加 `custom_role_id` 字段
- [x] **后端 Repository** - `CustomRoleRepository` 数据访问层
- [x] **后端 Service** - `CustomRoleService` 角色管理逻辑
- [x] **后端预置角色** - 管理员、财务、运营默认角色
- [x] **后端 API** - 角色列表 `GET /orgs/{org_id}/roles`
- [x] **后端 API** - 创建角色 `POST /orgs/{org_id}/roles`
- [x] **后端 API** - 更新角色 `PUT /orgs/{org_id}/roles/{id}`
- [x] **后端 API** - 删除角色 `DELETE /orgs/{org_id}/roles/{id}`
- [x] **后端 API** - 初始化默认角色 `POST /orgs/{org_id}/roles/init`
- [x] **数据库迁移** - `add_custom_roles`
- [x] **前端类型** - `CustomRole` 类型已添加

#### 角色权限配置

预置角色默认权限：

| 角色 | 权限范围 |
|------|---------|
| 管理员 | 公寓、房间、租客、租约、账单、水电、报表（全部操作） |
| 财务 | 账单管理、报表查看导出、其他模块只读 |
| 运营 | 公寓、房间、租客、租约、水电管理，报表查看导出 |

---

## P2 - 运营系统 ✅ 已完成

### 9. 运营后台架构 ✅ 已完成

**目标：** 建立独立的运营管理系统

#### 架构方案

```
/api/v1/admin/                 # 运营后台 API 路由前缀
/web/admin/                    # 运营后台前端（同项目下 /admin 路由）
```

#### 已完成工作

- [x] **后端模型** - AdminUser, AdminRole（`app/models/admin_user.py`, `admin_role.py`）
- [x] **后端认证** - 运营账号 JWT（type=admin），`get_current_admin_user` 依赖
- [x] **后端 API** - 运营后台路由挂载于 `/api/v1/admin`
- [x] **数据库迁移** - `add_admin_system`（admin_roles, admin_users 表）
- [x] **种子数据** - 启动时 `seed_admin_super()` 创建超级管理员角色与 admin 账号
- [x] **前端** - `/admin` 布局、`/admin/login` 登录页、`/admin` 仪表盘

---

### 10. 运营人员管理 ✅ 已完成

**目标：** 管理运营账号和角色

#### 已完成工作

- [x] **后端 API** - 运营账号 CRUD（`GET/POST/PUT/DELETE /admin/users`）、`GET /admin/users/me`、`POST /admin/users/{id}/reset-password`
- [x] **后端 API** - 运营角色 CRUD（`GET/POST/PUT/DELETE /admin/roles`）
- [x] **前端页面** - 运营账号管理（`/admin/users`）、运营角色管理（`/admin/roles`）

---

### 11. 组织管理（运营侧） ✅ 已完成

**目标：** 运营人员可查看和管理组织

#### 已完成工作

- [x] **后端** - Organization 增加 `is_active` 字段，迁移 `add_organization_is_active`
- [x] **后端 API** - 组织列表 `GET /admin/organizations`（支持 is_active 筛选）
- [x] **后端 API** - 组织详情 `GET /admin/organizations/{id}`
- [x] **后端 API** - 组织启用/停用 `PATCH /admin/organizations/{id}/active`
- [x] **前端页面** - 组织列表（`/admin/organizations`）、组织详情（`/admin/organizations/[id]`）

---

### 12. 订阅管理（运营侧） ✅ 已完成

**目标：** 运营人员可配置套餐和管理订阅

#### 已完成工作

- [x] **后端 API** - 套餐 CRUD（`GET/POST/PUT/DELETE /admin/plans`）
- [x] **后端 API** - 订阅列表 `GET /admin/subscriptions`、详情 `GET /admin/subscriptions/{id}`
- [x] **后端 API** - 手动续期 `POST /admin/subscriptions/{id}/renew`、取消 `POST /admin/subscriptions/{id}/cancel`
- [x] **前端页面** - 套餐配置（`/admin/plans`）、订阅管理（`/admin/subscriptions`）

---

### 13. 运营分析 ✅ 已完成

**目标：** 平台级数据统计和分析

#### 已完成工作

- [x] **后端 Service** - `AdminStatsService.get_platform_stats()`（组织/用户/公寓/房间/活跃订阅数）
- [x] **后端 API** - `GET /admin/stats`
- [x] **前端页面** - 运营仪表盘 `/admin`（平台概览统计卡片）

---

## P3 - 支付集成 ✅ 已完成

### 14. 微信支付集成 ✅ 已完成

**目标：** 支持微信支付购买订阅

#### 已完成工作

- [x] **后端依赖** - wechatpayv3（`api/pyproject.toml`）
- [x] **后端配置** - `api/app/configs/settings.py` 微信支付相关环境变量（WECHAT_PAY_ENABLED、商户号、APIv3 密钥、回调 URL 等）
- [x] **后端模型** - `SubscriptionOrder`（`api/app/models/subscription.py`）、迁移 `add_subscription_orders`
- [x] **后端 Service** - `SubscriptionOrderService` 创建订单、微信 Native 下单、回调验签与履行订阅（`api/app/services/subscription_order_service.py`）
- [x] **后端 API** - 创建订单 `POST /subscriptions/organizations/{org_id}/orders`、查询订单 `GET .../orders/{order_id}`（`api/app/controllers/console/subscriptions.py`）
- [x] **后端 API** - 支付回调 `POST /api/v1/webhooks/wechat-pay`（`api/app/controllers/webhooks/wechat_pay.py`）
- [x] **前端页面** - 支付页 `/settings/subscription/pay?order_id=xxx`（二维码展示与轮询）
- [x] **前端页面** - 支付结果页 `/settings/subscription/result?status=success|fail`

---

### 15. 订阅支付流程 ✅ 已完成

**目标：** 完整的购买/续费/升级流程

#### 已完成工作

- [x] **后端 Service** - 购买：创建订单 → 回调开通订阅；续费：同订单逻辑，回调中延长 `end_date`；升级：回调中执行 `change_plan`
- [x] **前端** - 订阅管理页付费套餐「确认并去支付」→ 创建订单 → 跳转支付页；免费套餐仍直接调用 `subscribe`
- [x] **前端** - 支付页轮询订单状态，已支付跳转结果页；结果页展示成功/失败及返回订阅管理

---

## 风险与对策

| 风险 | 影响 | 对策 |
|-----|------|------|
| 支付集成复杂 | 高 | 优先完成核心功能，支付可后期接入 |
| 运营后台工作量大 | 中 | 分阶段实现，先实现基础管理功能 |
| 定时任务可靠性 | 中 | 使用成熟的调度框架，添加监控 |

---

## 更新日志

| 日期 | 变更内容 |
|-----|---------|
| 2026-02-28 | P3 支付集成：微信支付 Native、订阅订单模型与 API、支付回调、支付页与结果页、购买/续费/升级流程；订阅页付费走订单、免费直接订阅 |
| 2026-02-28 | P2 前端收尾：运营账号/角色/组织/套餐/订阅管理页面及运营后台侧栏导航 |
| 2026-02-28 | P2 阶段完成：运营后台架构、运营人员管理、组织管理、订阅管理、运营分析；前端 /admin 登录与仪表盘 |
| 2026-02-28 | P1 阶段完成：个人团队机制、团队删除功能、事务提醒系统、自定义角色管理 |
| 2026-02-28 | P0 阶段完成：公用费用配置、免费用户限制、订阅套餐基础、账单自动生成定时任务 |
| 2026-02-28 | 初始创建，规划四个阶段共15个功能模块 |
