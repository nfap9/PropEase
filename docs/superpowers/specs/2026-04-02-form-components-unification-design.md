# 前端表单组件统一设计

## 目标

统一 tenant-web 和 admin-web 的表单组件来源，移除本地 `src/components/ui/` 副本，全部从 `@apartment-ultra/shared-ui` 导入。

## 当前问题

1. tenant-web 和 admin-web 各有本地 `src/components/ui/` 副本
2. Label/FormLabel 组件的 `required` 属性支持不一致（tenant-web 不支持）
3. 组件导入来源混乱，部分从 shared-ui，部分从本地副本

## 实施方案

### Phase 1：审计
1. 扫描 tenant-web 和 admin-web 本地 `src/components/ui/` 中的所有组件
2. 对比 shared-ui 中已存在的组件
3. 标记缺失组件（需要新建到 shared-ui）

### Phase 2：补充 shared-ui
1. 如有 shared-ui 缺失的组件，新建到 `packages/shared-ui/src/components/ui/`
2. 确保 shared-ui 的 Label 和 FormLabel 支持 `required` 属性

### Phase 3：迁移 tenant-web
1. 将 tenant-web 中对 `@/components/ui` 的引用改为 `@apartment-ultra/shared-ui`
2. 验证表单功能正常

### Phase 4：迁移 admin-web
1. 同 tenant-web

### Phase 5：清理
1. 删除 tenant-web 的 `src/components/ui/` 目录
2. 删除 admin-web 的 `src/components/ui/` 目录

## 验收标准

- 所有表单组件都从 `@apartment-ultra/shared-ui` 导入
- 表单功能（输入、选择、日期、验证）正常工作
- `required` 属性在所有项目中一致显示红色星号
