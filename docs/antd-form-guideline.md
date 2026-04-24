# Ant Design Form 规范

> 本项目统一使用 antd `Form` 组件进行表单管理，**禁止与 react-hook-form 混用**。

---

## 一、基本用法

### 1.1 创建表单

```tsx
import { Form, Input, Button } from 'antd';

const [form] = Form.useForm();

// JSX
<Form form={form} layout="vertical" onFinish={onFinish}>
  <Form.Item name="fieldName" label="标签" rules={[{ required: true, message: '...' }]}>
    <Input />
  </Form.Item>
  <Button htmlType="submit">提交</Button>
</Form>
```

### 1.2 获取值 & 校验

```tsx
// 校验并获取值
form.validateFields().then((values) => {
  // values 是校验通过的表单数据
  doSubmit(values);
}).catch((errorInfo) => {
  // 校验失败
});

// 获取所有值（不校验）
const values = form.getFieldsValue();

// 获取单个值
const name = form.getFieldValue('fieldName');

// 设置字段值
form.setFieldsValue({ fieldName: 'new value' });

// 重置表单
form.resetFields();
```

---

## 二、校验规则（rules）

### 2.1 必填

```tsx
rules={[{ required: true, message: '请输入内容' }]}
```

### 2.2 字符串长度

```tsx
rules={[{ min: 2, max: 20, message: '长度在 2-20 个字符' }]}
```

### 2.3 正则校验

```tsx
rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}
```

### 2.4 数字范围

```tsx
rules={[{ type: 'number', min: 0, message: '不能为负数' }]}
```

### 2.5 交叉校验（如同字段依赖）

使用 `validator` + `getFieldValue`：

```tsx
<Form.Item
  name="confirm_password"
  dependencies={['password']}
  rules={[
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value || getFieldValue('password') === value) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('两次密码不一致'));
      },
    }),
  ]}
/>
```

> 注意：`dependencies` 声明依赖字段，确保被依赖字段变化时触发重新校验。

### 2.6 自定义异步校验

```tsx
rules={[
  {
    validator: async (_, value) => {
      if (!value) return Promise.reject(new Error('请输入'));
      const exists = await checkFieldExists(value);
      if (exists) return Promise.reject(new Error('该值已存在'));
      return Promise.resolve();
    },
  },
]}
```

---

## 三、初始值

### 3.1 组件 mount 时的初始值

**方式一：通过 `defaultFieldValue` / `initialValue`（仅首次生效）**

```tsx
<Form.Item name="field" initialValue="默认值">
```

> `initialValue` 只在表单初始化时生效，之后必须用 `setFieldsValue` 更新。

**方式二：用 `setFieldsValue` 在 useEffect / dialog open 时设置**

```tsx
useEffect(() => {
  if (open && initialData) {
    form.setFieldsValue(initialData);
  }
}, [open, initialData]);
```

### 3.2 resetFields 会清除所有值

如果需要在 reset 后恢复默认值，使用 `setFieldsValue` 配合空对象：

```tsx
form.resetFields(); // 全部清空，包括 initialValue
form.setFieldsValue({ field: 'default' }); // 重新设默认值
```

---

## 四、DatePicker 处理

antd `DatePicker` 返回 **Dayjs 对象**，提交前必须格式化为字符串：

```tsx
import dayjs from 'dayjs';

const onFinish = (values) => {
  const data = {
    ...values,
    date: values.date?.format('YYYY-MM-DD'),      // 单个日期
    start_date: values.start_date?.format('YYYY-MM-DD'),
    end_date: values.end_date?.format('YYYY-MM-DD'),
  };
  doSubmit(data);
};
```

合并两个日期字段时同样处理：

```tsx
<Form.Item name="contract_start" label="合同开始">
  <DatePicker style={{ width: '100%' }} />
</Form.Item>

// 提交时
const contract_start = form.getFieldValue('contract_start')?.format('YYYY-MM-DD');
```

---

## 五、表单作为 props 传递

### 5.1 Dialog 自管理 form（推荐）

**原则：Dialog 内部创建并管理自己的 form，不从父组件传入。**

```tsx
interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}

export function CreateDialog({ open, onOpenChange, onSubmit, isPending }: CreateDialogProps) {
  const [form] = Form.useForm();

  // 每次 open 重置
  useEffect(() => {
    if (open) form.resetFields();
  }, [open]);

  const handleSubmit = () => {
    form.validateFields().then(onSubmit);
  };

  return (
    <Modal open={open} onCancel={() => onOpenChange(false)}>
      <Form form={form}>
        <Form.Item name="field" rules={[...]}>
          <Input />
        </Form.Item>
      </Form>
      <Button onClick={handleSubmit} loading={isPending}>提交</Button>
    </Modal>
  );
}
```

**父组件不传 form prop**。通过 `key={id}` 强制重新挂载来重置状态：

```tsx
<CreateDialog
  key={isOpen ? 'open' : 'closed'}  // 重新挂载 = 自动 reset
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSubmit}
  isPending={mutation.isPending}
/>
```

### 5.2 需要暴露方法给父组件（forwardRef）

当父组件需要主动调用子表单的 `validate` / `getValues` 时，使用 `forwardRef` + `useImperativeHandle`：

```tsx
import { forwardRef, useImperativeHandle } from 'react';

export interface MyFormRef {
  validate: () => Promise<void>;
  getValues: () => Record<string, unknown>;
  setFieldsValue: (values: Record<string, unknown>) => void;
}

export const MyFormSection = forwardRef<MyFormRef>((props, ref) => {
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    validate: () => form.validateFields(),
    getValues: () => form.getFieldsValue(),
    setFieldsValue: (values) => form.setFieldsValue(values),
  }));

  return (
    <Form form={form}>
      {/* ... */}
    </Form>
  );
});
```

---

## 六、Wizard / 多步骤表单

每个步骤用独立的 form 或独立的 section ref，通过父组件协调：

```tsx
const step1Ref = useRef<Step1Ref>();
const step2Ref = useRef<Step2Ref>();
const step3Ref = useRef<Step3Ref>();

const handleSubmit = async () => {
  try {
    await step1Ref.current!.validate();
    await step2Ref.current!.validate();
    await step3Ref.current!.validate();
    // 所有步骤校验通过
    const data = {
      ...step1Ref.current!.getValues(),
      ...step2Ref.current!.getValues(),
      ...step3Ref.current!.getValues(),
    };
    submit(data);
  } catch {}
};
```

---

## 七、常用组件校验配置

### Input

```tsx
<Form.Item
  name="name"
  rules={[
    { required: true, message: '请输入' },
    { min: 2, max: 50, message: '长度在 2-50 个字符' },
  ]}
>
  <Input placeholder="请输入" />
</Form.Item>
```

### InputNumber

```tsx
<Form.Item
  name="amount"
  rules={[{ type: 'number', min: 0, message: '不能为负' }]}
>
  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
</Form.Item>
```

### Select

```tsx
<Form.Item
  name="role"
  rules={[{ required: true, message: '请选择角色' }]}
>
  <Select placeholder="请选择">
    <Select.Option value="admin">管理员</Select.Option>
  </Select>
</Form.Item>
```

### DatePicker

```tsx
<Form.Item
  name="start_date"
  rules={[{ required: true, message: '请选择开始日期' }]}
>
  <DatePicker style={{ width: '100%' }} />
</Form.Item>
```

---

## 八、误区 & 常见错误

| 误区 | 正确做法 |
|------|----------|
| `form.reset()` | → `form.resetFields()` |
| `initialValue` 更新后表单值不更新 | → 用 `form.setFieldsValue()` 在 useEffect 中更新 |
| `DatePicker` 直接提交 | → `.format('YYYY-MM-DD')` 转换为字符串 |
| 在 RHF 的 `Controller` 里用 antd 组件 | → 统一用 antd Form，不再用 RHF |
| 在同一个表单混用两种 form 方案 | → 整个项目只用 antd Form |

---

## 九、已废弃

以下模式已废弃，请勿在新代码中使用：

- ❌ `import { useForm } from 'react-hook-form'`
- ❌ `import { Controller } from 'react-hook-form'`
- ❌ `import { zodResolver } from '@hookform/resolvers/zod'`
- ❌ `form.handleSubmit` → 改用 `form.validateFields().then(...)`
- ❌ `form.reset(values)` → 改用 `form.resetFields()` + `form.setFieldsValue(values)`

---

## 十、相关文件

- 表单工具函数：`src/utils/form.ts`
- 账单 schema（提供默认值）：`packages/api-contract/src/schemas/bills.ts`
- 房间布局选项：`packages/api-contract/src/schemas/apartment-detail.ts`
