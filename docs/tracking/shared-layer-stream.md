# 共享层收敛流

## 当前状态

- 状态：已完成
- 对应 issue：`#35`、`#36`

## 覆盖范围

- `#35 [packages] 提取共享 API client 包`
- `#36 [packages] 让 shared-ui 成为可独立复用的 UI 包`

## 已完成结果

### `#35`

- 已新增 `packages/web-api-client/`
- 统一了 Axios 实例创建、响应解包、`ApiError`、401 refresh 处理
- `tenant-web` 与 `admin-web` 的通用 `lib/api/client.ts` 已改为共享实现
- 双端重复的错误/表单工具已改为复用共享包导出
- 已补最小单测并通过

### `#36`

- `shared-ui` 已去除应用级 alias 依赖，可独立 type-check
- 已补齐 `components` 包入口和 `switch` 导出
- `tenant-web` / `admin-web` 首批基础 UI 已改为通过共享包消费
- 包内工具已改为直接依赖共享 API client，而非应用实现

## 当前边界

- `admin-web/src/lib/api/admin-client.ts` 继续保持后台专用实现，不纳入本轮共享
- 应用侧原有 `src/components/ui/*` 副本暂时保留，避免本轮引入大规模删除和视觉回归

## 验证结果

- 已通过 `pnpm --filter @apartment-ultra/web-api-client test:run`
- 已通过 `pnpm --filter @apartment-ultra/shared-ui type-check`
- 已通过 `pnpm --filter @apartment-ultra/shared-ui test:run`
- 已通过 `pnpm --filter apartment-ultra-tenant type-check`
- 已通过 `pnpm --filter apartment-ultra-admin type-check`
- 已通过 `pnpm lint`

## 独立阻塞

- 根级 `type-check/test` 当前被 `api` 中 tenant-reachability / config 的既有问题阻塞，不属于本追踪流收口范围
