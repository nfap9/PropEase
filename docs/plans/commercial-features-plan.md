# Apartment Ultra 商业化功能实现计划

> 创建日期: 2026-02-28
> 最后更新: 2026-02-28
> 状态: 🔄 进行中

## 📊 进度概览

**总进度: 0/4 阶段完成 (P0 进行中: ~75%)**

| 阶段 | 状态 | 预计周期 | 描述 |
|-----|------|---------|------|
| P0 核心商用 | 🔄 75% | 3-4周 | 公用费用✅、免费限制✅、订阅基础✅、账单自动生成⬜ |
| P1 体验提升 | ⬜ 0% | 2-3周 | 个人团队、团队删除、事务提醒、自定义角色 |
| P2 运营系统 | ⬜ 0% | 3-4周 | 运营后台、账号管理、组织管理、订阅管理 |
| P3 支付集成 | ⬜ 0% | 2周 | 微信支付、订阅支付流程 |

---

## 目标

实现公寓管理系统的商业化功能，使其能够：
1. 支持免费用户和付费会员的差异化限制
2. 支持订阅套餐管理和付费
3. 提供独立的运营管理后台
4. 完善用户体验和事务提醒

---

## P0 - 核心商用必需

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

### 4. 账单自动生成（定时任务） ⬜ 待开始

#### 待完成工作

- [ ] **后端依赖** - 添加 APScheduler 依赖
- [ ] **后端 Scheduler** - 定时任务配置
- [ ] **后端 Service** - 账单生成逻辑优化
- [ ] **后端 API** - 手动触发生成接口（管理员）
- [ ] **Docker** - 定时任务容器配置
```

#### 任务清单

- [ ] **后端模型** - 创建 `UtilityConfig` 模型
- [ ] **后端 Schema** - 创建请求/响应 Schema
- [ ] **后端 Repository** - 数据访问层
- [ ] **后端 Service** - 业务逻辑层
- [ ] **后端 API** - CRUD 接口
- [ ] **数据库迁移** - 创建迁移脚本
- [ ] **前端 API** - API 客户端
- [ ] **前端页面** - 公寓设置页面添加费用配置
- [ ] **集成** - 账单生成时使用公寓费用配置

#### API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/apartments/{id}/utility-config` | 获取费用配置 |
| POST | `/apartments/{id}/utility-config` | 创建费用配置 |
| PUT | `/apartments/{id}/utility-config` | 更新费用配置 |

---

### 2. 免费用户限制 📋

**目标：** 限制免费用户的公寓和房间数量

#### 数据模型修改

```python
# Organization 添加字段
class Organization:
    # ... 现有字段
    plan_type: str              # free/pro/enterprise
    max_apartments: int         # 最大公寓数
    max_rooms: int              # 最大房间数
    max_members: int            # 最大成员数
```

#### 配置项（可运营配置）

```python
# PlanLimits - 套餐限制配置
DEFAULT_LIMITS = {
    'free': {'apartments': 1, 'rooms': 100, 'members': 1},
    'pro': {'apartments': 5, 'rooms': 500, 'members': 5},
    'enterprise': {'apartments': -1, 'rooms': -1, 'members': -1}  # -1 表示无限制
}
```

#### 任务清单

- [ ] **后端模型修改** - Organization 添加限制字段
- [ ] **后端 Service** - 限制检查逻辑
- [ ] **后端 API** - 创建公寓/房间时校验
- [ ] **数据库迁移** - 添加字段迁移
- [ ] **前端提示** - 超出限制时引导升级
- [ ] **前端显示** - 设置页显示当前用量/限制

---

### 3. 订阅套餐基础 📋

**目标：** 支持订阅套餐管理和组织订阅关系

#### 数据模型

```python
# SubscriptionPlan - 订阅套餐
class SubscriptionPlan:
    id: ULID
    name: str                    # 套餐名称
    code: str                    # 套餐代码(free/pro/enterprise)
    price_monthly: Decimal       # 月费
    price_yearly: Decimal        # 年费
    max_apartments: int          # 最大公寓数
    max_rooms: int               # 最大房间数
    max_members: int             # 最大成员数
    features: JSON               # 其他特性配置
    is_active: bool
    sort_order: int              # 排序
    created_at: datetime

# OrganizationSubscription - 组织订阅
class OrganizationSubscription:
    id: ULID
    organization_id: FK          # 关联组织
    plan_id: FK                  # 关联套餐
    status: str                  # active/expired/cancelled
    billing_cycle: str           # monthly/yearly
    start_date: date
    end_date: date
    auto_renew: bool
    created_at: datetime
    updated_at: datetime
```

#### 任务清单

- [ ] **后端模型** - 创建 SubscriptionPlan 和 OrganizationSubscription
- [ ] **后端 Schema** - 请求/响应 Schema
- [ ] **后端 Repository** - 数据访问层
- [ ] **后端 Service** - 订阅业务逻辑
- [ ] **后端 API** - 套餐查询、订阅管理
- [ ] **数据库迁移** - 创建表迁移
- [ ] **种子数据** - 初始化默认套餐
- [ ] **前端 API** - API 客户端
- [ ] **前端页面** - 套餐选择页面
- [ ] **前端页面** - 订阅管理页面

#### API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/subscription-plans` | 套餐列表 |
| GET | `/subscription-plans/{id}` | 套餐详情 |
| GET | `/organizations/{id}/subscription` | 当前订阅 |
| POST | `/organizations/{id}/subscription` | 开通/升级订阅 |

---

### 4. 账单自动生成（定时任务） 📋

**目标：** 定时自动扫描出账日生成账单

#### 技术方案

使用 APScheduler 实现定时任务：

```python
# 定时任务
@scheduler.scheduled_job('cron', hour=0, minute=5)
def generate_monthly_bills():
    """每日凌晨检查并生成账单"""
    # 1. 查找所有今日出账日的活跃租约
    # 2. 检查是否已生成当月账单
    # 3. 生成账单
```

#### 任务清单

- [ ] **后端依赖** - 添加 APScheduler 依赖
- [ ] **后端 Scheduler** - 定时任务配置
- [ ] **后端 Service** - 账单生成逻辑优化
- [ ] **后端 API** - 手动触发生成接口（管理员）
- [ ] **Docker** - 定时任务容器配置

---

## P1 - 商用体验提升

### 5. 个人团队机制 📋

**目标：** 用户注册时自动创建个人团队，支持迁移到正式团队

#### 业务规则

- 用户注册时自动创建"个人团队"
- 个人团队不可邀请成员
- 个人团队可迁移到正式团队（数据合并）
- 用户可创建多个正式团队

#### 数据模型修改

```python
# Organization 添加字段
class Organization:
    # ... 现有字段
    is_personal: bool            # 是否为个人团队
```

#### 任务清单

- [ ] **后端模型修改** - Organization 添加 is_personal 字段
- [ ] **后端 Service** - 注册时创建个人团队
- [ ] **后端 Service** - 团队迁移逻辑
- [ ] **后端 API** - 迁移接口
- [ ] **数据库迁移** - 添加字段
- [ ] **前端注册** - 调整注册流程
- [ ] **前端迁移** - 迁移向导页面
- [ ] **前端限制** - 个人团队隐藏邀请功能

---

### 6. 团队删除功能 📋

**目标：** 高危操作需要严格确认

#### 业务规则

- 团队必须无活跃订阅才能删除
- 需要二次确认（输入团队名称）
- 删除前显示将要删除的数据统计
- 软删除或硬删除（可配置）

#### 任务清单

- [ ] **后端 Service** - 删除前检查逻辑
- [ ] **后端 API** - 删除接口完善
- [ ] **前端页面** - 删除确认对话框
- [ ] **前端显示** - 删除前数据统计

---

### 7. 事务提醒系统 📋

**目标：** 租约到期、账单逾期等提醒

#### 数据模型

```python
# Notification - 通知
class Notification:
    id: ULID
    user_id: FK
    organization_id: FK
    type: str                    # lease_expiry/bill_overdue/payment_due
    title: str
    content: str
    is_read: bool
    metadata: JSON               # 关联业务数据ID
    created_at: datetime
```

#### 通知类型

| 类型 | 触发条件 | 说明 |
|------|---------|------|
| lease_expiry | 租约到期前7/3/1天 | 租约即将到期 |
| bill_overdue | 账单超过截止日期 | 账单逾期提醒 |
| payment_received | 收到付款 | 付款到账通知 |

#### 任务清单

- [ ] **后端模型** - 创建 Notification 模型
- [ ] **后端 Repository** - 数据访问层
- [ ] **后端 Service** - 通知创建和查询
- [ ] **后端定时任务** - 检查并发送提醒
- [ ] **后端 API** - 通知 CRUD
- [ ] **数据库迁移** - 创建表
- [ ] **前端 API** - API 客户端
- [ ] **前端组件** - 通知铃铛组件
- [ ] **前端页面** - 通知列表页面
- [ ] **前端显示** - 未读数量角标

---

### 8. 自定义角色管理 📋

**目标：** 支持团队内自定义角色和权限

#### 数据模型

```python
# OrganizationRole - 组织角色
class OrganizationRole:
    id: ULID
    organization_id: FK
    name: str                    # 角色名称
    is_system: bool              # 是否系统预置
    permissions: JSON            # 权限配置
    created_at: datetime
```

#### 任务清单

- [ ] **后端模型** - 创建 OrganizationRole 模型
- [ ] **后端 Service** - 角色管理逻辑
- [ ] **后端 API** - 角色 CRUD
- [ ] **数据库迁移** - 创建表
- [ ] **前端页面** - 角色管理页面
- [ ] **前端组件** - 权限配置组件

---

## P2 - 运营系统

### 9. 运营后台架构 📋

**目标：** 建立独立的运营管理系统

#### 架构方案

```
/api/admin/                    # 运营后台 API 路由前缀
/web/admin/                    # 运营后台前端（可选独立项目）
```

#### 数据模型

```python
# AdminUser - 运营账号
class AdminUser:
    id: ULID
    username: str
    password_hash: str
    name: str
    email: str
    role_id: FK                  # 关联运营角色
    is_active: bool
    last_login_at: datetime
    created_at: datetime

# AdminRole - 运营角色
class AdminRole:
    id: ULID
    name: str
    permissions: JSON            # 权限列表
    is_system: bool              # 系统预置不可删除
    created_at: datetime
```

#### 任务清单

- [ ] **后端模型** - AdminUser, AdminRole
- [ ] **后端认证** - 运营账号认证系统
- [ ] **后端中间件** - 运营权限校验
- [ ] **后端 API** - 运营后台接口
- [ ] **数据库迁移** - 创建表
- [ ] **种子数据** - 初始化超级管理员
- [ ] **前端项目** - 运营后台前端（或独立路由）
- [ ] **前端登录** - 运营登录页面
- [ ] **前端布局** - 运营后台布局

---

### 10. 运营人员管理 📋

**目标：** 管理运营账号和角色

#### 任务清单

- [ ] **后端 API** - 运营账号 CRUD
- [ ] **后端 API** - 运营角色 CRUD
- [ ] **后端 API** - 密码重置
- [ ] **前端页面** - 运营账号管理
- [ ] **前端页面** - 运营角色管理

---

### 11. 组织管理（运营侧） 📋

**目标：** 运营人员可查看和管理组织

#### 任务清单

- [ ] **后端 API** - 组织列表（平台级）
- [ ] **后端 API** - 组织详情
- [ ] **后端 API** - 组织启用/停用
- [ ] **前端页面** - 组织列表
- [ ] **前端页面** - 组织详情

---

### 12. 订阅管理（运营侧） 📋

**目标：** 运营人员可配置套餐和管理订阅

#### 任务清单

- [ ] **后端 API** - 套餐管理 CRUD
- [ ] **后端 API** - 订阅管理
- [ ] **后端 API** - 手动续费/取消
- [ ] **前端页面** - 套餐配置
- [ ] **前端页面** - 订阅管理

---

### 13. 运营分析 📋

**目标：** 平台级数据统计和分析

#### 任务清单

- [ ] **后端 Service** - 平台级统计
- [ ] **后端 API** - 统计接口
- [ ] **前端页面** - 运营仪表盘

---

## P3 - 支付集成

### 14. 微信支付集成 📋

**目标：** 支持微信支付购买订阅

#### 任务清单

- [ ] **后端依赖** - 微信支付 SDK
- [ ] **后端模型** - 支付订单模型
- [ ] **后端 Service** - 支付逻辑
- [ ] **后端 API** - 支付接口
- [ ] **后端 API** - 支付回调
- [ ] **前端页面** - 支付页面
- [ ] **前端页面** - 支付结果

---

### 15. 订阅支付流程 📋

**目标：** 完整的购买/续费/升级流程

#### 任务清单

- [ ] **后端 Service** - 购买流程
- [ ] **后端 Service** - 续费流程
- [ ] **后端 Service** - 升级流程
- [ ] **前端页面** - 购买确认
- [ ] **前端页面** - 订阅状态

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
| 2026-02-28 | 初始创建，规划四个阶段共15个功能模块 |
