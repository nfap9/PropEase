# Shared Hooks

这几个 hooks 用来抽离项目里高频重复的 UI 状态逻辑，优先解决下面几类场景：

- 弹窗、抽屉、浮层的开关控制
- 列表页中的“当前选中项”
- CRUD 页面里“选中项 + 当前动作弹窗”的组合状态

## 导出方式

可以直接从共享包引入：

```tsx
import { useAsyncDialogSubmit, useConfirmAction, useDisclosure, useListFilters, useManagedItem, usePageQueryState, useSelection } from '@apartment-ultra/shared-ui';
```

也可以按 hooks 子路径引入：

```tsx
import { useAsyncDialogSubmit, useConfirmAction, useDisclosure, useListFilters, useManagedItem, usePageQueryState, useSelection } from '@apartment-ultra/shared-ui/hooks';
```

## useAsyncDialogSubmit

适用场景：

- 表单弹窗、确认弹窗、抽屉提交成功后的统一收尾
- 需要把“关闭弹层 + reset 表单 + 清空选中项”收敛成一个回调
- 页面里已经出现多处类似的 mutation `onSuccess`

示例：

```tsx
const paymentSubmit = useAsyncDialogSubmit({
  close: () => setIsPaymentOpen(false),
  reset: () => paymentForm.reset(getDefaultPaymentValues()),
  clear: () => setSelectedBill(null),
});

const paymentMutation = useMutation({
  mutationFn: payBill,
  onSuccess: paymentSubmit.handleSuccess,
});
```

建议：

- 它只负责成功后的 UI 收尾，不负责请求和错误处理
- 如果成功回调还需要展示提示或消费返回值，优先放进 `afterSuccess`
- 适合“收尾流程稳定”的弹层；如果每个弹层成功逻辑差异很大，不必强行抽

## usePageQueryState

适用场景：

- 需要把筛选条件同步到 URL 的列表页
- 分类、状态、标签页等轻量 query state
- Next App Router 的 client 页面

示例：

```tsx
const statusQuery = usePageQueryState({
  queryKey: 'status',
  defaultValue: 'all' as const,
  parse: (value) => (value === 'paid' || value === 'pending' ? value : 'all'),
  serialize: (value) => (value === 'all' ? null : value),
});

statusQuery.value;
statusQuery.setValue('paid');
```

建议：

- 它只管理单个 query state，筛选对象本身依然建议配合 `useListFilters`
- 默认使用 `replace`，更适合筛选切换；只有确实需要保留历史时再用 `push`
- 这是一个依赖 `next/navigation` 的 hook，只适用于 Next App Router client 组件

## useListFilters

适用场景：

- 列表页中的筛选对象
- 需要支持“单字段更新 / 局部合并 / 重置”的页面
- 已经开始频繁出现 `setState((prev) => ({ ...prev, ... }))`

示例：

```tsx
const filters = useListFilters(getDefaultLeaseFilters);

filters.setFilter('keyword', 'A-101');
filters.patchFilters({ apartmentId: 'apt_1', keyword: '张三' });
filters.resetFilters();
```

建议：

- 只把“筛选对象本身”放进这个 hook，查询、URL、接口参数转换继续留在业务层
- 如果页面只有一个简单输入框，没有完整筛选对象，不必强行使用它

## useConfirmAction

适用场景：

- 删除、停用、终止、移除成员等确认弹层
- 页面里存在 `selectedItem + isDeleteOpen`
- 一个确认动作只对应一个当前目标项

示例：

```tsx
const deleteConfirm = useConfirmAction<User>();

deleteConfirm.openFor(user);

<ConfirmDialog
  {...deleteConfirm.dialogProps}
  onConfirm={() => deleteUser(deleteConfirm.selectedItem!.id)}
/>
```

建议：

- 它只负责确认 UI 状态，不负责异步 mutation 和提示信息
- 如果页面里同时存在多种动作弹层，且共用一个选中项，优先考虑 `useManagedItem`

## useDisclosure

适用场景：

- `Dialog` / `Sheet` / `Popover` 的打开关闭
- 面板展开收起
- 任意布尔状态切换

示例：

```tsx
const dialog = useDisclosure();

<Button onClick={dialog.open}>打开</Button>
<Dialog open={dialog.isOpen} onOpenChange={dialog.setOpen}>
  ...
</Dialog>
```

建议：

- 只有一个布尔状态时，优先使用它
- 如果页面里出现多组 `isXxxOpen / setIsXxxOpen`，可以先评估是否适合升级为 `useManagedItem`

## useSelection

适用场景：

- 当前选中的表格行
- 当前编辑中的对象
- 当前查看详情的实体

示例：

```tsx
const selection = useSelection<AdminUser>();

selection.select(user);
selection.clear();
```

建议：

- 当页面只需要“记录当前对象”，不需要管理多个动作弹窗时，用它最直接
- 如果同时还要管理 `edit/delete/detail` 之类动作，优先考虑 `useManagedItem`

## useManagedItem

适用场景：

- 用户列表、计划列表、账单列表等后台管理页面
- 同时存在 `create / edit / delete / detail / reset` 等动作
- 页面里已经开始出现多组 `useState(false)` 和一个 `selectedXxx`

典型替换前：

```tsx
const [isCreateOpen, setIsCreateOpen] = useState(false);
const [isEditOpen, setIsEditOpen] = useState(false);
const [isDeleteOpen, setIsDeleteOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
```

替换后：

```tsx
type UserDialogAction = 'create' | 'edit' | 'delete';

const dialogState = useManagedItem<AdminUser, UserDialogAction>();
```

完整示例：

```tsx
type UserDialogAction = 'create' | 'edit' | 'delete';

const dialogState = useManagedItem<AdminUser, UserDialogAction>();

const columns = createAdminUsersColumns({
  onEdit: (user) => dialogState.openFor('edit', user),
  onDelete: (user) => dialogState.openFor('delete', user),
});

<Button onClick={() => dialogState.openAction('create')}>新建账号</Button>

<CreateUserDialog
  {...dialogState.dialogProps('create')}
  onSubmit={handleCreate}
/>

<EditUserDialog
  {...dialogState.dialogProps('edit')}
  user={dialogState.selectedItem}
  onSubmit={handleEdit}
/>

<DeleteUserDialog
  {...dialogState.dialogProps('delete')}
  user={dialogState.selectedItem}
  onConfirm={handleDelete}
/>
```

建议：

- `openAction(action)` 用于不需要选中项的动作，例如 `create`
- `openFor(action, item)` 用于依赖当前对象的动作，例如 `edit/delete/detail`
- 异步操作成功后，统一调用 `dialogState.close()`，这样会同时关闭弹窗并清空选中项

## 选型建议

- 只有开关状态：`useDisclosure`
- 只有当前选中项：`useSelection`
- 既有选中项，又有多个动作弹窗：`useManagedItem`
