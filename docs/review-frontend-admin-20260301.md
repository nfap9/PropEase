# 前端代码审查：运营 Admin 相关

审查范围：当前分支相对 main 的前端改动（运营角色、运营账号、权限设置页及相关组件）。  
审查依据：`web/AGENTS.md`、Vercel Web Interface Guidelines、项目约定（中文 UI、强类型、单一职责）。

---

## 1. 总体评价

- **架构**：角色页拆分为列表、详情、创建弹窗、删除弹窗，职责清晰，符合「保持组件职责单一」。
- **类型**：`AdminUser` / `AdminRole` 的 `is_system` 与 API 一致；无 `any`，类型完整。
- **中文**：界面文案均为中文，加载/提交态使用「…」符合规范。
- **一致性**：角色与账号侧对「系统预置不可删除」的处理一致（列表隐藏删除、弹窗内提示并隐藏确认按钮）。

---

## 2. 按文件审查

### 2.1 `web/src/app/admin/roles/page.tsx`

- **状态与数据流**：`draftPermissionCodes` 随 `selectedRole` 的 `id`/`permissions` 同步，未保存离开即丢弃，逻辑正确。
- **effect 依赖**：`useEffect(() => setDraftPermissionCodes(selectedRole?.permissions ?? []), [selectedRole?.id, selectedRole?.permissions])` 依赖完整，避免闭包旧值。
- **防御性**：`handleSave` / `handleDeleteConfirm` 均判断 `selectedRole?.is_system`，与列表侧 `handleDeleteRole` 中 `if (role.is_system) return` 双重保护，合理。
- **骨架屏**：加载时用 Skeleton 占位，与布局一致（左侧 56、右侧 flex-1）。
- **建议**：`rolesLoading` 为 true 时仍会渲染下方 `AdminRoleList` 等（因 return 在 if 里），当前结构正确；若未来在 loading 时也挂载子组件，需注意子组件对 `roles=[]` 的兼容（当前已用 `roles = []` 默认值）。

### 2.2 `web/src/app/admin/users/page.tsx`

- **is_system**：表格操作列 `show: !row.original.is_system` 隐藏删除；删除弹窗内根据 `selectedUser?.is_system` 展示「不可删除」并隐藏确认按钮，与后端「系统预置账号不可删除」一致。
- **类型**：`AdminUser` 在 `admin-client` 中 `is_system?: boolean`，与 API 可选字段一致；表格与弹窗使用处已做可选链与布尔判断。
- **无障碍**：编辑弹窗内「启用」使用原生 `<input type="checkbox">` 配 `FormControl`/`FormLabel`，可考虑为 input 设 `id` 并与 `FormLabel` 的 `htmlFor` 关联，以扩大可点击区域并符合「Labels clickable」。
- **文案**：删除确认使用「删除中…」、提交使用「提交中…」「保存中…」，符合 Typography 规则。

### 2.3 `web/src/components/admin/admin-role-list.tsx`

- **键盘与焦点**：列表项为 `role="button"` + `tabIndex={0}`，`onKeyDown` 处理 Enter/Space，符合「Interactive elements need keyboard handlers」；样式有 `hover:`，建议为可聚焦项增加 `focus-visible:ring-*` 或等价可见焦点样式（见下方 Guidelines）。
- **图标按钮**：删除为 icon-only，已提供 `aria-label={\`删除角色 ${role.name}\`}`，符合「Icon-only buttons need aria-label」。
- **事件**：删除按钮 `onClick` 内 `e.stopPropagation()`，避免触发行选择，逻辑正确。

### 2.4 `web/src/components/admin/admin-role-detail-panel.tsx`

- **只读**：`readOnly = role.is_system` 控制权限勾选禁用与保存按钮展示，与业务一致。
- **空状态**：无角色时展示「请从左侧选择一个角色」，中文且明确。
- **保存按钮**：带文案「保存」与图标，非纯图标，无需额外 aria-label；加载态「保存中…」符合规范。

### 2.5 `web/src/components/admin/admin-role-create-dialog.tsx`

- **表单**：角色名称必填，Zod 校验；权限由父组件受控传入，职责清晰。
- **重置**：`useEffect` 在 `open` 时 `form.reset({ name: '' })`，避免上次名称残留；`createPermissionCodes` 在父组件 `onSuccess` 与 `useEffect([isCreateOpen])` 中清空，行为一致。
- **DialogContent**：`max-h-[90vh] overflow-y-auto` 可考虑加 `overscroll-behavior: contain`，避免弹窗内滚动链到背景（见 Guidelines）。

### 2.6 `web/src/components/admin/admin-role-delete-dialog.tsx`

- **系统角色**：根据 `role?.is_system` 展示不同文案并仅在非系统时渲染确认按钮，与角色页、账号页删除逻辑一致。
- **类型**：`AdminRole | null` 明确；`role?.name` 在 `isSystemRole` 为 true 时仍可能为 undefined，展示「角色「」不可删除」可接受（通常调用方不会对系统角色打开删除弹窗）。

### 2.7 `web/src/components/admin/admin-permission-checkbox-group.tsx`

- **受控**：`value` + `onToggle` 受控，`idPrefix` 区分多实例，避免 id 冲突。
- **标签**：每个 Checkbox 有 `id={\`${idPrefix}-${opt.code}\`}`，对应 `label` 的 `htmlFor`，符合「Labels clickable」。
- **分组标题**：「权限」与各分组标题为 `<p>`，若需更强语义可考虑 `<h3>`/`role="group"` + `aria-labelledby`（非必须）。

### 2.8 `web/src/app/admin/roles/utils.ts`

- **togglePermissionCode**：与「全部权限」互斥（选 * 清空其它，选其它清空 *），逻辑清晰；纯函数易测。

### 2.9 `web/src/lib/api/admin-client.ts`

- **AdminUser**：`is_system?: boolean` 与后端一致；注释「系统预置账号不可删除」有助于维护。
- **AdminRole**：`is_system: boolean` 必选，与角色 API 一致。

### 2.10 `web/src/app/settings/permissions/page.tsx`（diff 内改动）

- **文案与布局**：标题区改为 flex 响应式、说明文案细化（「为…配置可执行的操作」「仅所有者可修改」）、Badge 与无权限/所有者状态文案更清晰，符合「用户界面字符串使用中文」与可读性。
- **权限展示**：使用 `permission.name` 或「资源+操作」中文，不暴露权限码，合理。

---

## 3. Web Interface Guidelines 检查（按规则简要对照）

### Accessibility

- **Icon-only buttons**：`admin-role-list.tsx` 删除按钮已有 `aria-label` ✓  
- **Form controls**：权限勾选组、创建角色表单均有 label / FormLabel ✓  
- **Keyboard**：角色列表项有 `onKeyDown`（Enter/Space）✓  
- **语义**：角色列表用 `<ul>`/`<li>`，详情区可用 `<main>`（当前为 main 标签）✓  

### Focus States

- **admin-role-list.tsx**：列表项为 div+role=button+tabIndex，缺少可见焦点环。建议为可聚焦的列表项增加 `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` 或与设计系统一致的 focus 样式。

### Forms

- **Placeholders**：创建角色「如：运营专员」可视为示例模式；Guidelines 建议 placeholder 以「…」结尾，可选改为「如：运营专员…」。
- **Submit / loading**：提交中按钮 disabled、文案「提交中…」「保存中…」✓  

### Typography

- 使用「…」而非 "..." ✓  

### Content Handling

- 角色名 `truncate`，长列表可滚动 ✓  
- 空状态有占位文案 ✓  

### Navigation & State

- 删除操作均有确认弹窗 ✓  

### 其他

- **Modal/Dialog**：`DialogContent` 若需防止滚动链，可加 `overscroll-behavior: contain`（视 shadcn Dialog 实现而定）。
- **admin-role-edit-dialog.tsx**：该组件存在但未在 `roles/page.tsx` 中引用，当前流程为「列表 + 详情面板内保存」。若为历史遗留或预留，建议注明或移除以避免死代码。

---

## 4. 建议与可改进点（按优先级）

1. **列表项焦点样式**（admin-role-list）：为 `role="button"` 的列表项增加 `focus-visible:ring-*`（或与 Button 一致的 focus 样式），满足 Focus States 要求。
2. **编辑弹窗复选框**（users/page）：为「启用」checkbox 的 input 设置 `id`，并与 FormLabel 的 `htmlFor` 关联，扩大可点击区域并符合无障碍。
3. **Dialog 滚动**：若弹窗内容较长，在 `DialogContent` 上增加 `overscroll-behavior: contain`（在确认与现有样式无冲突后）。
4. **AdminRoleEditDialog**：若确定不使用，可从代码库移除或加注释说明保留原因，避免误用或混淆。
5. **Placeholder**（可选）：新建角色名称 placeholder 可改为「如：运营专员…」以完全符合 Guidelines。

---

## 5. 结论

- 本次审查的前端代码符合项目约定（中文、类型、职责划分），与后端 `is_system` 行为一致，角色与账号的「系统预置不可删除」体验统一。
- 需小幅改进的主要是：角色列表项可见焦点样式、用户编辑表单中「启用」复选框的 label 关联；其余为可选优化与死代码清理建议。
