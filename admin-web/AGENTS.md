# 运营后台开发指南

本文件适用于 `admin-web/` 下的运营后台前端开发。

## 必读文档

**通用规范**：[`docs/frontend-conventions.md`](../docs/frontend-conventions.md) — 技术栈、项目结构、命名规范、app/features 职责划分等统一约定。

本文件仅记录 admin-web 特有的开发约定。

## 运营后台职责

面向平台运营人员，负责：

- 平台概览
- 品牌配置
- 运营账号与角色管理
- 组织管理
- 服务定价
- 商店配置
- 按量定价
- 订阅管理

## 本地开发

```bash
pnpm dev:admin     # 启动运营后台，端口 3001
pnpm --filter apartment-ultra-admin run type-check
pnpm --filter apartment-ultra-admin run test:run
```

## 目录要点

- `src/app/`：页面路由
- `src/components/`：可复用 UI 与业务组件
- `src/lib/api/admin-client.ts`：运营后台 API 客户端
- `src/lib/constants/`：状态与权限等前端常量
- `test/`：E2E 测试辅助文件

## 相关文档

- [仓库总览](../README.md)
- [文档总览](../docs/README.md)
- [命名规范](../docs/naming-conventions.md)
- [API 契约说明](../docs/api-contract/README.md)
