# 后端切换为 Node/Express 执行步骤

**已执行完毕**：当前后端为 `api/`（Node/Express）。api-legacy 已删除，表结构由 Prisma schema 管理，使用 `prisma db push` 同步。

## 1. 重命名目录（已完成）

```bash
mv api api-legacy
mv api-ts api
```

## 2. 统一引用（已完成）

### 2.1 根 package.json 与 scripts

- 开发与代码质量由根目录 pnpm scripts 承担：`dev-setup`、`dev:api`、`dev:web`、`dev:local`、`lint`、`type-check`、`test` 等。
- 环境初始化与一键启动由 `scripts/dev-setup.sh`、`scripts/dev-local.sh` 等完成；Docker 相关为 `pnpm run docker:up` 等。
- 数据库表结构在 `api/` 下由 Prisma schema 定义，执行 `cd api && pnpm exec prisma db push` 同步。

### 2.2 Docker

- [docker/docker-compose.yaml](docker/docker-compose.yaml) 与 [docker/docker-compose.dev.yaml](docker/docker-compose.dev.yaml) 中 api 服务的 `build.context` 为 `../api`（Node 项目）。
- api 的 `Dockerfile` 为 Node 多阶段构建，`command` 为 `node dist/index.js`（或 `pnpm start`），端口 8000。

### 2.3 CI

- 若存在 CI，将 `backend` job 的 `working-directory` 与步骤改为对 `api/`（Node）执行 pnpm install、prisma generate、type-check、test。

### 2.4 文档与配置

- [CLAUDE.md](../CLAUDE.md)、[README.md](../README.md) 已更新为「后端为 Node/TypeScript (Express)」。

## 3. 前端

- `NEXT_PUBLIC_API_URL` 默认指向 `http://localhost:8000/api/v1`。
