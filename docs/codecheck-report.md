# Apartment Ultra 代码检查报告

依据 [CLAUDE.md](../CLAUDE.md)、[api/AGENTS.md](../api/AGENTS.md)、[web/AGENTS.md](../web/AGENTS.md) 及 [docs/naming-conventions.md](naming-conventions.md) 等规范，对仓库进行完整 Code Check 后的专业报告。

---

## 1. 概述

| 项目 | 说明 |
|------|------|
| **检查日期** | 2025-03-02 |
| **范围** | 全仓库：api（Node/Express/TS）、web（Next.js 14）、packages/api-contract、docker、e2e |
| **方法** | 静态分析（lint / type-check / build / audit）、代码规范抽样、安全与架构阅读、测试执行 |
| **环境** | Node v24.13.1，pnpm 10.29.3；命令在仓库根目录执行 |

---

## 2. 执行摘要

| 维度 | 状态 | 说明 |
|------|------|------|
| ESLint | **通过** | api + web 无错误与警告 |
| TypeScript | **通过** | api + web 类型检查通过 |
| 单元测试 | **通过** | api 37 个、web 21 个，共 58 个用例全部通过 |
| 构建 | **通过** | api-contract、api、web 构建成功 |
| 依赖审计 | **待改进** | 6 个漏洞（4 high / 2 moderate），见下文 |
| 代码规范 | **待改进** | 2 处 `any` 使用（已 eslint-disable）；少量英文 UI 文案 |
| 安全与架构 | **通过** | 认证/组织隔离一致，无原始 SQL，错误契约符合文档 |

**优先建议（3–5 条）**

1. **依赖**：修复或缓解 `pnpm audit` 报告的高危项（xlsx、next、glob），或文档化接受风险与缓解措施。
2. **类型**：将 `web/src/lib/api/client.ts` 与 `web/src/app/reports/page.tsx` 中的 `any` 替换为契约类型或精确类型，并移除 eslint-disable。
3. **CI**：将 E2E（Playwright）纳入 CI 或定期流水线，并考虑将 `pnpm audit --audit-level=high` 设为失败即阻断（当前为 continue-on-error）。
4. **前端 UI 语言**：将可发现的英文文案（如 Sidebar、Close、Slug）改为中文或确认为可接受例外（如 sr-only、字段名）。
5. **api**：在 ESLint 中显式启用 `@typescript-eslint/no-explicit-any`（warn/error），防止新增 `any`。

---

## 3. 静态分析结果

### 3.1 ESLint

- **命令**：`pnpm run lint`（api + 前端）
- **结果**：通过，无错误、无警告。
- **说明**：与 CI 一致；api 使用 `eslint src --ext .ts`，web 使用 `next lint --fix`。

### 3.2 TypeScript 类型检查

- **命令**：`pnpm run type-check`（api + 前端）
- **结果**：通过。
- **说明**：api 使用 `tsc --noEmit`（strict + noUnusedLocals 等），web 使用 Next.js 的 `tsc --noEmit`。

### 3.3 构建

- **命令**：`pnpm run build`（`pnpm -r run build`，api-contract → api → web）
- **结果**：通过。api-contract 与 api 为 `tsc`，web 为 `next build`，30 个页面/路由生成成功。

### 3.4 依赖审计

- **命令**：`pnpm audit --audit-level=high`
- **结果**：发现 6 个漏洞（4 high，2 moderate），退出码 1。

| 严重程度 | 包 | 路径 | 说明 |
|----------|----|------|------|
| high | xlsx | web>xlsx | Prototype Pollution（<0.19.3 受影响）；ReDoS（<0.20.2 受影响） |
| high | glob | web>eslint-config-next>@next/eslint-plugin-next>glob | 10.2.0–10.5.0 以下存在命令注入风险 |
| high | next | web>next | 13.0.0–15.0.8 以下 RSC 反序列化可能导致 DoS |
| moderate | （见 audit 输出） | — | 2 个 moderate 项 |

**说明**：CI 中同一命令使用 `continue-on-error: true`，当前未阻断流水线。建议在修复或确认接受风险后，将 audit 设为失败即阻断。

---

## 4. 代码规范

### 4.1 禁止 any

项目要求避免 `any`。当前存在 2 处，均带有 `eslint-disable-next-line @typescript-eslint/no-explicit-any`：

| 文件 | 行 | 内容 | 建议 |
|------|----|------|------|
| [web/src/lib/api/client.ts](../web/src/lib/api/client.ts) | 130 | `response.data as any` | 使用 api-contract 或后端约定的响应类型（如 `ApiResponse<T>`）替代 |
| [web/src/app/reports/page.tsx](../web/src/app/reports/page.tsx) | 253 | Recharts `label={({ name, percent }: any) => ...}` | 使用 Recharts 提供的类型（如 `TooltipProps` 或对应 payload 类型）定义参数类型 |

建议在替换为具体类型后移除上述 eslint-disable。

### 4.2 命名规范

- **API / 数据库**：路径参数、查询参数、请求/响应体使用 **snake_case**。抽查 `api/src/routes` 与 Zod schema，`org_id`、`organization_id`、`full_name`、`created_at`、`apartment_id` 等与 [naming-conventions.md](naming-conventions.md) 一致。
- **前端**：与 API 一致的字段使用 snake_case；`web/src/lib/api` 中 `org_id`、`created_at`、`full_name`、`organization_id` 等与契约一致。局部变量与参数为 camelCase，符合约定。

**结论**：命名规范符合文档，无需整改。

### 4.3 前端 UI 语言

项目要求用户界面使用中文。抽样发现以下英文文案：

| 位置 | 内容 | 说明 |
|------|------|------|
| [web/src/components/ui/sidebar.tsx](../web/src/components/ui/sidebar.tsx) | `Sidebar`（SheetTitle） | 建议改为「侧边栏」或确认为组件库默认 |
| [web/src/components/ui/dialog.tsx](../web/src/components/ui/dialog.tsx) | `Close`（sr-only） | 可访问性文案，可改为「关闭」 |
| [web/src/components/ui/sheet.tsx](../web/src/components/ui/sheet.tsx) | `Close`（sr-only） | 同上 |
| [web/src/app/admin/organizations/[id]/page.tsx](../web/src/app/admin/organizations/[id]/page.tsx) | `Slug` | 字段标签，可改为「短标识」或保留技术术语并文档说明 |

建议统一检查 `web/src` 下用户可见字符串，确保除合理例外外均为中文。

### 4.4 ESLint 配置

- **api**：使用 `@typescript-eslint/recommended`，未显式配置 `@typescript-eslint/no-explicit-any`（recommended 中为 warn）。建议在 [api/.eslintrc.cjs](../api/.eslintrc.cjs) 中显式设置 `'@typescript-eslint/no-explicit-any': 'error'`，与项目「避免 any」要求一致。
- **web**：使用 `next/core-web-vitals` 与 `next/typescript`，已包含 TypeScript 与 no-explicit-any 相关规则；两处 any 已通过行内 disable 处理。

---

## 5. 安全

### 5.1 环境与密钥

- [api/src/config.ts](../api/src/config.ts) 通过 `process.env` 读取配置，敏感项均提供默认值（如 `SECRET_KEY`、`DATABASE_URL`、微信支付相关变量）。
- **建议**：在部署文档或 README 中明确列出生产环境必须覆盖的变量（如 `SECRET_KEY`、`DATABASE_URL`、`ADMIN_INIT_PASSWORD`、微信支付相关），并说明默认值仅用于开发。

### 5.2 认证与鉴权

- **控制台用户**：v1 业务路由统一使用 `requireConsoleAuth`（[api/src/middlewares/requireAuth.ts](../api/src/middlewares/requireAuth.ts)），未认证返回 401。
- **组织隔离**：需要组织的路由通过 `requireOrgMembership`（[api/src/utils/orgContext.ts](../api/src/utils/orgContext.ts)）从 `params`、`query.org_id` 或 header `x-org-id` 解析组织 ID，并校验当前用户为该组织成员，否则 400/403。
- **运营后台**：`/api/v1/admin` 下使用 `requireAdmin`（[api/src/middlewares/requireAdmin.ts](../api/src/middlewares/requireAdmin.ts)），仅允许 admin JWT。

抽查 apartments、leases、bills、organizations、subscriptions、customRoles、reports、tenants、utilities、permissions 等路由，均正确挂载上述中间件，组织相关操作均调用 `requireOrgMembership`。**结论**：认证与组织隔离实现一致，符合预期。

### 5.3 注入与 ORM

- 代码库中未使用 `$queryRaw`、`$executeRaw` 或 `Prisma.sql`，数据访问均通过 Prisma 类型化 API，**SQL 注入风险低**。

### 5.4 依赖

- 见 **3.4 依赖审计**。建议优先处理 high 级别项（xlsx、next、glob 等），并在文档中记录决策（升级/替换/接受风险）。

---

## 6. 测试

### 6.1 单元测试

| 子项目 | 框架 | 文件数 | 用例数 | 结果 |
|--------|------|--------|--------|------|
| api | Vitest | 7 | 37 | 全部通过 |
| web | Vitest | 2 | 21 | 全部通过 |

- **api**：覆盖 constants、permissionDefaults、security、jwt、appError、responseWrapper、errorHandler 等。
- **web**：覆盖 admin-permissions、form 等工具与常量。
- **命令**：`pnpm run test`。web 另提供 `pnpm --filter frontend run test:coverage`，可定期查看覆盖率趋势。

### 6.2 E2E

- **工具**：Playwright；用例位于 [e2e/](../e2e/)（auth、dashboard、admin、admin.guest、business 等 5 个 spec）。
- **运行**：`pnpm run test:e2e`（需 API 与可选 E2E 种子用户）。
- **CI**：当前 [.github/workflows/ci.yml](../.github/workflows/ci.yml) **未**包含 E2E 步骤。建议将 E2E 纳入 CI 或单独定期流水线，并文档化运行前置条件（如 `SEED_E2E_USER=true` 的 API）。

### 6.3 小结

- 单元测试全部通过，与 CI 一致。E2E 未在 CI 中运行，属改进项。

---

## 7. 架构与可维护性

### 7.1 后端分层

- **现状**：api 采用 Express 路由 + 中间件 + utils（如 appError、jwt、orgContext、context）；业务逻辑多写在 route handler 内，未单独拆出 service/repository 层。
- **文档**：CLAUDE.md 要求「后端架构遵循分层架构和清洁架构原则」。当前实现为「路由+工具」风格，与严格分层有差距。
- **建议**：若后续业务复杂度上升，可逐步将核心逻辑抽到 service 层，便于单测与复用；非强制，可随迭代推进。

### 7.2 依赖注入

- **文档**：CLAUDE 要求「通过构造函数注入依赖」。
- **现状**：api 中 Prisma 等以单例（如 `prisma`）或直接导入方式使用，未采用构造函数注入。
- **结论**：与文档描述存在差异，属可维护性改进方向，不影响本次「通过」结论。

### 7.3 错误处理

- 统一使用 [api/src/utils/appError.ts](../api/src/utils/appError.ts) 与 [api/src/middlewares/errorHandler.ts](../api/src/middlewares/errorHandler.ts)；错误响应格式符合 [docs/api-contract/README.md](api-contract/README.md)（code、message、data.errors 等），与契约一致。

### 7.4 api-contract

- 前后端共用 `@apartment-ultra/api-contract`，类型与契约集中维护；api 的 errorHandler、responseWrapper、constants 等与 web 的 client、types 均引用该包。CI 与本地构建均先构建 api-contract，再构建 api/web。
- **说明**：api-contract 的 package.json 中无 `lint` 脚本，仅含 `build` 与 `type-check`；若需统一代码风格，可后续为其增加 lint。

---

## 8. 文档与 CI

### 8.1 文档

- 关键文档齐全：CLAUDE.md、api/AGENTS.md、web/AGENTS.md、docs/naming-conventions.md、docs/api-contract/README.md、docs/功能描述.md、docs/测试用例.md、[docs/测试用例-实现排查报告.md](测试用例-实现排查报告.md)。
- 实现排查报告已对 API 与测试用例做了逐项对照，可作为功能与契约一致性的参考。

### 8.2 CI

- **流水线**：[.github/workflows/ci.yml](../.github/workflows/ci.yml) 包含：
  - **build-contract**：安装依赖、`pnpm audit --audit-level=high`（continue-on-error）、构建 api-contract、缓存并上传 artifact。
  - **api**：恢复 api-contract、Prisma generate、lint、type-check、test。
  - **frontend**：恢复 api-contract、lint、type-check、test:run、build（含 `NEXT_PUBLIC_API_URL`）。
  - **docker**：仅 push 到 main 时构建并推送到 GHCR。
- **改进点**：E2E 未在 CI 中运行；`pnpm audit` 使用 continue-on-error，高危漏洞不会导致失败。建议见 **2. 执行摘要**。

---

## 9. 附录

### 9.1 检查命令清单

```bash
pnpm run lint          # ESLint（api + web）
pnpm run type-check    # TypeScript（api + web）
pnpm run test          # 单元测试（api + web）
pnpm run build         # 全量构建
pnpm audit --audit-level=high  # 依赖审计
```

### 9.2 问题与建议汇总（按类型）

| 类型 | 位置/描述 | 建议 |
|------|-----------|------|
| any | web/src/lib/api/client.ts:130 | 使用契约响应类型替代 `as any` |
| any | web/src/app/reports/page.tsx:253 | 使用 Recharts 类型替代回调参数 any |
| 英文 UI | sidebar/dialog/sheet 中 Sidebar、Close | 改为中文或确认例外 |
| 英文 UI | admin/organizations/[id] 中 Slug | 改为「短标识」或文档说明 |
| ESLint | api 未显式 no-explicit-any | 在 api/.eslintrc.cjs 中设为 error |
| 依赖 | xlsx、next、glob 等 high | 升级/替换或文档化接受风险 |
| CI | E2E 未运行 | 纳入 CI 或单独定期流水线 |
| CI | pnpm audit continue-on-error | 修复后改为失败即阻断 |
| 文档 | 生产环境敏感配置 | 在部署文档中列出必须覆盖的变量 |

### 9.3 参考文档

- [CLAUDE.md](../CLAUDE.md)
- [api/AGENTS.md](../api/AGENTS.md)
- [web/AGENTS.md](../web/AGENTS.md)
- [docs/naming-conventions.md](naming-conventions.md)
- [docs/api-contract/README.md](api-contract/README.md)
- [docs/测试用例-实现排查报告.md](测试用例-实现排查报告.md)

---

## 10. 修复记录（后续落实）

针对本报告中的问题，已完成以下修复：

| 类型 | 处理 |
|------|------|
| **any** | [web/src/lib/api/client.ts](../web/src/lib/api/client.ts) 使用 `RawApiPayload`、`SuccessBody` 等契约类型替代 `any`；[web/src/app/reports/page.tsx](../web/src/app/reports/page.tsx) 的 Recharts `label` 使用 `{ name?: string; percent?: number }`，并移除 eslint-disable。 |
| **英文 UI** | [sidebar.tsx](../web/src/components/ui/sidebar.tsx) 改为「侧边栏」/「移动端侧边栏」；[dialog.tsx](../web/src/components/ui/dialog.tsx)、[sheet.tsx](../web/src/components/ui/sheet.tsx) 的 sr-only 改为「关闭」；[admin/organizations/[id]/page.tsx](../web/src/app/admin/organizations/[id]/page.tsx) 的 Slug 改为「短标识」。 |
| **ESLint** | [api/.eslintrc.cjs](../api/.eslintrc.cjs) 中增加 `'@typescript-eslint/no-explicit-any': 'error'`。 |
| **依赖** | 前端移除存在高危漏洞的 `xlsx`，改用 `exceljs`；[BatchImportDialog](../web/src/app/utilities/components/BatchImportDialog.tsx) 的导出/解析逻辑已切换为 exceljs。Next.js、glob 仍为传递依赖/主框架升级项，暂保留并可在后续升级 Next 15 时一并处理。 |
| **CI** | [.github/workflows/ci.yml](../.github/workflows/ci.yml) 新增 **E2E** 任务：PostgreSQL 服务、Prisma 同步、启动 API（SEED_E2E_USER=true）、构建并启动前端、Playwright 运行 E2E。`pnpm audit` 仍为 continue-on-error（因 next/glob 仍有 high），待升级或接受风险后再改为失败即阻断。 |
| **文档** | [README.md](../README.md) 新增「生产环境部署」小节，列出必须覆盖的环境变量（DATABASE_URL、SECRET_KEY、ADMIN_INIT_PASSWORD、CORS_ORIGINS 及微信支付相关）。 |
