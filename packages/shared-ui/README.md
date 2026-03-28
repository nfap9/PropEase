# Shared UI Components

`@apartment-ultra/shared-ui` 现在提供一组适合项目内复用的业务通用组件，统一基于当前项目的蓝色主题、圆角卡片、轻阴影和 Radix / TanStack / Recharts 生态。

## 设计原则

- 组合优先：组件只负责结构、样式和通用交互，不接管业务请求和数据来源。
- 合理默认值：开箱即可使用，同时保留 `className`、`children`、格式化函数等扩展点。
- 风格统一：弹层、卡片、表格、图表共用一套留白、圆角、阴影和主题色板。
- 易用性优先：表格内置分页与空态，抽屉支持固定头尾，对话框支持滚动内容区，图表内置统一 tooltip / legend。

## 组件清单

- `AppDrawer`：应用级抽屉，适合大表单、侧边详情、分步录入。
- `AppDialog`：应用级对话框，适合确认操作、轻表单、信息展示。
- `ConfirmDialog`：标准确认弹层，适合删除、停用、终止等高风险操作。
- `FormDialog`：标准表单弹窗，适合新增、编辑、配置类表单。
- `DataTable`：通用数据表格，内置排序、过滤、分页、加载态、空态。
- `DetailDrawer`：标准详情抽屉，适合侧边详情查看与轻量操作。
- `PageHeader` / `PageToolbar` / `PageSection`：页面壳小组件，适合管理页、列表页、概览页结构统一。
- `ListPageLayout`：列表页组合层，适合“标题区 + 工具条 + 内容区”的管理页面。
- `StatGrid` / `KpiSection`：统计区组合层，适合 dashboard、列表页顶部 KPI、设置页摘要统计。
- `SelectableSideList` / `SplitSettingsPanel`：配置型页面骨架，适合“左侧选择列表 + 右侧详情/编辑”的设置页。
- `StatCard`：统计卡片，支持货币、百分比、趋势展示。
- `AppToaster` / `appToast`：统一消息提示容器与调用入口。
- `TableActions`：统一表格行操作区，支持桌面端 inline + 菜单、移动端收叠菜单。
- `PermissionGuard`：共享权限守卫核心，可由业务端适配权限上下文后复用。
- `ThemeProvider` / `ThemeToggle`：统一主题切换能力与视觉风格。
- `PieChart`：饼图/环图，适合占比分析。
- `LineChart`：折线图，适合趋势分析。
- `StatChart`：柱状统计图，适合分类对比。

## 快速接入

### 1. 根布局挂载消息提示

```tsx
import { AppToaster } from '@apartment-ultra/shared-ui/components/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AppToaster />
    </>
  );
}
```

### 2. 抽屉

```tsx
import { AppDrawer, Button } from '@apartment-ultra/shared-ui/components/ui';

<AppDrawer
  open={open}
  onOpenChange={setOpen}
  title="新增租客"
  description="请填写租客的基础资料和联系方式。"
  footer={
    <>
      <Button variant="outline" onClick={() => setOpen(false)}>
        取消
      </Button>
      <Button onClick={handleSubmit}>保存</Button>
    </>
  }
>
  <TenantForm />
</AppDrawer>;
```

### 3. 对话框

```tsx
import { AppDialog, Button } from '@apartment-ultra/shared-ui/components/ui';

<AppDialog
  open={open}
  onOpenChange={setOpen}
  title="确认删除"
  description="删除后不可恢复，请再次确认。"
  footer={
    <>
      <Button variant="outline" onClick={() => setOpen(false)}>
        取消
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        删除
      </Button>
    </>
  }
>
  <p className="text-sm text-muted-foreground">该操作会同时移除关联记录。</p>
</AppDialog>;
```

### 4. 确认弹层

```tsx
import { ConfirmDialog } from '@apartment-ultra/shared-ui/components/ui';

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="确认删除"
  description="删除后不可恢复，请再次确认。"
  confirmLabel={isPending ? '删除中...' : '删除'}
  cancelLabel="取消"
  intent="destructive"
  isPending={isPending}
  onConfirm={handleDelete}
/>;
```

### 5. 表格

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@apartment-ultra/shared-ui/components/ui';

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: '姓名' },
  { accessorKey: 'phone', header: '手机号' },
  { accessorKey: 'status', header: '状态' },
];

<DataTable
  title="用户列表"
  description="支持排序、分页和空状态。"
  columns={columns}
  data={users}
  defaultPageSize={20}
  pageSizeOptions={[10, 20, 50]}
  isLoading={isLoading}
/>;
```

### 6. 表单弹窗

```tsx
import { FormDialog } from '@apartment-ultra/shared-ui/components/ui';

<FormDialog
  open={open}
  onOpenChange={setOpen}
  title="新增租客"
  description="填写租客基础信息。"
  formId="tenant-form"
  onSubmit={handleSubmit}
  submitLabel={isPending ? '保存中...' : '保存'}
  isPending={isPending}
>
  <TenantFields />
</FormDialog>;
```

适用场景：

- 标准“表单字段 + 取消/提交”弹窗
- 需要统一标题区、滚动区和底部按钮的新增 / 编辑场景

不适用场景：

- 需要复杂多步骤流程的向导弹层
- 底部操作完全自定义、没有标准提交语义的展示弹层

### 7. 详情抽屉

```tsx
import { DetailDrawer } from '@apartment-ultra/shared-ui/components/ui';

<DetailDrawer
  open={open}
  onOpenChange={setOpen}
  title="租客详情"
  description="查看基础信息和关联组织。"
  footer={<ActionButtons />}
>
  <TenantDetailContent />
</DetailDrawer>;
```

适用场景：

- 侧边查看详情
- 详情页底部带少量操作按钮

不适用场景：

- 需要完整表单提交流程的编辑抽屉
- 高度依赖业务布局、需要多级复杂分栏的自定义面板

### 8. 向导抽屉

```tsx
import { WizardDrawer } from '@apartment-ultra/shared-ui/components/ui';

const steps = [
  { id: 'room', title: '房间信息', description: '确认要签约的房间。' },
  { id: 'tenant', title: '租客信息', description: '填写或选择租客资料。' },
  { id: 'contract', title: '合同信息', description: '确认租期、租金与费用。' },
];

<WizardDrawer
  open={open}
  onOpenChange={setOpen}
  title="新增租约"
  description="按步骤完成签约信息录入。"
  steps={steps}
  currentStep={currentStep}
  onPrevious={() => setCurrentStep((step) => Math.max(step - 1, 0))}
  onNext={handleNext}
  onComplete={handleSubmit}
  completeLabel={isPending ? '提交中...' : '确认签约'}
  isPending={isPending}
>
  {currentStep === 0 ? <RoomStep /> : null}
  {currentStep === 1 ? <TenantStep /> : null}
  {currentStep === 2 ? <ContractStep /> : null}
</WizardDrawer>;
```

适用场景：

- 多步骤录入或配置抽屉
- 每一步职责清晰、顺序稳定的向导流程

不适用场景：

- 只有一个表单区的普通编辑抽屉
- 步骤数量和顺序高度动态、强依赖业务分支的复杂流程

### 9. 向导对话框

```tsx
import { WizardDialog } from '@apartment-ultra/shared-ui/components/ui';

const steps = [
  { id: 'config', title: '批量配置', description: '先设置批量生成规则。' },
  { id: 'confirm', title: '确认房间', description: '再确认要创建的房间。' },
];

<WizardDialog
  open={open}
  onOpenChange={setOpen}
  title="批量添加房间"
  description="在弹窗内完成两步配置。"
  steps={steps}
  currentStep={currentStep}
  onPrevious={() => setCurrentStep(0)}
  onNext={handleNext}
  onComplete={handleConfirm}
  completeLabel={isPending ? '创建中...' : '确认添加'}
  isPending={isPending}
>
  {currentStep === 0 ? <ConfigStep /> : null}
  {currentStep === 1 ? <ConfirmStep /> : null}
</WizardDialog>;
```

适用场景：

- 两到三步的轻量向导弹窗
- 需要在有限空间内完成配置和确认的流程

不适用场景：

- 内容明显更适合侧边大抽屉承载的长表单
- 单步就能完成的普通确认或编辑弹窗

### 10. 统计卡片

### 11. 页面壳

```tsx
import { PageHeader, PageSection, PageToolbar } from '@apartment-ultra/shared-ui/components/ui';

<PageSection className="mx-auto max-w-6xl">
  <PageHeader
    title="管理账号"
    description="统一管理后台账号与角色。"
    actions={
      <PageToolbar>
        <Button>新建账号</Button>
      </PageToolbar>
    }
  />

  <DataTable columns={columns} data={data} />
</PageSection>;
```

适用场景：

- 列表页顶部标题区
- 搜索、筛选、按钮组合工具条
- 页面主体内容分区

不适用场景：

- 强依赖复杂自定义网格的营销落地页
- 已经有明确独立设计语言的专题页面

### 12. 列表页组合层

```tsx
import { ListPageLayout, PageToolbar } from '@apartment-ultra/shared-ui/components/ui';

<ListPageLayout
  title="用户管理"
  actions={
    <PageToolbar>
      <Button>新建用户</Button>
    </PageToolbar>
  }
  toolbar={<Filters />}
>
  <DataTable columns={columns} data={data} />
</ListPageLayout>;
```

### 10. 统计区组合层

```tsx
import { KpiSection, StatCard } from '@apartment-ultra/shared-ui/components/ui';

<KpiSection title="核心指标" columns={4}>
  <StatCard title="总房间数" value={128} />
  <StatCard title="入住率" value={84.6} format="percent" tone="primary" />
  <StatCard title="本月收入" value={26800} format="currency" />
  <StatCard title="逾期账单" value={6} tone="danger" />
</KpiSection>;
```

### 11. 配置型分栏骨架

```tsx
import { SelectableSideList, SplitSettingsPanel } from '@apartment-ultra/shared-ui/components/ui';

<SplitSettingsPanel
  sidebar={
    <SelectableSideList
      title="角色列表"
      selectedId={selectedId}
      onSelect={(role) => setSelectedRole(role)}
      items={roles.map((role) => ({
        id: role.id,
        value: role,
        label: role.name,
      }))}
    />
  }
>
  <RoleDetailPanel />
</SplitSettingsPanel>;
```

适用场景：

- 权限管理、角色管理、配置中心
- 左侧负责切换上下文，右侧负责查看或编辑详情

不适用场景：

- 两侧都高度业务化且布局差异很大的专题页面
- 需要三栏或更多层级导航的复杂工作台

### 12. 统计卡片

```tsx
import { Building2 } from 'lucide-react';
import { StatCard } from '@apartment-ultra/shared-ui/components/ui';

<StatCard
  title="本月收租"
  value={26800}
  format="currency"
  precision={2}
  icon={<Building2 className="h-5 w-5" />}
  tone="primary"
  trend={{ value: '+12.6%', direction: 'up', label: '较上月' }}
/>;
```

### 13. 消息提示

```tsx
import { appToast } from '@apartment-ultra/shared-ui/components/ui';

appToast.success('保存成功', '租客信息已更新');

await appToast.promise(saveTenant(payload), {
  loading: '正在保存...',
  success: '保存成功',
  error: (error) => (error instanceof Error ? error.message : '保存失败'),
});
```

迁移建议：

- 新代码统一使用 `appToast`
- 旧代码如果原来写的是 `toast.success / toast.error / toast.warning`，优先直接替换为 `appToast.success / appToast.error / appToast.warning`
- 不再建议业务代码直接 `import { toast } from 'sonner'`

### 14. 饼图

```tsx
import { PieChart } from '@apartment-ultra/shared-ui/components/ui';

<PieChart
  title="房间状态分布"
  description="查看当前房态结构"
  centerLabel="128"
  centerSubLabel="总房间数"
  data={[
    { name: '已出租', value: 82 },
    { name: '空置中', value: 31 },
    { name: '维修中', value: 15 },
  ]}
/>;
```

### 15. 表格操作

```tsx
import { Edit, Trash2 } from 'lucide-react';
import { TableActions } from '@apartment-ultra/shared-ui/components/ui';

<TableActions
  actions={[
    { label: '编辑', icon: Edit, onClick: handleEdit },
    { label: '删除', icon: Trash2, variant: 'destructive', onClick: handleDelete },
  ]}
/>;
```

### 16. 主题切换

```tsx
import { ThemeProvider, ThemeToggle } from '@apartment-ultra/shared-ui/components/ui';

<ThemeProvider>
  <ThemeToggle />
</ThemeProvider>;
```

### 17. 折线图

```tsx
import { LineChart } from '@apartment-ultra/shared-ui/components/ui';

<LineChart
  title="近半年入住率走势"
  xKey="month"
  data={[
    { month: '01月', occupancy: 78.6 },
    { month: '02月', occupancy: 81.2 },
    { month: '03月', occupancy: 84.8 },
  ]}
  series={[{ dataKey: 'occupancy', label: '入住率' }]}
  yAxisFormatter={(value) => `${value}%`}
  valueFormatter={(value) => `${value}%`}
/>;
```

### 18. 统计图

```tsx
import { StatChart } from '@apartment-ultra/shared-ui/components/ui';

<StatChart
  title="各公寓月度收入"
  xKey="name"
  data={[
    { name: '一号公寓', income: 32000, expense: 8900 },
    { name: '二号公寓', income: 28600, expense: 7600 },
  ]}
  series={[
    { dataKey: 'income', label: '收入' },
    { dataKey: 'expense', label: '支出' },
  ]}
  valueFormatter={(value) => `¥${value.toLocaleString('zh-CN')}`}
  yAxisFormatter={(value) => `¥${value.toLocaleString('zh-CN')}`}
/>;
```

## 使用建议

- 列表页优先使用 `DataTable`，避免每个页面单独维护分页条和空态。
- 大型表单优先用 `AppDrawer`，轻量确认优先用 `AppDialog`。
- toast 统一通过 `appToast` 调用，便于后续统一样式和行为。
- 图表颜色尽量交给默认主题色板，只有在明确需要品牌色映射时再传 `color`。
