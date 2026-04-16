## 项目概况

Apartment Ultra 是一个公寓管理产品，核心能力包括：

- 房源、公寓、房间、租客、租约管理
- 账单、水电和报表
- 平台运营、服务定价、商店配置与订阅能力

原始业务背景保留在 [`docs/原始需求.md`](./docs/原始需求.md)。它是历史输入，不一定逐项等于当前实现。

## 仓库结构

- `api/`：当前唯一在用的后端，Node/Express/TypeScript，端口 `8000`
- `tenant-web/`：租户端前端，Vite + React Router，默认端口 `3000`
- `admin-web/`：运营后台前端，Vite + React Router，默认端口 `3001`
- `packages/api-contract/`：接口契约相关共享包
- `packages/web-api-client/`：前端 API 客户端（Axios + TanStack Query 封装）
- `packages/shared-ui/`：共享 UI 组件
- `docs/`：长期说明、规范、测试用例、设计稿
- `docker/`：本地中间件和部署相关配置

## 默认开发流程

**重要规则：修改任何子目录代码前，先阅读对应目录下的 `AGENTS.md`**。

- 后端 API：[`api/AGENTS.md`](./api/AGENTS.md)
- 租户端 Web：[`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- 运营后台：[`admin-web/AGENTS.md`](./admin-web/AGENTS.md)
- E2E 测试：[`e2e/AGENTS.md`](./e2e/AGENTS.md)

## 代码风格

### TypeScript

- 严格模式，**禁止使用 `any`**
- Props 和 API 响应必须定义类型
- 使用 Zod 做运行时校验

## 语言要求

- Agent 回复使用中文
- 新增或维护的项目文档使用中文
- 用户界面文本使用中文