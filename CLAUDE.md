# AGENTS.md

## 项目概述

Apartment Ultra 是一个可商用的公寓管理系统应用，目标用户是承包公寓进行运营收租的管理者（二房东）；支持公寓、房间、水电、租约、租客、账单管理；还有运营平台支持商业化运营；

本仓库为 **pnpm workspaces monorepo**：根目录有 `pnpm-workspace.yaml` 与单一 `pnpm-lock.yaml`，依赖在根目录执行 `pnpm install` 安装。

代码库分为：

- **后端 api** (`/api`): Node/Express/TypeScript 应用，**项目运行与调试均使用此后端**
- **前端 Web** (`/web`): Next.js 应用，使用 TypeScript 和 React
- **Docker 部署** (`/docker`): 容器化部署配置（构建上下文为仓库根，后端为 api）

## 后端工作流

- 阅读 `api/AGENTS.md` 了解详情
- 本地：`pnpm run dev:api`（端口 8000）或 `pnpm run dev:local` 一键起前后端；依赖在根目录 `pnpm install`
- 代码质量：`pnpm run lint` / `pnpm run type-check` / `pnpm run test` 默认针对 api + 前端

## 前端工作流

- 阅读 `web/AGENTS.md` 了解详情

## 测试与质量实践

- 遵循 TDD: 红 → 绿 → 重构
- 后端（api）使用 Vitest
- 强制使用强类型；避免 `Any`/`any`，优先使用显式类型注解
- 编写自文档化代码；仅在需要解释意图时添加注释

## 语言风格

- **Python**: 在函数和属性上保持类型提示，实现相关的特殊方法（如 `__repr__`, `__str__`）
- **TypeScript**: 使用严格配置，依赖 ESLint（优先使用 `pnpm lint:fix`）加上 `pnpm type-check`，避免 `any` 类型

## 通用实践

- 优先编辑现有文件；仅在请求时添加新文档
- 通过构造函数注入依赖，保持清晰的架构边界
- 在正确的层级使用领域特定异常处理错误

## 项目约定

- 后端架构遵循分层架构和清洁架构原则
- 前端用户界面字符串必须使用中文；避免硬编码英文文本
- **命名**：API 契约与前后端命名规范见 [docs/naming-conventions.md](docs/naming-conventions.md)（API/DB 用 snake_case，前端类型与 API 一致用 snake_case，前端局部变量用 camelCase）

## 语言要求

**重要**: 本项目所有文档和交流使用中文。

- AI 助手必须使用中文回答问题和编写文档
- 提交信息可使用中英文
- 用户界面文本使用中文

## 项目进度

项目计划存放在 /docs/plans 中