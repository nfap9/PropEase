# 运营后台开发指南

## 适用范围

本文件适用于 `admin-web/` 下的运营后台前端开发。

## 目标

运营后台面向平台运营人员，负责：

- 平台概览
- 品牌配置
- 运营账号与角色管理
- 组织管理
- 服务定价
- 商店配置
- 按量定价
- 订阅管理

## 技术栈

- Next.js 14（App Router）
- TypeScript（strict）
- shadcn/ui + Radix UI
- Tailwind CSS
- TanStack Query
- React Hook Form + Zod

## 开发约定

- 所有界面文本使用中文。
- 组件文件使用 `kebab-case.tsx`。
- 与 API 直接对应的字段名保持 `snake_case`。
- 页面级数据请求优先通过 `lib/api/admin-client.ts` 统一封装。
- 状态变更后优先使用 Query Invalidation，而不是手动拼接缓存。

## 文档职责

- 本文件负责“运营后台如何开发”。
- 根 [README](../README.md) 负责“项目如何启动”。
- [docs/README.md](../docs/README.md) 负责“项目有哪些文档、分别做什么”。

## 常用命令

```bash
pnpm dev:admin
pnpm --filter apartment-ultra-admin run type-check
pnpm --filter apartment-ultra-admin run test:run
```

## 目录要点

- `src/app/`：页面路由
- `src/components/`：可复用 UI 与业务组件
- `src/lib/api/admin-client.ts`：运营后台 API 客户端
- `src/lib/constants/`：状态与权限等前端常量

## 相关文档

- [仓库总览](../README.md)
- [文档总览](../docs/README.md)
- [命名规范](../docs/naming-conventions.md)
- [API 契约说明](../docs/api-contract/README.md)
