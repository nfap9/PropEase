# Web 前端开发指南

本文件适用于 `tenant-web/` 下的租户端前端开发。

## 必读文档

**通用规范**：[`docs/frontend-conventions.md`](../docs/frontend-conventions.md) — 技术栈、项目结构、命名规范、app/features 职责划分等统一约定。

本文件仅记录 tenant-web 特有的开发约定。

## 额外依赖

- `@radix-ui/react-switch`（其他项目可能没有）

## 本地开发

```bash
pnpm dev:web    # 启动租户端，端口 3000
```

## 组件位置

| 组件 | 位置 |
|------|------|
| 设置相关 | `components/settings/` |