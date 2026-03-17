# CLAUDE.md

本文件面向在本仓库内执行任务的 AI Agent。目标不是介绍项目背景，而是帮助 Agent 更快进入正确上下文、减少误改、提高一次性交付成功率。

## 先看什么

处理任何任务时，默认按下面顺序建立上下文：

1. 看根目录 [README.md](./README.md)，确认项目结构、启动方式和当前入口文档。
2. 看 [docs/README.md](./docs/README.md)，确认这次任务涉及的文档类型和权威来源。
3. 修改具体模块前，先看该模块自己的 `AGENTS.md`。
4. 如果功能行为发生变化，再同步看 `docs/测试用例/` 下对应业务文档。

不要只依赖本文件做判断。`CLAUDE.md` 负责项目级规则，不替代模块级说明。

## 模块入口

当前仓库是 `pnpm workspaces` monorepo，常见模块与入口如下：

- 后端 API：[`api/AGENTS.md`](./api/AGENTS.md)
- 租户端 Web：[`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- 运营后台：[`admin-web/AGENTS.md`](./admin-web/AGENTS.md)
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
- `mobile/`：Expo/React Native 客户端
- `packages/api-contract/`：接口契约相关共享包
- `packages/shared-ui/`：共享 UI 组件
- `docs/`：长期说明、规范、测试用例、设计稿
- `docker/`：本地中间件和部署相关配置

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
```

如无特殊说明，所有前端和测试都以 `api/` 作为后端。

## Agent 工作规则

### 1. 先读再改

- 修改任何模块前，先阅读目标文件、相邻文件和模块 `AGENTS.md`。
- 不要跳过现有注释、类型定义和目录约定。
- 如果发现当前文档与代码不一致，优先以代码和运行结果为准，再回补文档。
- 处理 GitHub Issue 的创建、整理、拆分或补充时，优先遵循 [`.claude/skills/issue-management/SKILL.md`](./.claude/skills/issue-management/SKILL.md)。

### 2. 改动要收口

- 功能改动尽量限制在正确模块内，不要跨层随意泄漏逻辑。
- 优先编辑已有文件，只有在确实缺失载体时再新增文件。
- 能复用现有工具函数、客户端、schema、测试夹具时，不要重复造轮子。

### 3. 文档和测试要一起维护

- 任何影响业务行为、页面文案、流程入口或接口契约的变更，都要检查是否需要同步：
  - `docs/测试用例/`
  - 模块 `AGENTS.md`
  - `README.md` / `docs/README.md`
  - `packages/api-contract/` 或相关契约说明
- 不要求每次都新增文档，但不能让已有文档继续误导后续 Agent 或开发者。

### 4. 完成标准要明确

默认认为一次任务完成，至少要满足：

- 代码改动已经落地，而不是只停留在分析
- 相关类型、导入、引用关系完整
- 受影响的测试、类型检查或最小必要验证已经执行
- 如果文档已因改动失真，文档已同步更新

## 质量标准

- 使用 TypeScript 严格模式，避免 `any`
- API、数据库、请求/响应字段统一使用 `snake_case`
- 前端局部变量、函数参数使用 `camelCase`
- 前端界面文案统一使用中文
- 优先写自解释代码；仅在“意图不明显”时加简短注释

命名规范统一见 [`docs/naming-conventions.md`](./docs/naming-conventions.md)。

## 测试与验证

- 后端优先遵循 TDD 思路，测试框架为 Vitest
- E2E 使用 Playwright，动手前先看 [`e2e/AGENTS.md`](./e2e/AGENTS.md)
- 常用检查命令：
  - `pnpm lint`
  - `pnpm type-check`
  - `pnpm test`

如果任务只改文档或纯元数据，可以不跑完整测试，但要明确说明验证范围。

## 文档分工

为了让 Agent 快速判断“该改哪里”，这里给出最小分工原则：

- `README.md`：新同学入口，讲项目是什么、怎么启动
- `CLAUDE.md`：项目级 Agent 规则，讲怎么安全高效地做事
- 模块 `AGENTS.md`：模块内部开发约定，讲这个目录该怎么改
- `docs/测试用例/`：业务预期和人工验收场景
- `docs/api-contract/`：统一契约说明
- `docs/ui-design/`：设计参考和历史原型，不是代码真相
- `PROGRESS.md`：当前高层状态摘要

## 语言要求

本项目默认使用中文协作：

- Agent 回复使用中文
- 新增或维护的项目文档使用中文
- 用户界面文本使用中文
- 提交信息可按实际需要使用中英文

## 当前任务来源

长期说明在 `docs/`，当前状态摘要见 `PROGRESS.md`，具体工作项以 GitHub Issues / PR 为准。

Issue 编写与使用规范见 [`docs/issue-management.md`](./docs/issue-management.md)。
