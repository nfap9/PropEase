# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本文件面向在本仓库内执行任务的 AI Agent。目标不是介绍项目背景，而是帮助 Agent 更快进入正确上下文、减少误改、提高一次性交付成功率。

**重要规则：修改任何子目录代码前，先阅读对应目录下的 `AGENTS.md`**。


## 模块入口

当前仓库是 `pnpm workspaces` monorepo，常见模块与入口如下：

- 后端 API：[`api/AGENTS.md`](./api/AGENTS.md)
- 租户端 Web：[`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- 运营后台：[`admin-web/AGENTS.md`](./admin-web/AGENTS.md)
- 移动端：[`mobile/AGENTS.md`](./mobile/AGENTS.md)
- E2E 测试：[`e2e/AGENTS.md`](./e2e/AGENTS.md)
- 项目文档导航：[`docs/README.md`](./docs/README.md)

如果某个目录暂时没有 `AGENTS.md`，先参考相邻模块文档与 `docs/README.md`，必要时顺手补齐说明。

## 项目概况

Apartment Ultra 是一个公寓管理产品，核心能力包括：

- 房源、公寓、房间、租客、租约管理
- 账单、水电和报表
- 平台运营、服务定价、商店配置与订阅能力

原始业务背景保留在 [`docs/原始需求.md`](./docs/原始需求.md)。它是历史输入，不一定逐项等于当前实现。

## 仓库结构

- `api/`：当前唯一在用的后端，Node/Express/TypeScript
- `tenant-web/`：租户端前端，Next.js，默认端口 `3000`
- `admin-web/`：运营后台前端，Next.js，默认端口 `3001`
- `mobile/`：实验性 Expo/React Native 客户端，当前按单独质量门治理
- `packages/api-contract/`：接口契约相关共享包
- `packages/shared-ui/`：共享 UI 组件
- `docs/`：长期说明、规范、测试用例、设计稿
- `docker/`：本地中间件和部署相关配置

## 常用命令

```bash
# 全局
pnpm install                              # 安装依赖
pnpm build                                # 全量构建
pnpm lint                                 # 全局 lint
pnpm format                               # 格式化（prettier）
pnpm format:check                         # 检查格式化
pnpm type-check                           # 全局类型检查
pnpm test                                 # 全局测试（api unit + 两个前端）
pnpm test:e2e                             # E2E 测试
pnpm test:e2e:ui                          # E2E UI 模式
pnpm test:e2e:headed                      # E2E 有头模式
pnpm test:e2e:report                      # 查看 E2E 报告

# 单模块命令
pnpm --filter apartment-ultra-api run build
pnpm --filter apartment-ultra-api run lint && pnpm --filter apartment-ultra-api run lint:fix
pnpm --filter apartment-ultra-api run type-check
pnpm --filter apartment-ultra-api exec prisma studio

# 单个测试文件
pnpm --filter apartment-ultra-api exec vitest run src/services/apartment.test.ts
pnpm --filter apartment-ultra-tenant exec vitest run components/__tests__/LeaseCard.test.tsx
```

## 默认开发流程

首次进入仓库或依赖变化后，优先使用这套流程：

```bash
# 1. 启动中间件
cd docker && docker compose -f docker-compose.middleware.yaml up -d

# 2. 安装依赖
pnpm install

# 3. 同步数据库 schema
pnpm --filter apartment-ultra-api exec prisma db push

# 4. 启动后端
pnpm dev:api

# 5. 启动租户端
pnpm dev:web

# 6. 启动运营后台
pnpm dev:admin

# 7. 如需维护移动端原型，再单独启动
pnpm dev:mobile
```

如无特殊说明，所有前端和测试都以 `api/` 作为后端。

## 代码风格

### TypeScript

- 严格模式，**禁止使用 `any`**
- Props 和 API 响应必须定义类型
- 使用 Zod 做运行时校验

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 数据库/API 字段 | snake_case | `full_name`, `organization_id` |
| 前端局部变量 | camelCase | `leaseId`, `isLoading` |
| 组件名 | PascalCase | `LeaseDialogs` |
| 组件文件 | kebab-case | `lease-dialogs.tsx` |
| 类型/接口 | PascalCase | `LeaseFormData` |
| 常量 | UPPER_CASE | `PERMISSIONS` |

### 导入顺序

1. Node 内置模块
2. 第三方包
3. 内部包（`@/` alias）
4. 相对导入（`./`, `../`）

### 格式化

使用 Prettier，两个空格缩进，单引号，trailing comma。

### API 错误处理

成功：`{ code: 0, data, message }`
错误：`{ code, message, data?: { errors?: [{ field, message }] } }`

### 组件导出

优先使用命名导出，避免默认导出。

## 后端分层约定

- `services/`：业务规则、权限校验、流程编排；**禁止**在 service 内直接写 Prisma 查询
- `repositories/`：封装 Prisma 读写，通过 `createXxxRepository(prisma)` 注入
- 事务处理：在 service 内使用 `prisma.$transaction`

详见 [`api/AGENTS.md`](./api/AGENTS.md)。

## Agent 工作规则

### 1. 先读再改

- 修改任何模块前，先阅读目标文件、相邻文件和模块 `AGENTS.md`。
- 不要跳过现有注释、类型定义和目录约定。

### 2. 改动要收口

- 功能改动尽量限制在正确模块内，不要跨层随意泄漏逻辑。
- 优先编辑已有文件，只有在确实缺失载体时再新增文件。
- 能复用现有工具函数、客户端、schema、测试夹具时，不要重复造轮子。

## 文档分工

- `README.md`：新同学入口，讲项目是什么、怎么启动
- `CLAUDE.md`：项目级 Agent 规则，讲怎么安全高效地做事
- 模块 `AGENTS.md`：模块内部开发约定，讲这个目录该怎么改
- `docs/测试用例/`：业务预期和人工验收场景
- `docs/api-contract/`：统一契约说明
- `docs/ui-design/`：设计参考和历史原型，不是代码真相

## 语言要求

- Agent 回复使用中文
- 新增或维护的项目文档使用中文
- 用户界面文本使用中文