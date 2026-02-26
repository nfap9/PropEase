# 前端交互优化专项计划

> 版本: 1.0
> 日期: 2026-02-26
> 状态: 规划中

## 一、背景与目标

### 当前问题

1. **功能割裂**: 公寓管理和房间管理完全分离，用户需要在多个页面间切换
2. **操作效率低**: 所有表格操作都隐藏在下拉菜单中，需要多次点击
3. **信息孤岛**: 各模块之间缺乏关联导航，无法快速跳转
4. **视觉一致性**: 仪表盘图标重复使用，缺乏辨识度

### 优化目标

- 提升操作效率，减少点击次数
- 增强功能连贯性，实现场景化工作流
- 改善视觉体验，提高信息辨识度
- 增加快捷操作入口

---

## 二、优化项目清单

### P0 - 高优先级（核心体验）

#### 1. 公寓-房间一体化管理

**现状**: 公寓管理和房间管理是两个独立页面，用户需要分开操作。

**改进方案**:

```
方案 A: 公寓详情页内嵌房间列表
├── 公寓列表页 (/apartments)
│   └── 点击公寓名称 → 公寓详情页 (/apartments/[id])
│       ├── 公寓基本信息（可编辑）
│       ├── 房间列表（DataTable）
│       │   ├── 支持在当前公寓下新增房间
│       │   └── 房间操作（编辑、删除）
│       └── 快捷操作区
│           ├── 快速创建租约
│           └── 查看该公寓所有租约
```

**涉及文件**:
- 新增: `web/src/app/apartments/[id]/page.tsx`
- 修改: `web/src/app/apartments/page.tsx` (公寓名称改为可点击链接)
- 复用: `web/src/app/rooms/page.tsx` 的房间管理逻辑

**工作量**: 2-3 天

---

#### 2. 表格操作列优化

**现状**: 所有操作隐藏在下拉菜单中，每次操作需点击 2 次。

**改进方案**:

```tsx
// 智能显示策略
// 当操作数 ≤ 3 且空间足够时：直接显示按钮
// 当操作数 > 3 或空间不足时：使用下拉菜单

// 示例：公寓管理（2个操作）
<div className="flex items-center gap-1">
  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
    <Pencil className="h-4 w-4" />
    <span className="ml-1 hidden sm:inline">编辑</span>
  </Button>
  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item)}>
    <Trash2 className="h-4 w-4" />
    <span className="ml-1 hidden sm:inline">删除</span>
  </Button>
</div>

// 示例：租约管理（3+个操作）
<div className="flex items-center gap-1">
  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
    <Pencil className="h-4 w-4" />
  </Button>
  {lease.is_active && (
    <Button variant="ghost" size="sm" onClick={() => handleTerminate(item)}>
      <Ban className="h-4 w-4" />
    </Button>
  )}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" /> 删除
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**涉及文件**:
- `web/src/app/apartments/page.tsx`
- `web/src/app/rooms/page.tsx`
- `web/src/app/tenants/page.tsx`
- `web/src/app/leases/page.tsx`
- `web/src/app/bills/page.tsx`
- `web/src/app/utilities/page.tsx`

**工作量**: 1-2 天

---

#### 3. 仪表盘图标优化

**现状**: 所有统计卡片使用相同的 Building2 图标。

**改进方案**:

```tsx
import {
  Building2, Home, Percent, FileText,
  Users, DollarSign, Clock, AlertCircle
} from 'lucide-react';

// 统计卡片配置
const STATS_CONFIG = {
  apartments: { icon: Building2, color: 'text-blue-500' },
  rooms: { icon: Home, color: 'text-green-500' },
  occupancy: { icon: Percent, color: 'text-purple-500' },
  leases: { icon: FileText, color: 'text-orange-500' },
  tenants: { icon: Users, color: 'text-cyan-500' },
  revenue: { icon: DollarSign, color: 'text-emerald-500' },
  pending: { icon: Clock, color: 'text-amber-500' },
  overdue: { icon: AlertCircle, color: 'text-red-500' },
};
```

**涉及文件**:
- `web/src/app/dashboard/dashboard-content.tsx`

**工作量**: 0.5 天

---

### P1 - 中优先级（效率提升）

#### 4. 快速创建租约流程

**现状**: 创建租约需要先切换到租约页面，然后选择公寓、房间、租客。

**改进方案**:

```
入口1: 房间管理页面
├── 空置房间显示「快速签约」按钮
└── 点击后弹出对话框，只需选择租客即可创建租约

入口2: 公寓详情页
├── 显示该公寓所有空置房间
└── 支持直接从空置房间创建租约

入口3: 租客详情页（新增）
└── 显示「为该租客签约」按钮
```

**涉及文件**:
- 新增: `web/src/components/common/quick-create-lease-dialog.tsx`
- 修改: `web/src/app/rooms/page.tsx`
- 新增: `web/src/app/tenants/[id]/page.tsx`

**工作量**: 2-3 天

---

#### 5. 关联数据导航

**现状**: 各模块之间缺乏关联跳转。

**改进方案**:

| 页面 | 关联跳转 |
|------|----------|
| 房间列表 | 点击公寓名称 → 该公寓详情页 |
| 租约列表 | 点击房间 → 房间详情/编辑 |
| 租约列表 | 点击租客 → 租客详情页 |
| 账单列表 | 点击租约 → 租约详情 |
| 水电录入 | 点击房间 → 房间详情 |

**涉及文件**:
- 各列表页的表格列定义

**工作量**: 1 天

---

#### 6. 租客详情页

**现状**: 租客管理只有列表页，无法查看单个租客的详细信息。

**改进方案**:

```
路由: /tenants/[id]
├── 基本信息卡片
├── 当前租约信息
│   └── 租约详情（房间、月租、起止日期）
├── 历史租约列表
└── 相关账单记录
```

**涉及文件**:
- 新增: `web/src/app/tenants/[id]/page.tsx`
- 后端: 新增 API 获取租客关联数据

**工作量**: 2 天

---

#### 7. 批量操作支持

**现状**: 所有操作都是单条记录操作。

**改进方案**:

```
功能1: 批量删除
├── 表格支持多选（Checkbox）
├── 底部显示「已选择 X 条」
└── 批量删除确认对话框

功能2: 批量导出
├── 导出当前筛选结果为 CSV/Excel
└── 支持选择导出字段
```

**涉及文件**:
- 新增: `web/src/components/common/data-table-with-selection.tsx`
- 各管理页面

**工作量**: 2-3 天

---

### P2 - 低优先级（体验增强）

#### 8. 全局搜索功能

**改进方案**:

```
位置: 顶部导航栏
快捷键: Ctrl/Cmd + K

搜索范围:
├── 公寓名称
├── 房间号
├── 租客姓名/电话
└── 租约

搜索结果:
├── 分类展示（公寓、房间、租客、租约）
└── 点击跳转到对应详情页
```

**工作量**: 3-4 天

---

#### 9. 表格列自定义

**改进方案**:

```
功能:
├── 用户可选择显示/隐藏的列
├── 记住用户偏好（localStorage）
└── 支持列宽调整
```

**工作量**: 2 天

---

#### 10. 数据可视化增强

**现状**: 仪表盘只有数字展示，缺少可视化图表。

**改进方案**:

```
图表1: 入住率趋势图（近6个月）
图表2: 收入趋势图（近6个月）
图表3: 房间状态分布（饼图）
图表4: 账单状态分布
```

**技术选型**: Recharts 或 Chart.js

**工作量**: 3-4 天

---

#### 11. 行内编辑

**改进方案**:

```
适用场景:
├── 房间状态快速切换（下拉选择）
├── 月租金额快速修改
└── 租客联系方式快速修改

实现方式:
├── 双击单元格进入编辑模式
├── 失焦或回车保存
└── 支持撤销
```

**工作量**: 2-3 天

---

#### 12. 面包屑导航

**改进方案**:

```
示例:
├── 公寓管理 > 阳光公寓A栋
├── 房间管理 > 101室
├── 租客管理 > 张三
└── 租约管理 > 张三 - 101室
```

**工作量**: 1 天

---

#### 13. 键盘快捷键

**改进方案**:

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + K` | 全局搜索 |
| `Ctrl/Cmd + N` | 新建当前页面类型的数据 |
| `Esc` | 关闭对话框/取消操作 |
| `?` | 显示快捷键帮助 |

**工作量**: 1 天

---

#### 14. 操作确认 Toast 提示

**现状**: 操作成功后只刷新列表，无明确反馈。

**改进方案**:

```tsx
import { toast } from 'sonner';

// 成功提示
toast.success('公寓创建成功');

// 错误提示
toast.error('操作失败，请重试');

// 带撤销的提示
toast.success('租约已终止', {
  action: {
    label: '撤销',
    onClick: () => handleUndo(),
  },
});
```

**工作量**: 1 天

---

## 三、实施路线图

### 第一阶段（1-2 周）

**目标**: 解决核心体验问题

| 任务 | 优先级 | 预计工时 |
|------|--------|----------|
| 公寓-房间一体化 | P0 | 2-3 天 |
| 表格操作列优化 | P0 | 1-2 天 |
| 仪表盘图标优化 | P0 | 0.5 天 |
| 关联数据导航 | P1 | 1 天 |

### 第二阶段（2-3 周）

**目标**: 提升操作效率

| 任务 | 优先级 | 预计工时 |
|------|--------|----------|
| 快速创建租约流程 | P1 | 2-3 天 |
| 租客详情页 | P1 | 2 天 |
| 批量操作支持 | P1 | 2-3 天 |
| Toast 提示 | P2 | 1 天 |

### 第三阶段（3-4 周）

**目标**: 体验增强

| 任务 | 优先级 | 预计工时 |
|------|--------|----------|
| 全局搜索功能 | P2 | 3-4 天 |
| 数据可视化 | P2 | 3-4 天 |
| 行内编辑 | P2 | 2-3 天 |
| 其他增强功能 | P2 | 3-4 天 |

---

## 四、技术方案

### 公寓-房间一体化实现方案

```tsx
// web/src/app/apartments/[id]/page.tsx
export default function ApartmentDetailPage({ params }: { params: { id: string } }) {
  const apartmentId = Number(params.id);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 面包屑 */}
        <Breadcrumb>
          <BreadcrumbLink href="/apartments">公寓管理</BreadcrumbLink>
          <BreadcrumbPage>{apartment?.name}</BreadcrumbPage>
        </Breadcrumb>

        {/* 公寓信息卡片 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>公寓信息</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">公寓名称</Label>
                <p className="font-medium">{apartment?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">地址</Label>
                <p className="font-medium">{apartment?.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="总房间数" value={apartment?.room_count || 0} />
          <StatCard title="已出租" value={apartment?.occupied_count || 0} />
          <StatCard title="空置" value={apartment?.available_count || 0} />
          <StatCard title="维修中" value={apartment?.maintenance_count || 0} />
        </div>

        {/* 房间列表 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>房间列表</CardTitle>
            <Button size="sm" onClick={() => setIsCreateRoomOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增房间
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable columns={roomColumns} data={rooms || []} />
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="outline" onClick={() => navigateTo('/leases?apartment=' + apartmentId)}>
              <FileText className="mr-2 h-4 w-4" />
              查看租约
            </Button>
            <Button variant="outline" onClick={() => navigateTo('/bills?apartment=' + apartmentId)}>
              <Receipt className="mr-2 h-4 w-4" />
              查看账单
            </Button>
            <Button variant="outline" onClick={() => navigateTo('/utilities?apartment=' + apartmentId)}>
              <Zap className="mr-2 h-4 w-4" />
              水电录入
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
```

### 表格操作列智能显示组件

```tsx
// web/src/components/common/table-actions.tsx
import { useMediaQuery } from '@/hooks/use-mobile';

interface Action {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  show?: boolean;
}

interface TableActionsProps {
  actions: Action[];
  maxInline?: number; // 最多直接显示几个按钮
}

export function TableActions({ actions, maxInline = 2 }: TableActionsProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const visibleActions = actions.filter(a => a.show !== false);
  const inlineActions = visibleActions.slice(0, maxInline);
  const menuActions = visibleActions.slice(maxInline);

  // 移动端全部放入菜单
  if (!isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {visibleActions.map((action, i) => (
            <DropdownMenuItem
              key={i}
              onClick={action.onClick}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 桌面端直接显示部分按钮
  return (
    <div className="flex items-center gap-1">
      {inlineActions.map((action, i) => (
        <Button
          key={i}
          variant="ghost"
          size="sm"
          onClick={action.onClick}
          className={action.variant === 'destructive' ? 'text-destructive hover:text-destructive' : ''}
        >
          {action.icon && <action.icon className="h-4 w-4" />}
          <span className="ml-1 hidden lg:inline">{action.label}</span>
        </Button>
      ))}
      {menuActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menuActions.map((action, i) => (
              <DropdownMenuItem
                key={i}
                onClick={action.onClick}
                className={action.variant === 'destructive' ? 'text-destructive' : ''}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
```

---

## 五、验收标准

### 公寓-房间一体化

- [ ] 公寓列表页，公寓名称可点击进入详情页
- [ ] 详情页显示公寓基本信息
- [ ] 详情页显示该公寓所有房间
- [ ] 详情页可直接新增房间
- [ ] 详情页可编辑、删除房间
- [ ] 移动端适配良好

### 表格操作列优化

- [ ] 操作数 ≤ 2 时直接显示按钮
- [ ] 桌面端显示按钮文字
- [ ] 移动端图标 + 下拉菜单
- [ ] 危险操作（删除）有明确视觉区分

### 整体体验

- [ ] 页面加载有 Loading 状态
- [ ] 操作成功有 Toast 提示
- [ ] 表单验证有明确错误提示
- [ ] 键盘可正常操作
- [ ] 无明显性能问题

---

## 六、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 后端 API 不支持关联查询 | 延迟开发 | 先用前端聚合，后端优化后迁移 |
| 设计资源不足 | 视觉不一致 | 参考 shadcn/ui 默认样式 |
| 测试覆盖不足 | 回归风险 | 每个功能完成后进行手动测试 |

---

## 七、附录

### 相关文档

- [web/AGENTS.md](../web/AGENTS.md) - 前端开发指南
- [CLAUDE.md](../CLAUDE.md) - 项目规范

### 组件库参考

- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [TanStack Table](https://tanstack.com/table)
