# 前端组件拆分指南

本文档定义了前端组件的职责边界和拆分标准，帮助开发者编写可维护、可复用的组件。

## 核心原则

**单一职责**：每个组件只做一件事，只有一个改变的理由。

## 组件大小阈值

| 行数 | 建议 |
|------|------|
| < 150 行 | 通常不需要拆分 |
| 150-250 行 | 检查职责是否单一 |
| > 250 行 | 必须评估是否需要拆分 |

> 注：行数只是参考，关键是职责是否清晰。某些复杂表单组件（如租约表单）行数较多但职责集中，可以接受。

## 何时拆分组件

### 需要拆分的信号

1. **职责混杂**：组件做了多件不相关的事
2. **重复渲染**：部分 JSX 在条件分支中重复出现
3. **状态隔离**：某些状态只被组件的某一部分使用
4. **可复用性**：组件的某部分在其他地方也需要使用
5. **测试困难**：难以单独测试组件的某个功能

### 不需要拆分的情况

1. 组件已经足够简单（< 100 行）
2. 拆分会增加不必要的复杂度
3. 组件内部逻辑高度耦合，拆分后反而难以理解

## 拆分模式

### 模式 A：子组件抽取

当组件的 JSX 中有相对独立的区块时，抽取为子组件。

**适用场景**：表单字段分组、卡片内容区域、列表项

```tsx
// 拆分前：所有内容在一个组件中
function LeaseFormDialog() {
  return (
    <Dialog>
      <DialogContent>
        <form>
          {/* 日期区域 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input type="date" {...form.register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input type="date" {...form.register('end_date')} />
            </div>
          </div>
          {/* 更多字段... */}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 拆分后：抽取日期字段组
function DateFields({ form }: { form: UseFormReturn<LeaseFormData> }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField label="开始日期" required>
        <Input type="date" {...form.register('start_date')} />
      </FormField>
      <FormField label="结束日期">
        <Input type="date" {...form.register('end_date')} />
      </FormField>
    </div>
  );
}

function LeaseFormDialog() {
  return (
    <Dialog>
      <DialogContent>
        <form>
          <DateFields form={form} />
          {/* 其他字段... */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 模式 B：职责分离

当一个组件承担了多个独立职责时，分离为多个组件，再通过组合使用。

**适用场景**：选择器 + 创建功能、列表 + 详情面板

```tsx
// 拆分前：选择器内嵌创建对话框
function TenantSelect({ orgId, value, onValueChange }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createForm = useForm(...);
  const createMutation = useMutation(...);

  return (
    <div>
      <Select>{/* 选择器逻辑 */}</Select>

      {/* 内嵌的创建对话框 */}
      <Dialog open={isCreateOpen}>
        <DialogContent>
          <form>{/* 创建表单 */}</form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 拆分后：职责分离
// 1. 纯选择器组件
function TenantSelect({ orgId, value, onValueChange }) {
  const { data: tenants } = useQuery({
    queryKey: ['tenants', orgId],
    queryFn: () => tenantsApi.list(orgId),
  });

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="选择租客" />
      </SelectTrigger>
      <SelectContent>
        {tenants?.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name} - {t.phone}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// 2. 创建对话框组件
function CreateTenantDialog({ orgId, open, onOpenChange, onSuccess }) {
  const form = useForm(...);
  const mutation = useMutation(...);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
          {/* 表单字段 */}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 3. 组合组件（按需使用）
function TenantSelectWithCreate({ orgId, value, onValueChange }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleCreated = (newTenant) => {
    setIsCreateOpen(false);
    onValueChange(newTenant.id);
  };

  return (
    <div className="flex gap-2">
      <TenantSelect
        orgId={orgId}
        value={selectedValue}
        onValueChange={onValueChange}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCreateOpen(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <CreateTenantDialog
        orgId={orgId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCreated}
      />
    </div>
  );
}
```

### 模式 C：Hook 抽取

当组件的状态逻辑复杂且可复用时，抽取为自定义 Hook。

**适用场景**：表单重置逻辑、数据获取+缓存、复杂状态管理

```tsx
// 拆分前：表单重置逻辑在组件内
function LeaseFormDialog({ open, room }) {
  const form = useForm({
    resolver: zodResolver(leaseSchema),
    defaultValues: { ... },
  });

  useEffect(() => {
    if (room && open) {
      form.reset({ room_id: room.id, ... });
    } else if (open) {
      form.reset({ ... defaultValues });
    }
  }, [room, open]);

  // ...
}

// 拆分后：抽取为 Hook
function useLeaseFormReset(form, room, open) {
  useEffect(() => {
    if (room && open) {
      form.reset({ room_id: room.id, monthly_rent: room.monthly_rent, ... });
    } else if (open) {
      form.reset({ ...defaultValues });
    }
  }, [room, open, form]);
}

function LeaseFormDialog({ open, room }) {
  const form = useForm({ resolver: zodResolver(leaseSchema), defaultValues });
  useLeaseFormReset(form, room, open);
  // ...
}
```

## 案例分析

### 案例 1：tenant-select.tsx（需要重构）

**当前问题**：
- 194 行，职责混杂
- 选择器 + 创建对话框 两种职责
- 创建对话框代码占 50%+

**建议方案**：
1. 保留 `TenantSelect` 作为纯选择器
2. 新建 `CreateTenantDialog` 独立组件
3. 新建 `TenantSelectWithCreate` 组合组件
4. 逐步替换使用方

### 案例 2：main-layout.tsx（可选重构）

**当前问题**：
- 244 行，NavContent 内部定义
- 导航配置与布局渲染混合

**建议方案**：
- 抽取 `NavContent` 为独立组件文件 `nav-content.tsx`
- 抽取导航配置常量到 `nav-config.ts`

### 案例 3：lease-form-dialog.tsx（暂不重构）

**分析**：
- 330 行，但职责单一（创建租约）
- 两种模式（指定房间/选择房间）是业务需要
- 表单字段多是业务复杂度，不是代码问题

**建议**：保持现状，若后续增加编辑功能再考虑拆分

## 代码审查检查清单

审查前端组件时，检查以下项：

- [ ] 组件行数是否超过 250 行？
- [ ] 组件是否只做一件事？
- [ ] 是否有可以复用的子区块？
- [ ] 状态是否隔离良好？
- [ ] 是否内嵌了独立的功能（如对话框）？
- [ ] 测试是否容易编写？

## 组件目录结构

```
web/src/components/
├── ui/           # 基础 UI 组件（shadcn/ui）
├── common/       # 通用业务组件（单一职责）
├── layout/       # 布局组件
├── forms/        # 表单组件（可选）
└── [feature]/    # 功能模块组件（可选）
```

命名约定：
- 选择器：`xxx-select.tsx`
- 对话框：`xxx-dialog.tsx`
- 表单：`xxx-form.tsx`
- 列表：`xxx-list.tsx`
