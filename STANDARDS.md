# propease 前端规范 — antd 组件篇

> 本规范基于 tenant-web 重构实践，专注于 antd 与 react-hook-form 配合的正确姿势。
> 项目目前使用 pnpm workspace，包名：`propease-tenant`

---

## 目录

1. [通用原则](#1-通用原则)
2. [Button](#2-button)
3. [Form 与表单校验](#3-form-与表单校验)
4. [Modal / Drawer](#4-modal--drawer)
5. [Table](#5-table)
6. [Select / InputNumber](#6-select--inputnumber)
7. [DatePicker / TimePicker](#7-datepicker--timepicker)
8. [Card / Tag / Badge](#8-card--tag--badge)
9. [消息与反馈](#9-消息与反馈)
10. [常见错误自查清单](#10-常见错误自查清单)

---

## 1. 通用原则

### 1.1 组件导入

```tsx
// ✅ 正确：从 'antd' 导入，类型从 'antd' 导入
import { Button, Form, Modal, Select } from 'antd';
import type { FormProps } from 'antd';

// ❌ 错误：从 '@antho-firu/xxx' 导入已废弃的 shadcn 封装
```

### 1.2 Props 规范

| 规则 | 说明 |
|------|------|
| 布尔 prop 用 `open` | 不是 `visible`、`isOpen` |
| 回调用 `onXxx` | 不是 `handleXxx`（仅限组件 prop） |
| 受控prop 用 `value` | 非受控组件不要传 `value` |
| 枚举值用 string | 如 `type="primary"` 不是 `type={1}` |
| 尺寸用 `small`/`middle`/`large` | 不是 `size="sm"` |

### 1.3 样式规范

```tsx
// ✅ 使用 antd 内置样式系统
<Space direction="vertical" size="small">
<Row gutter={16}>
<Col span={12}>

// ❌ 避免在 antd 组件上混用 Tailwind 间距（Form.Item 内部除外）
<Modal className="space-y-4">  </Modal>

// ✅ 组件内部布局可用 Tailwind
<Modal>
  <div className="space-y-4">
    ...
  </div>
</Modal>
```

---

## 2. Button

### 2.1 类型与变体

```tsx
// ✅ antd Button variant
<Button>Default</Button>
<Button type="primary">Primary</Button>
<Button type="dashed">Dashed</Button>
<Button danger>Danger</Button>
<Button type="text">Text</Button>
<Button type="link">Link</Button>

// ❌ 不存在的 variant（shadcn 遗留）
<Button variant="outlined" />   // ❌ 不存在
<Button variant="ghost" />      // ❌ 不存在
```

### 2.2 图标与排列

```tsx
// ✅ 图标在文字左侧
<Button icon={<PlusOutlined />}>新增</Button>

// ✅ 需要精确控制时
<Button>
  <Space>
    <PlusOutlined />
    <span>新增</span>
  </Space>
</Button>

// ✅ loading 状态
<Button loading={isPending}>保存</Button>
<Button loading={isPending} icon={<SaveOutlined />}>保存</Button>

// ✅ 危险操作
<Button danger>删除</Button>
```

### 2.3 组合用法

```tsx
// ✅ Modal footer 按钮组合
footer={
  <Space>
    <Button onClick={onCancel}>取消</Button>
    <Button type="primary" loading={isPending} onClick={form.handleSubmit(onSubmit)}>
      {isPending ? '保存中...' : '保存'}
    </Button>
  </Space>
}

// ✅ 表单底部操作栏
<div className="flex justify-end gap-2">
  <Button onClick={onCancel}>取消</Button>
  <Button type="primary" htmlType="submit" loading={isPending}>
    {isPending ? '提交中...' : '提交'}
  </Button>
</div>
```

---

## 3. Form 与表单校验

> **核心原则：react-hook-form + antd 必须通过 Controller 配合，不可用 Form.Item name 属性接管 react-hook-form 的字段。**

### 3.1 正确架构

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, Button, Select } from 'antd';
import { z } from 'zod';

// Step 1：定义 Zod Schema
const schema = z.object({
  name: z.string().min(1, '请输入名称'),
  type: z.string().min(1, '请选择类型'),
});

type FormData = z.infer<typeof schema>;

// Step 2：创建 useForm（注意泛型）
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', type: '' },
});

// Step 3：用 Controller 桥接每个字段
<Form layout="vertical">
  <Controller
    name="name"
    control={form.control}
    render={({ field, fieldState }) => (
      <Form.Item
        label="名称"
        required
        validateStatus={fieldState.error ? 'error' : ''}
        help={fieldState.error?.message}
      >
        <Input {...field} placeholder="请输入" />
      </Form.Item>
    )}
  />

  <Controller
    name="type"
    control={form.control}
    render={({ field }) => (
      <Form.Item label="类型">
        <Select {...field} placeholder="请选择">
          <Select.Option value="A">类型A</Select.Option>
        </Select>
      </Form.Item>
    )}
  />
</Form>
```

### 3.2 Form.Item 使用规范

```tsx
// ✅ 标准写法：Form.Item 仅做布局和标签，校验状态由 Controller 提供
<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Form.Item
      label="邮箱"
      required
      validateStatus={fieldState.error ? 'error' : ''}
      help={fieldState.error?.message}
    >
      <Input {...field} type="email" />
    </Form.Item>
  )}
/>

// ❌ 错误：Form.Item name + react-hook-form 混用（双绑定）
<Form.Item name="email" label="邮箱">    {/* antd 管理值 */}
  <Input {...form.register('email')} />  {/* react-hook-form 也管值 */}
</Form.Item>

// ❌ 错误：在 Controller 内又用 form.watch
<Controller
  name="email"
  control={form.control}
  render={({ field }) => (
    <Form.Item label="邮箱">
      <Input {...field} value={form.watch('email')} /> {/* 值冲突 */}
    </Form.Item>
  )}
/>
```

### 3.3 表单布局

```tsx
// ✅ 垂直布局（推荐，所有复杂表单用这个）
<Form layout="vertical">
  <Controller ... />
</Form>

// ✅ 栅格布局（行内相关字段）
<div className="grid grid-cols-2 gap-4">
  <Controller name="firstName" ... />
  <Controller name="lastName" ... />
</div>

// ❌ 避免：Form 内联布局用于复杂字段
<Form layout="inline">  {/* 只适合搜索框那种简单场景 */}
```

### 3.4 数字字段（关键）

```tsx
// ✅ 数字字段 onChange 必须返回空字符串而非 undefined
<Controller
  name="monthly_rent"
  control={form.control}
  render={({ field }) => (
    <Form.Item label="月租">
      <InputNumber
        {...field}
        value={field.value ?? ''}           // 空值显示为空
        onChange={(val) => field.onChange(val ?? '')}  // 存空字符串
        min={0}
        style={{ width: '100%' }}
      />
    </Form.Item>
  )}
/>

// ✅ 批量编辑场景（可选值）
<Controller
  name="monthly_rent"
  control={form.control}
  render={({ field }) => (
    <Form.Item label="月租">
      <InputNumber
        {...field}
        value={field.value ?? ''}
        onChange={(val) => field.onChange(val === null ? undefined : val)}
        placeholder="留空不修改"
      />
    </Form.Item>
  )}
/>
```

### 3.5 表单提交

```tsx
// ✅ 在 Modal footer 中使用
<Modal
  open={open}
  onCancel={() => onOpenChange(false)}
  footer={
    <Space>
      <Button onClick={() => onOpenChange(false)}>取消</Button>
      <Button
        type="primary"
        loading={isPending}
        onClick={form.handleSubmit(onSubmit)}
      >
        保存
      </Button>
    </Space>
  }
>
  <Form layout="vertical">
    {/* fields */}
  </Form>
</Modal>

// ❌ 错误：Form onFinish 与 react-hook-form 混用
<Form onFinish={form.handleSubmit(fn)}>  {/* 用一个就行 */}
```

---

## 4. Modal / Drawer

### 4.1 基本用法

```tsx
// ✅ 标准 Modal
<Modal
  open={isOpen}
  onCancel={() => setIsOpen(false)}
  title="标题"
  footer={
    <Space>
      <Button onClick={() => setIsOpen(false)}>取消</Button>
      <Button type="primary" loading={isPending} onClick={form.handleSubmit(onSubmit)}>
        确定
      </Button>
    </Space>
  }
>
  <p>内容区域</p>
</Modal>

// ✅ 危险操作确认
<Modal
  open={isOpen}
  onCancel={() => setIsOpen(false)}
  title="确认删除"
  footer={
    <Space>
      <Button onClick={() => setIsOpen(false)}>取消</Button>
      <Button danger loading={isDeleting} onClick={handleDelete}>
        确认删除
      </Button>
    </Space>
  }
>
  <p>确定要删除吗？</p>
</Modal>
```

### 4.2 Drawer（侧边抽屉）

```tsx
// ✅ 从右侧滑出
<Drawer
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  title="编辑"
  width={480}
  extra={
    <Space>
      <Button onClick={onClose}>取消</Button>
      <Button type="primary" loading={isPending} onClick={form.handleSubmit(onSubmit)}>
        保存
      </Button>
    </Space>
  }
>
  <Form layout="vertical">
    {/* fields */}
  </Form>
</Drawer>
```

### 4.3 Modal 内嵌表单

```tsx
// ✅ 推荐：表单内容紧跟在 Modal 内，不嵌套额外组件
<Modal
  open={open}
  onCancel={() => onOpenChange(false)}
  title="新增房间"
  footer={[/* footer buttons */]}
  className="max-w-lg"
>
  <Form layout="vertical">
    <div className="space-y-4">
      <Controller name="room_number" ... />
      <Controller name="layout" ... />
    </div>
  </Form>
</Modal>

// ❌ 避免：多余的 wrapper div 导致的间距问题
<Modal>
  <div className="p-4">      {/* 多余 */}
    <Form>
```

---

## 5. Table

### 5.1 基本用法

```tsx
import { Table } from 'antd';
import type { TableProps } from 'antd';

const columns: TableProps<Room>['columns'] = [
  {
    title: '房间号',
    dataIndex: 'room_number',
    key: 'room_number',
  },
  {
    title: '户型',
    dataIndex: 'layout',
    key: 'layout',
  },
  {
    title: '月租',
    dataIndex: 'monthly_rent',
    key: 'monthly_rent',
    render: (val) => (val ? `¥${val}` : '-'),
  },
];

<Table
  rowKey="id"
  columns={columns}
  dataSource={rooms}
  pagination={false}
  size="middle"
/>
```

### 5.2 分页与加载

```tsx
// ✅ 完整分页
<Table
  rowKey="id"
  columns={columns}
  dataSource={rooms}
  loading={isLoading}
  pagination={{
    current: page,
    pageSize: pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    onChange: (p, ps) => { setPage(p); setPageSize(ps); },
  }}
/>
```

### 5.3 行选择

```tsx
const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

<Table
  rowKey="id"
  columns={columns}
  dataSource={rooms}
  rowSelection={{
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }}
/>
```

---

## 6. Select / InputNumber

### 6.1 Select

```tsx
// ✅ 标准写法（Controller）
<Controller
  name="status"
  control={form.control}
  render={({ field }) => (
    <Form.Item label="状态">
      <Select {...field} placeholder="请选择">
        <Select.Option value="active">活跃</Select.Option>
        <Select.Option value="inactive">未激活</Select.Option>
      </Select>
    </Form.Item>
  )}
/>

// ✅ 支持搜索
<Select showSearch optionFilterProp="label">
  <Select.Option value="A" label="类型A">类型A</Select.Option>
</Select>

// ✅ 多选
<Select mode="multiple" {...field}>

// ✅ 带标签的选项
<Select>
  {options.map((opt) => (
    <Select.Option key={opt.value} value={opt.value}>
      <Space>
        <span className="font-medium">{opt.label}</span>
        <Tag>{opt.count}</Tag>
      </Space>
    </Select.Option>
  ))}
</Select>
```

### 6.2 InputNumber

```tsx
// ✅ 标准数字输入
<Controller
  name="monthly_rent"
  control={form.control}
  render={({ field, fieldState }) => (
    <Form.Item
      label="月租"
      validateStatus={fieldState.error ? 'error' : ''}
      help={fieldState.error?.message}
    >
      <InputNumber
        {...field}
        value={field.value ?? ''}
        onChange={(val) => field.onChange(val ?? '')}
        min={0}
        precision={2}
        style={{ width: '100%' }}
        prefix="¥"
      />
    </Form.Item>
  )}
/>

// ✅ 带单位的 InputNumber
<InputNumber
  {...field}
  value={field.value ?? ''}
  onChange={(val) => field.onChange(val ?? '')}
  min={0}
  addonAfter="元/月"
  style={{ width: '100%' }}
/>
```

### 6.3 Select + InputNumber 组合

```tsx
// ✅ 栅格布局的数字输入
<div className="grid grid-cols-2 gap-4">
  <Controller name="area" render={({ field }) => (
    <Form.Item label="面积">
      <InputNumber {...field} value={field.value ?? ''} onChange={(v) => field.onChange(v ?? '')} addonAfter="㎡" />
    </Form.Item>
  )} />
  <Controller name="floor" render={({ field }) => (
    <Form.Item label="楼层">
      <InputNumber {...field} value={field.value ?? ''} onChange={(v) => field.onChange(v ?? '')} />
    </Form.Item>
  )} />
</div>
```

---

## 7. DatePicker / TimePicker

### 7.1 日期选择

```tsx
import dayjs from 'dayjs';

// ✅ 日期字段（存储为字符串 YYYY-MM-DD）
<Controller
  name="contract_start"
  control={form.control}
  render={({ field, fieldState }) => (
    <Form.Item
      label="合同开始日期"
      validateStatus={fieldState.error ? 'error' : ''}
      help={fieldState.error?.message}
    >
      <DatePicker
        {...field}
        value={field.value ? dayjs(field.value) : null}
        onChange={(date) => field.onChange(date?.format('YYYY-MM-DD') ?? '')}
        className="w-full"
      />
    </Form.Item>
  )}
/>

// ✅ 日期范围
<Controller
  name="period"
  control={form.control}
  render={({ field }) => (
    <Form.Item label="账期">
      <RangePicker
        value={field.value ? [dayjs(field.value[0]), dayjs(field.value[1])] : null}
        onChange={(dates) => field.onChange(dates?.map((d) => d.format('YYYY-MM-DD')) ?? [])}
      />
    </Form.Item>
  )}
/>
```

### 7.2 TimePicker

```tsx
<Controller
  name="reminder_time"
  control={form.control}
  render={({ field }) => (
    <Form.Item label="提醒时间">
      <TimePicker
        {...field}
        value={field.value ? dayjs(field.value, 'HH:mm') : null}
        onChange={(time) => field.onChange(time?.format('HH:mm') ?? '')}
        format="HH:mm"
      />
    </Form.Item>
  )}
/>
```

---

## 8. Card / Tag / Badge

### 8.1 Card

```tsx
// ✅ 基础用法
<Card title="标题" size="small">
  <p>内容</p>
</Card>

// ✅ 无标题
<Card>
  <p>内容</p>
</Card>

// ✅ 栅格内的卡片
<div className="grid grid-cols-2 gap-4">
  <Card title="卡片1" size="small">
    <ApartmentCard ... />
  </Card>
  <Card title="卡片2" size="small">
    <ApartmentCard ... />
  </Card>
</div>

// ✅ 嵌套内容
<Card title="详情">
  <div className="space-y-3">
    <InfoItem label="房东" value={landlord_name} />
    <InfoItem label="租金" value={`¥${landlord_rent}`} />
  </div>
</Card>
```

### 8.2 Tag

```tsx
// ✅ 状态标签
<Tag color="success">已出租</Tag>
<Tag color="default">空置</Tag>
<Tag color="warning">维修中</Tag>
<Tag color="error">欠费</Tag>

// ✅ 动态颜色
<Tag color={status === 'active' ? 'green' : 'default'}>
  {status === 'active' ? '活跃' : '未激活'}
</Tag>
```

### 8.3 Badge

```tsx
// ✅ 数字徽章
<Badge count={5} size="small">
  <BellOutlined style={{ fontSize: 20 }} />
</Badge>

// ✅ 状态点
<Badge status="success" text="在线" />
<Badge status="error" text="离线" />
<Badge status="processing" text="进行中" />
```

---

## 9. 消息与反馈

### 9.1 Toast（全局提示）

```tsx
import { toast } from 'sonner';  // 项目使用 sonner

// ✅ 成功
toast.success('操作成功');

// ✅ 错误（自动从 error 对象提取消息）
toast.error(getErrorMessage(error, '操作失败，请重试'));

// ✅ 加载中（持续显示）
toast.loading('处理中...');

// ✅ 手动关闭
const id = toast.loading('处理中...');
toast.dismiss(id);
```

### 9.2 Message（antd 内置）

```tsx
import { message } from 'antd';

// ✅ 注意：推荐使用 sonner 的 toast，但如果需要 antd message
message.success('保存成功');
message.error('操作失败');
message.info('提示信息');
```

### 9.3 Modal.confirm（确认框）

```tsx
import { Modal } from 'antd';

// ✅ 删除确认
Modal.confirm({
  title: '确认删除',
  content: '删除后无法恢复，确定要删除吗？',
  okText: '确认删除',
  okType: 'danger',
  cancelText: '取消',
  onOk() {
    handleDelete(id);
  },
});

// ✅ 异步确认（loading）
Modal.confirm({
  title: '确认操作',
  content: '确定要执行此操作吗？',
  okButtonProps: { loading: isPending },
  onOk: async () => {
    await mutateAsync();
  },
});
```

---

## 10. 常见错误自查清单

### 🔴 立即修复类

- [ ] `<Button variant="outlined">` → 改为 `<Button>`
- [ ] `<Form.Item name="x">` + `{...form.register('x')}` → 改为 `<Controller>`
- [ ] `onChange={(v) => field.onChange(v ?? undefined)}` → 改为 `field.onChange(v ?? '')`
- [ ] `<Input type="number">` → 改为 `<InputNumber>`

### 🟡 规范遵循类

- [ ] 所有表单字段统一使用 `<Controller>` 包裹
- [ ] Modal footer 按钮用 `loading={isPending}` 而非手动文字替换
- [ ] `DatePicker` onChange 后用 `.format('YYYY-MM-DD')` 存储
- [ ] 数字字段 `onChange` 必须返回 `''` 而非 `undefined`

### 🟢 最佳实践类

- [ ] Form.Item 的 `validateStatus` 只在 `<Controller>` 内使用 `fieldState.error`
- [ ] 表单提交统一用 `form.handleSubmit(fn)` 而非 `Form onFinish`
- [ ] Modal/Drawer 的 `open` 状态用独立的 `useState` 管理
- [ ] 批量操作表单用 `undefined` 表示"不修改"，`''` 表示"清空"

---

## 附录：组件映射表（shadcn → antd）

| shadcn | antd | 说明 |
|--------|------|------|
| `Button variant="outlined"` | `Button` | antd 无 outlined |
| `Button variant="ghost"` | `Button type="text"` | |
| `Dialog` | `Modal` | |
| `Select` | `Select` | 用 Controller |
| `Input` | `Input` | |
| `Input type="number"` | `InputNumber` | |
| `Form` | `Form` | 必须配合 Controller |
| `Card` | `Card` | |
| `Table` | `Table` | |
| `Tabs` | `Tabs` | |
| `Badge` | `Badge` | |
| `Tag` | `Tag` | |
| `DropdownMenu` | `Dropdown` | |
| `Popover` | `Popover` / `Tooltip` | |
| `Avatar` | `Avatar` | |
| `Progress` | `Progress` | |
| `Skeleton` | `Skeleton` | |
| `Alert` | `Alert` | |
| `Toast` | `sonner toast` | 项目用 sonner |

---

_本文档随项目迭代持续更新_
