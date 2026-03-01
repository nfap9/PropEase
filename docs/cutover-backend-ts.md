# 后端切换为 Node/Express 执行步骤

在 api-ts 与现有 Python api 并存、且验证通过后，按以下步骤执行切换。**切换前不要删除现有 api 目录。**

## 1. 重命名目录

```bash
mv api api-legacy
mv api-ts api
```

## 2. 统一引用

### 2.1 Makefile

- 所有原指向 `api/` 的 target（prepare-api、dev-api、migrate、test、lint、type-check 等）改为对当前 `api/`（即原 api-ts）执行 Node 命令。
- 删除或合并 `prepare-api-ts`、`dev-api-ts`、`lint-api-ts`、`type-check-api-ts`、`test-api-ts` 为 `prepare-api`、`dev-api` 等，实现改为在 `api/` 下执行 `pnpm install`、`pnpm dev`、`pnpm run type-check`、`pnpm run test`。
- 迁移命令改为在 `api/` 下执行 `pnpm exec prisma migrate deploy`（切换后数据库迁移仅由 Prisma 管理，不再使用 Alembic）。

### 2.2 Docker

- [docker/docker-compose.yaml](docker/docker-compose.yaml) 与 [docker/docker-compose.dev.yaml](docker/docker-compose.dev.yaml) 中 api 服务的 `build.context` 保持为 `../api`（此时已是 Node 项目）。
- api 的 `Dockerfile` 使用 [api/Dockerfile](api-ts/Dockerfile)（Node 多阶段构建）。
- `command` 改为 `node dist/index.js`（或 `pnpm start`），端口仍为 8000。

### 2.3 CI

- [.github/workflows/ci.yml](.github/workflows/ci.yml)：将原 `backend` job 的 `working-directory` 与步骤改为对 `api/`（Node）执行 pnpm install、prisma generate、type-check、test。
- 若保留 api-ts 独立 job，可改名为 backend 或与现有 backend 合并为单一 Node 后端 job；Coverage 路径若变化，需更新 Codecov 的 `files`。

### 2.4 文档与配置

- [CLAUDE.md](CLAUDE.md)、[README.md](README.md)：更新为「后端为 Node/TypeScript (Express)」。
- 原 [api/AGENTS.md](api/AGENTS.md) 由 [api-ts/AGENTS.md](api-ts/AGENTS.md) 替代（切换后即 `api/AGENTS.md`），内容为 Node 技术栈与命令说明。

## 3. 前端

- 若此前用 8001 测 api-ts，将 `NEXT_PUBLIC_API_URL` 默认改回 `http://localhost:8000/api/v1`（或保持默认即可）。

## 4. 提交与合并

- 单次提交或分两提交：先重命名 + 引用更新，再文档与 CI 微调。合并到 main。

## 5. 切换后清理（可选，后续 PR）

- 确认生产或联调环境运行 Node 版 api 无问题后，删除目录 `api-legacy/`。
- 从 CI 中移除对 `api-legacy` 的引用（若有）。
- 在 README 或文档中注明：后端仅为 Node/TypeScript，数据库迁移仅通过 Prisma 执行。

## 回退

若切换后发现问题，可再次重命名：`api` → `api-ts`，`api-legacy` → `api`，并还原 Makefile、Docker、CI 中对后端的引用，即可回到 Python 后端。
