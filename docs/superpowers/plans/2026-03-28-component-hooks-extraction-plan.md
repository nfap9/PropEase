# 组件 / Hooks 提取专项计划（Superpowers 重分析版）

日期：2026-03-28

## 分析方法

本版计划基于以下方式重新收敛：

- 使用 `using-superpowers` 重新校验“先判断技能、再行动”的工作流
- 结合 `vercel-react-best-practices`，避免把 React 组件提取成“复用看起来很多、实际增加复杂度”的抽象
- 以“共享价值 > 抽象成本 > 迁移风险”为准则重新排序候选项
- 把已经完成的提取纳入基线，避免重复规划

## 目标

围绕 `admin-web`、`tenant-web` 与 `packages/shared-ui`，开展一轮以“统一 UI 风格、降低重复实现、提升易用性”为核心的组件 / hooks 提取专项。

本计划聚焦 4 个目标：

1. 把跨端重复实现沉淀到 `@apartment-ultra/shared-ui`
2. 统一弹层、列表页、统计卡片、图表、权限与反馈体验
3. 补齐共享组件 / hooks 的注释、说明文档和迁移规范
4. 建立后续新增组件的准入标准，避免再次分叉

## 当前基线

### 已沉淀的共享组件

当前 `packages/shared-ui` 已具备以下基础：

- 通用 UI 原子组件：`Button`、`Card`、`Dialog`、`Sheet`、`Table`、`Select`、`AlertDialog` 等
- 业务通用组件：`AppDrawer`、`AppDialog`、`DataTable`、`StatCard`、`AppToaster/appToast`
- Phase 1 已启动的能力：`TableActions`、`PermissionGuard` 核心、`ThemeProvider`、`ThemeToggle`
- 图表组件：`ChartContainer`、`PieChart`、`LineChart`、`StatChart`
- 空态与基础视觉组件：`EmptyState`、`Skeleton`

### 已沉淀的共享 hooks

当前 `packages/shared-ui/src/hooks` 已具备：

- `useDisclosure`：控制开关类状态
- `useSelection`：控制当前选中项
- `useManagedItem`：控制“当前选中项 + 当前动作弹层”
- `useIsMobile` / `useMediaQuery`：响应式判断

### 已完成的初步收敛

- `DataTable` 已沉入共享层，`admin-web` / `tenant-web` 已改为直接转发导出
- `use-mobile` 已改为两端复用共享 hooks
- 全局消息容器已切到共享 `AppToaster`
- `TableActions` 已沉入共享层，两端保留兼容包装
- `PermissionGuard` 已改为“共享核心 + 应用侧轻适配”
- `ThemeProvider` / `ThemeToggle` 已改为共享实现，两端保留轻包装

### 当前仍明显重复的热点

从现有代码检索看，当前重复热点主要为：

- 业务层直接 `sonner` 引用约 35 处
- `DialogContent / AlertDialogContent / CommonDrawer` 业务壳约 35 处
- 页面壳模式约 28 处
- 统计卡 / 指标卡模式约 16 处

这几个维度仍然是专项的主战场。

## 现状分析

从当前代码分布来看，重复实现仍主要集中在下面 4 类：

### 1. 反馈与交互壳层重复度高

- `sonner` 直接引用约 35 处
- `DialogContent / AlertDialogContent / CommonDrawer` 直接业务拼装约 35 处

问题：

- 业务代码里仍然频繁直接拼装弹窗头部、底部、宽度和滚动区
- 成功 / 失败提示文案入口不统一，后续难统一行为与风格

### 2. 页面壳与列表页结构重复

- 页面级壳模式约 28 处
- 常见结构为：`Page Header + Toolbar/Filters + DataTable + Dialogs`

问题：

- 页面标题区、操作区、筛选区、内容区的间距与布局重复实现
- 同类页面在 admin 和 tenant 两端风格容易逐渐漂移

### 3. 统计展示组件仍存在多套实现

- 统计卡片模式约 16 处
- dashboard、账单页、租客端首页仍有不同版本的 KPI 卡

问题：

- 指标卡的标题层级、颜色语义、图标容器、趋势样式没有完全统一
- 图表卡片与统计卡片的组合关系还不稳定

### 4. 权限与动作控制仍有重复业务壳

- `TableActions` 两端完全重复
- `PermissionGuard` 两端完全重复
- 角色管理页左右分栏骨架在不同端实现相似但未抽象

问题：

- 重复维护成本高
- 很多组件只差文案和数据结构，却各自复制了一套布局壳

## Superpowers 判定原则

在继续提取前，所有候选项都要先过下面这 6 条。

### 1. 共享价值判定

满足任意两条，才进入候选清单：

- 至少在两个以上页面或两个端复现
- 结构相似度高于 70%
- 接入后业务代码明显更短或更清晰
- 能统一视觉或交互，不只是“把 JSX 搬家”

### 2. 不要抽取“伪复用”

以下情况不应急于抽：

- 只共享布局，不共享交互和语义
- 抽象后 props 数量暴涨，调用更难理解
- 组件内部开始承载业务请求、权限、接口映射
- 组件提取后反而让调用方需要写更多 `renderXxx`

### 3. React 提取边界

结合 `vercel-react-best-practices`，本专项明确限制：

- 不为了复用而增加不必要的 client component 体积
- 不把大量页面特定逻辑塞进共享 Provider
- 优先“轻包装 + 合理默认值”，避免过度配置化
- 避免在组件内部再定义重量级内联子组件
- hooks 优先抽“状态模式”，而不是抽“业务流程”

### 4. UI 一致性要求

进入共享层的组件必须：

- 继承现有蓝色主题、圆角卡片、轻阴影语言
- 与 `Card` / `Button` / `Dialog` / `Sheet` / `StatCard` / `ChartContainer` 共用样式语义
- 对 loading / empty / destructive / disabled 场景有一致表达

### 5. 易用性要求

共享组件必须满足：

- 默认值合理，开箱可用
- 参数命名统一
- 不要求调用方自行拼大量壳结构
- 有 `className` 扩展点，但不依赖样式覆盖才能正常使用

### 6. 文档要求

每次新增共享能力都必须附带：

- 中文 JSDoc
- 最小示例
- README 中的使用说明
- 明确“适用场景 / 不适用场景”

## 候选提取清单

下面按优先级分为 3 个梯队。

### 第一梯队：立即提取

这些项目提取成本低、复用收益高，建议优先推进。

#### 1. `TableActions`

现状：

- `admin-web/src/components/common/table-actions.tsx`
- `tenant-web/src/components/common/table-actions.tsx`

判断：

- 代码几乎一致
- 交互模式稳定
- 与共享层现有 `Button`、`DropdownMenu`、`Tooltip` 完全兼容

状态：

- 已完成第一版共享实现

后续动作：

- 把 README 示例补成“桌面 / 移动行为说明”
- 观察是否需要增加 `confirmBeforeClick` 这类能力；如无强需求，保持轻量

#### 2. `PermissionGuard`

现状：

- `admin-web/src/components/common/permission-guard.tsx`
- `tenant-web/src/components/common/permission-guard.tsx`

判断：

- 逻辑完全相同
- 适合作为共享组件 / HOC 基础能力

状态：

- 已完成第一版共享核心

后续动作：

- 不继续把 `usePermissions` 本身抽到共享层
- 保持“共享核心 + 应用适配”的边界，避免共享包依赖业务权限上下文

#### 3. `ThemeProvider` / `ThemeToggle`

现状：

- `ThemeProvider` 两端完全一致
- `ThemeToggle` 结构高度一致，仅文案来源不同

状态：

- 已完成第一版共享实现

后续动作：

- 保持 `ThemeToggle` 的轻量文案配置，不继续把国际化上下文抽进共享层

#### 4. Toast 调用入口迁移

现状：

- 35 处业务代码仍直接 `import { toast } from 'sonner'`

计划：

- 统一迁移为 `appToast`
- 逐步禁止业务层直接引用 `sonner`
- 在文档中补“提示文案与错误处理规范”

迁移策略：

- 第一轮只做新代码约束，不强行一次性改完 35 处
- 第二轮按业务域分批替换：users / plans / storefront / leases / bills / utilities
- 最终目标是业务代码不再直接 `import { toast } from 'sonner'`

收尾清单：

- 已完成 admin 用户与订阅域：`users`、`registered-users`、`subscriptions`、`roles`
- 已完成 admin 运营配置域：`service-pricing`、`brand`、`usage-pricing`、`organizations`
- 已完成 tenant 租客与组织域：`tenants`、`tenant detail`、`organizations`、`settings/team`
- 已完成 tenant 设置与订阅域：`settings/permissions`、`settings/notifications`、`settings/subscription/purchase`、`settings/subscription/pay`
- 已完成 tenant 资产与房源域：`apartments`、`rooms`、`apartment-detail`
- 已完成 tenant 通用表单域：`create-tenant-dialog`、`initial-reading-dialog`、`lease-form-dialog`

收尾结果：

- 业务代码已清空直接 `import { toast } from 'sonner'`
- 后续新增提示统一使用 `appToast`

### 第二梯队：高价值改造

这些项目值得做，但适合在第一梯队稳定后推进。

#### 5. 业务弹层壳组件

目标组件：

- `FormDialog`
- `ConfirmDialog`
- `DetailDrawer`
- `WizardDrawer`
- `WizardDialog`

现状信号：

- 大量 `DialogContent className="max-w-* ..."` 直接写在业务组件中
- 多处删除确认、禁用确认、详情抽屉、表单弹窗结构相似

Superpowers 判断：

- 这组是真复用，不是伪复用
- 共享的不只是布局，还有尺寸、滚动、确认区、危险操作语义

计划：

- 基于现有 `AppDialog` / `AppDrawer` 再抽一层面向业务的“场景壳”
- 统一 `header / body / footer / loading / testid / size`
- 先从最稳定的 3 类开始：
  - `ConfirmDialog`
  - `FormDialog`
  - `DetailDrawer`
- `WizardDrawer` / `WizardDialog` 已在三类稳定后补齐第一版共享实现

不做的事：

- 不把具体表单字段抽成共享层
- 不让共享弹层直接接管 mutation 或表单 schema

#### 6. 页面级壳组件

目标组件：

- `PageHeader`
- `PageSection`
- `ListPageLayout`
- `PageToolbar`

适用页面：

- 用户管理
- 计划管理
- 注册用户管理
- 租约管理
- 账单管理
- 组织管理 / 水电管理 / 房间管理等

Superpowers 判断：

- 页面壳要抽“结构稳定”的部分，不抽“页面专属流程”

计划：

- 先拆成小块：
  - `PageHeader`
  - `PageToolbar`
  - `PageSection`
- `ListPageLayout` 放在这三个块稳定后再组合

原因：

- 直接上一个大而全的 `ListPageLayout` 容易变成高 props 组件
- 先抽小块更符合组合优先原则

#### 7. 统计展示体系改造

目标组件：

- `StatGrid`
- `MetricCard`
- `KpiSection`
- 统一 `ChartCard` 到 `ChartContainer`

现状：

- `admin-web/src/components/dashboard/stat-card.tsx`
- `tenant-web/src/app/dashboard/dashboard-content.tsx`
- `tenant-web/src/features/bills/components/bills-list-view.tsx`

计划：

- 优先统一到共享 `StatCard`
- 再新增：
  - `StatGrid`
  - `KpiSection`
- `ChartCard` 逐步被 `ChartContainer` 取代

迁移优先级：

1. admin dashboard
2. tenant dashboard
3. bills 列表页统计区
4. settings / notifications 中的散落指标卡

### 第三梯队：抽象骨架与复用模式

这类工作更偏“结构复用”，不急于一轮做完，但要纳入路线图。

#### 8. 角色 / 权限配置骨架

目标组件：

- `SplitSettingsPanel`
- `SelectableSideList`
- `PermissionMatrix`

适用页面：

- 运营后台角色管理
- 团队角色 / 权限管理

判断：

- 这一组适合在 Phase 2 / 3 完成后再抽
- 当前虽然有结构相似性，但业务语义仍偏重

建议抽法：

- 先抽 `SplitSettingsPanel` 外壳
- 不急于把权限树实现抽成共享 `PermissionMatrix`

#### 9. 工作区空态 / 无权限页 / 无组织页

目标组件：

- `WorkspaceEmptyState`
- `NoPermissionState`
- `NoOrganizationState`

价值：

- 统一空工作区与受限状态体验
- 避免页面各自实现图标、标题和说明文案样式

#### 10. 列表页 hooks 组合模式

候选 hooks：

- `useListFilters`
- `useAsyncDialogSubmit`
- `usePageQueryState`
- `useActionMenu`
- `useConfirmAction`

适用场景：

- 列表筛选条件管理
- 弹窗提交成功后关闭与重置
- URL 状态同步
- 表格操作按钮组装

## 不建议立即提取的内容

以下内容暂不建议抽到共享层：

- 强业务语义的表单字段组合
- API 直接耦合的 hooks
- 文案和权限规则高度依赖单端业务上下文的组件
- 只有 1 处使用、且结构尚不稳定的页面块
- 为了减少 import 数量而制造的大而全组件
- 需要传入大量 render props 才能工作的“壳组件”

判断规则：

- 至少在两个以上业务位置复现
- 结构相似度高于 70%
- 抽出后能让业务代码更短、更清晰，而不是更绕

## 统一规范

后续所有新增共享组件 / hooks 必须遵循以下规范。

### UI 风格规范

- 统一使用当前蓝色主题、圆角卡片、轻阴影、柔和边框
- 标题、描述、按钮、图标尺寸要有明确层级，不允许同类组件各写一套
- 弹层、列表、卡片、图表优先复用共享设计 token 和已有容器组件

### API 设计规范

- 优先组合式 API，不把具体业务文案和流程写死
- 提供合理默认值，同时保留扩展点
- 参数命名统一，例如 `open`、`onOpenChange`、`title`、`description`、`footer`
- 支持 `className`，但不依赖使用方重写大量样式才能好看
- 控制 props 数量，超出 10 个参数的共享组件默认需要重新审视边界

### 文档与注释规范

每个共享组件 / hook 至少要包含：

- 中文 JSDoc，说明用途、适用场景、关键参数
- 一个最小可运行示例
- 对应 README 或专题文档中的使用说明
- 迁移说明：旧组件如何替换为新组件
- 如果组件有“不要这样用”的常见误用，也要写出来

### 验证规范

每次提取至少完成：

- `shared-ui` 类型检查
- 被迁移页面的类型检查
- 至少一条最关键交互路径的人工验证

非纯展示组件建议补充测试：

- hooks：单测
- 复杂组合组件：交互测试或最小渲染测试

## 分阶段实施计划

### Phase 1：基础收敛

范围：

- `TableActions`
- `PermissionGuard`
- `ThemeProvider`
- `ThemeToggle`
- `appToast` 迁移规范与分域替换

产出：

- 共享实现
- 使用说明
- 业务侧兼容层或转发导出

状态：

- 已完成前 4 项第一版实现
- 已完成 `appToast` 的分域迁移与约束落地

验收：

- 共享实现稳定
- 两端保留兼容包装
- 类型检查通过

### Phase 2：弹层标准化

范围：

- `ConfirmDialog`
- `FormDialog`
- `DetailDrawer`
- `WizardDrawer`
- `WizardDialog`

目标页面：

- 用户、计划、服务定价、租约、账单、房间、水电、租客相关弹层

推荐执行顺序：

1. `ConfirmDialog`
2. `FormDialog`
3. `DetailDrawer`
4. `WizardDrawer`

当前进度补充：

- 已完成 `WizardDrawer` / `WizardDialog` 第一版共享实现
- 已接入代表页面：
  - `tenant-web/src/features/leases/components/lease-signing-drawer.tsx`
  - `tenant-web/src/features/apartment-detail/components/apartment-detail-dialogs.tsx`

### Phase 3：页面壳与统计体系

范围：

- `PageHeader`
- `PageToolbar`
- `PageSection`
- `ListPageLayout`
- `StatGrid`
- `KpiSection`

目标：

- 统一管理页、列表页、概览页视觉结构

### Phase 4：配置型页面与高阶 hooks

范围：

- `SplitSettingsPanel`
- `SelectableSideList`
- `PermissionMatrix`（必要时）
- `useListFilters`
- `useAsyncDialogSubmit`
- `usePageQueryState`
- `useConfirmAction`

目标：

- 沉淀更高层的复用骨架
- 把复杂页面中的状态组织也标准化

当前进度：

- 已完成 `useListFilters` 与 `useConfirmAction` 第一版共享实现
- 已补齐 `packages/shared-ui/src/hooks/README.md` 中的适用场景与示例
- 已接入首批代表页面：
  - `tenant-web/src/features/leases/components/leases-page-content.tsx`
  - `tenant-web/src/app/apartments/page.tsx`
  - `tenant-web/src/app/tenants/page.tsx`
  - `admin-web/src/features/registered-users/components/registered-users-page-content.tsx`
- 已完成 `SplitSettingsPanel` 与 `SelectableSideList` 第一版共享实现
- 已接入代表页面：
  - `admin-web/src/app/roles/page.tsx`
  - `tenant-web/src/app/settings/permissions/page.tsx`
- 已完成 `usePageQueryState` 第一版共享实现
- 已接入代表页面：
  - `tenant-web/src/features/bills/components/bills-page-content.tsx`
  - `admin-web/src/app/subscriptions/page.tsx`
- 已完成 `useAsyncDialogSubmit` 第一版共享实现
- 已接入代表页面：
  - `tenant-web/src/features/bills/components/bills-page-content.tsx`
  - `tenant-web/src/app/settings/team/page.tsx`
  - `admin-web/src/app/subscriptions/page.tsx`
- Phase 4 已完成，`PermissionMatrix` 暂按“必要时再提取”保留观察

## 推荐执行顺序

建议按以下顺序推进：

1. 继续完成 `appToast` 迁移规范与首批业务域替换
2. `ConfirmDialog`
3. `FormDialog`
4. `DetailDrawer`
5. `PageHeader`
6. `PageToolbar`
7. `PageSection`
8. `StatGrid`
9. `KpiSection`
10. 配置型面板与高阶 hooks

当前实际完成情况：

- Phase 1 已完成
- Phase 2 已完成
- Phase 3 已完成
- Phase 4 已完成
- `PermissionMatrix` 暂按“必要时再提取”保留观察

## 建议的任务切片

为了降低回归风险，建议后续按下面的最小切片推进：

### Slice A：反馈统一

- 建立 `appToast` 使用约束
- 先替换 `admin-web` 的 users / plans / storefront
- 再替换 `tenant-web` 的 leases / bills / utilities

### Slice B：确认类弹层

- 删除确认
- 停用确认
- 终止确认

这是 Phase 2 中风险最低的一块，适合先验证弹层标准化模式。

### Slice C：表单类弹层

- create / edit 弹窗
- 简单详情弹窗

### Slice D：侧边详情 / 大表单抽屉

- 注册用户详情
- 计划编辑
- 服务定价详情
- 租约签约 / 搜索抽屉

### Slice E：列表页结构统一

- 用户管理
- 计划管理
- 注册用户管理

这 3 个页面最适合先验证 `PageHeader / PageToolbar / PageSection`。

## 交付要求

专项内每一个提取任务都应交付：

- 组件 / hook 源码
- 中文注释
- 使用说明
- 迁移后的业务页面示例
- 验证记录

推荐文档落点：

- 组件说明：`packages/shared-ui/README.md`
- hooks 说明：`packages/shared-ui/src/hooks/README.md`
- 专项计划与里程碑：`docs/superpowers/plans/`

## 成功标准

专项阶段性完成后，应达到：

- 业务端和运营端不再保留完全重复的通用组件实现
- 反馈、弹层、列表页、统计卡视觉语言统一
- 共享组件使用方式足够直观，业务层接入时不需要复制大段模板代码
- 新增共享能力都带有注释和示例，不依赖口口相传

## 下一步建议

本版重分析后的建议是：

1. 不再重复规划已经完成的基础收敛项
2. 直接把后续重点放到 `appToast` 迁移和弹层标准化
3. 页面壳组件先小后大，避免一开始做成大而全 `ListPageLayout`
4. hooks 只抽“状态模式”，不抽“业务流程”

最推荐的下一个动作：

- 建一个 `toast-migration` 子任务，先完成 1 个 admin 域 + 1 个 tenant 域
- 然后开始 `ConfirmDialog` 的共享设计与首批迁移
