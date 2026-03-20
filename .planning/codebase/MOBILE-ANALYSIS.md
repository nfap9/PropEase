# 移动端分析报告

**分析日期:** 2026-03-20

---

## 1. 当前已实现的功能模块

### 路由页面 (`mobile/app/`)

| 路由 | 页面 | 功能 | 状态 |
|------|------|------|------|
| `(tabs)/index` | 首页/仪表盘 | 概览统计、快捷功能入口、今日待办、最近动态 | 完整 |
| `(tabs)/properties` | 房源管理 | 公寓列表、房间统计、入住率进度条 | 完整 |
| `(tabs)/customers` | 客户管理 | 租客列表、搜索、在租/即将到期筛选 | 完整 |
| `(tabs)/bills` | 账单管理 | 账单列表、状态筛选、快捷收款确认 | 完整 |
| `(tabs)/utilities` | 智能抄表 | 水电读数录入、房间队列切换、租客电话拨打 | 完整 |
| `(tabs)/profile` | 个人中心 | 用户信息、菜单导航、退出登录 | 完整 |
| `login` | 登录/注册 | 手机号+密码登录/注册、表单验证 | 完整 |
| `settings/fee-configs` | 费用配置 | 水电单价/网费/管理费等本地配置 | **本地状态，未对接API** |
| `settings/notifications` | 消息通知 | 通知列表、分类筛选 | **使用Mock数据** |
| `settings/reports` | 经营报表 | 收支趋势、统计卡片 | **图表数据Mock** |
| `properties/[id]` | 公寓详情 | 房间列表导航 | 跳转已配置 |
| `rooms/[id]` | 房间详情 | 房间信息、租客电话拨打 | 跳转已配置 |
| `customers/leases/[id]` | 租约详情 | 租约信息 | 跳转已配置 |

### 核心业务流程覆盖

**MVP已覆盖的现场操作链路**（来自`mobile/AGENTS.md`）:
- 水电抄表录入与按房间队列切换
- 房间详情快速查看与租客电话拨打
- 账单列表中的快捷收款确认

---

## 2. 技术栈与依赖健康度

### 核心技术栈

| 类别 | 技术 | 版本 | 备注 |
|------|------|------|------|
| 框架 | Expo | 55.0.5 | 稳定版 |
| 路由 | expo-router | 55.0.4 | 文件路由 |
| 原生 | React Native | 0.83.2 | 较新 |
| UI | tamagui | 2.0.0-rc.23 | RC版本，有更新风险 |
| 状态 | zustand | 5.0.11 | 轻量状态管理 |
| 请求 | @tanstack/react-query | catalog | 共享版本 |
| 表单 | react-hook-form + zod | catalog | 完整验证方案 |
| 存储 | expo-secure-store | 55.0.8 | 跨平台安全存储 |
| 动画 | react-native-reanimated | 4.2.1 | Worklets支持 |
| 样式 | React Native core + Tamagui shorthands | - | **混用，实际以RN为主** |

### 依赖风险

**Tamagui RC版本风险:**
- `tamagui` 2.0.0-rc.23 为预发布版本
- `tamagui/config` 2.0.0-rc.23 配套
- `tamagui/font-inter` 2.0.0-rc.23
- RC版本可能有breaking change或bug

**实际使用情况:**
- `tamagui.config.ts` 已配置但**大部分页面未使用Tamagui组件**
- 页面主要使用 `View`, `Text`, `TextInput`, `TouchableOpacity` 等 RN 原生组件
- 仅有 `Theme`, `TamaguiProvider` 在 `_layout.tsx` 中使用

### 关键配置

**TypeScript:** `tsconfig.json` 开启 `strict: true`，但代码中存在 `any` 类型

**路径别名:** `@/*` 映射到 `./*`

---

## 3. 代码组织与架构质量

### 目录结构

```
mobile/
├── app/                    # Expo Router 页面（文件路由）
│   ├── (tabs)/            # Tab 导航组
│   │   ├── index.tsx      # 首页仪表盘
│   │   ├── properties.tsx  # 房源管理
│   │   ├── customers.tsx   # 客户管理
│   │   ├── bills.tsx      # 账单管理
│   │   ├── utilities.tsx   # 智能抄表
│   │   ├── profile.tsx     # 个人中心
│   │   └── _layout.tsx     # Tab布局
│   ├── login/             # 登录模块
│   ├── settings/          # 设置模块（堆栈）
│   ├── properties/[id]/   # 公寓详情
│   ├── rooms/[id]/        # 房间详情
│   └── _layout.tsx        # 根布局（Provider堆叠）
├── components/            # 组件
│   └── layout/            # 布局组件
│       └── auth-guard.tsx # 认证守卫
├── services/api/          # API 服务层
│   ├── client.ts          # 统一请求封装、ApiError、secureStorage
│   ├── auth.ts           # 认证API
│   ├── apartments.ts     # 公寓API
│   ├── rooms.ts          # 房间API
│   ├── tenants.ts         # 租客API
│   ├── leases.ts          # 租约API
│   ├── bills.ts           # 账单API
│   ├── utilities.ts       # 水电读数API
│   ├── reports.ts         # 报表API
│   └── organizations.ts    # 组织API
├── stores/               # Zustand 状态
│   └── auth.ts           # 认证状态
├── hooks/                # 自定义 Hooks
│   └── use-auth.ts      # 认证 Hook
├── constants/            # 常量
│   ├── Colors.ts        # 颜色主题
│   ├── theme.ts         # 主题配置
│   └── permissions.ts   # 权限配置
└── tamagui.config.ts    # Tamagui 配置
```

### 架构模式

**分层清晰:**
- `app/` - 页面层（路由 + UI）
- `services/api/` - 数据层（API封装）
- `stores/` - 状态层（Zustand）
- `hooks/` - 组合层（业务逻辑复用）
- `components/` - 展示层（可复用UI组件）

**Provider 堆叠顺序:**
```
QueryClientProvider
  └── TamaguiProvider
        └── Theme
          └── ThemeProvider (React Navigation)
            └── AuthGuard
              └── Stack (Expo Router)
```

### 代码质量问题

**1. 内联样式过度使用**
- 大部分页面使用 `style={{ ... }}` 内联样式
- Tamagui 配置已存在但未被充分利用
- 样式分散难以维护和复用

**2. 类型安全漏洞**
```typescript
// mobile/app/(tabs)/customers.tsx:9
type TenantData = any  // 使用 any 放弃类型检查

// mobile/app/settings/reports.tsx:13
type OverviewData = any  // 同上
```

**3. 路由类型不安全**
```typescript
// 多处使用 as any 跳转到动态路由
router.push('/bills/${bill.id}' as any)
router.push('/customers/${tenant.id}' as any)
router.push('/properties' as any)
```

**4. API Client Token 处理问题**
```typescript
// mobile/services/api/client.ts:208-224
// 401时刷新token后重试，但使用了闭包中的旧headers
// 刷新后的token获取时机存在竞态
if (response.status === 401 && !skipAuth) {
  const refreshed = await handleUnauthorized()
  if (refreshed) {
    // requestHeaders 在闭包中是旧值
    const newToken = await getToken()
    if (newToken) {
      requestHeaders['Authorization'] = `Bearer ${newToken}`
    }
    response = await fetch(`${API_URL}${url}`, { ...fetchOptions, headers: requestHeaders })
  }
}
```

---

## 4. 与后端 api-contract 的对接情况

### API Contract 使用

**已集成的类型:**
- `User`, `Organization`, `OrganizationMember`
- `Apartment`, `ApartmentWithStats`, `Room`
- `Tenant`, `TenantCreate`, `TenantUpdate`
- `Lease`, `LeaseCreate`, `LeaseListParams`
- `Bill`, `BillWithDetails`, `BillListParams`, `Payment`, `PaymentCreate`
- `UtilityReading`, `UtilityWithDetails`, `UtilityExportRoom`
- `DashboardOverview`, `IncomeReport`, `OccupancyReport`
- `SuccessBody`, `ErrorResponseBody`, `FieldError`, `BusinessCode`

### 对接覆盖情况

| 服务模块 | API端点 | 类型导入 | 状态 |
|----------|---------|----------|------|
| auth | /auth/login, /auth/register, /auth/me | 完整 | 完整 |
| organizations | /organizations/* | 完整 | 完整 |
| apartments | /apartments/*, /apartments/{id}/rooms/* | 完整 | 完整 |
| rooms | /apartments/rooms/{id} | 完整 | 完整 |
| tenants | /tenants/* | 完整 | 完整 |
| leases | /leases/* | 完整 | 完整 |
| bills | /bills/*, /bills/{id}/payments | 完整 | 完整 |
| utilities | /utilities/*, /utilities/export | 完整 | 完整 |
| reports | /reports/overview, /reports/income | 完整 | 完整 |

### 未对接功能

1. **消息通知** (`settings/notifications.tsx:115`) - TODO注释明确标注
2. **费用配置** (`settings/fee-configs.tsx`) - 完全本地状态，无API调用
3. **报表详细数据** - 图表使用硬编码Mock数据

### API 客户端质量

`mobile/services/api/client.ts` 实现了:
- 统一请求封装 `request()`
- 自动附加 `Authorization` 和 `x-org-id` 头
- Token 刷新机制（存在竞态问题，见上）
- `ApiError` 类，支持字段级错误
- 跨平台安全存储（Web: localStorage, Native: expo-secure-store）

---

## 5. 主要问题与风险

### 高优先级

**1. UI实现与架构设计不匹配**
- `tamagui` 配置完整但几乎未被使用
- 所有页面使用 RN 原生组件 + 内联样式
- Tamagui RC版本依赖引入更新风险但未带来收益

**2. 设置页面数据未持久化**
- `fee-configs.tsx` - 费用配置修改仅存在本地state，刷新即丢失
- `notifications.tsx` - 使用完全Mock数据
- `reports.tsx` - 图表数据硬编码

**3. Token刷新竞态条件**
- `client.ts:208-224` 在401时异步刷新token，但重试逻辑中headers存在闭包捕获的旧值
- 高并发请求下可能导致认证失败

### 中优先级

**4. TypeScript类型不严格**
- `customers.tsx:9` 和 `reports.tsx:13` 使用 `any` 类型
- 动态路由跳转大量使用 `as any`
- AGENTS.md声明"使用TypeScript严格模式，避免any"，实际未遵守

**5. 页面组件过于庞大**
- `utilities.tsx` - 1194行，单文件包含所有逻辑
- `bills.tsx` - 364行，包含BillCard组件
- `login/index.tsx` - 443行，登录注册混合
- 建议拆分子组件

**6. 第三方登录UI是占位符**
- `login/index.tsx:370-421` - 微信/Apple/Google登录按钮存在但无功能实现

### 低优先级

**7. 配置分散**
- 颜色定义在 `constants/Colors.ts`（仅tintColor）
- 实际使用的手写颜色如 `#2563EB`, `#9CA3AF` 等散落在各页面

**8. 文档与代码不一致**
- AGENTS.md说"当前MVP已覆盖"，但fee-configs/notifications/reports明显未完成
- 版本号在多处不一致（login显示"2026.03.10版本"，profile显示"v1.0.0"）

---

## 6. 潜在改进方向

### 架构层面

1. **统一UI组件库**
   - 要么充分利用Tamagui，要么移除Tamagui依赖降低复杂度
   - 建立共享组件：`BillCard`, `ApartmentCard`, `QueueCard`等已重复实现

2. **提取公共UI组件**
   - `StatItem`, `SummaryChip`, `ApartmentFilterPill` 等小组件可复用
   - 统一颜色/间距 token

3. **路由类型安全**
   - 使用 expo-router 的类型生成或 `as any` 替换为类型安全的路由

### 功能层面

4. **完成设置模块API对接**
   - 费用配置：调用后端API持久化
   - 消息通知：接入 `/notifications` API
   - 报表：使用真实API数据

5. **共享API Client**
   - Issue #35 跟踪：提取跨端API Client
   - 当前 `mobile/services/api/client.ts` 可作为参考

### 质量层面

6. **类型严格化**
   - 移除 `any` 类型使用
   - 启用 ESLint `no-explicit-any` 规则

7. **添加测试**
   - 至少覆盖 API client 的请求逻辑
   - E2E 测试（Issue #35 相关）

8. **代码拆分**
   - 将大型页面（utilities.tsx 1194行）拆分为子组件
   - 按业务逻辑分离：数据获取/状态管理/渲染

### 技术债务

9. **依赖更新**
   - 考虑升级 Tamagui 到稳定版
   - 监控 Expo 55 → 56 的迁移

10. **状态管理重构**
    - Zustand store 中混合了UI状态和业务逻辑
    - 考虑将 `isLoading` 等UI状态移至组件层

---

*分析完成*
