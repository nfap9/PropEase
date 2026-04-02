# Apartment Ultra Agent 工作指南

本文件是项目级入口，面向在仓库内执行任务的 AI Agent。

---

## 一、模块入口（必读）

**在开始任何开发任务前，先阅读目标模块的 AGENTS.md**：

| 模块 | 文档 | 职责 |
|------|------|------|
| 后端 API | [`api/AGENTS.md`](./api/AGENTS.md) | Express/TypeScript，数据库层、service/repository 分层 |
| 租户端 | [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md) | Next.js，租户端 UI（端口 3000） |
| 运营后台 | [`admin-web/AGENTS.md`](./admin-web/AGENTS.md) | Next.js，平台运营管理（端口 3001） |
| E2E 测试 | [`e2e/AGENTS.md`](./e2e/AGENTS.md) | Playwright，集成测试规范 |
| 移动端 | [`mobile/AGENTS.md`](./mobile/AGENTS.md) | Expo/React Native（实验性） |

每个子模块 AGENTS.md 包含该模块的目录结构、分层约定、专属命令等详细信息。

---

## 二、全局命令速查

### 开发启动

```bash
pnpm install                              # 安装依赖
cd docker && docker compose -f docker-compose.middleware.yaml up -d  # 启动中间件
pnpm --filter apartment-ultra-api exec prisma db push  # 同步数据库 schema
pnpm dev:api                              # 启动后端（端口 8000）
pnpm dev:web                              # 启动租户端（端口 3000）
pnpm dev:admin                            # 启动运营后台（端口 3001）
```

### 构建与质量检查

```bash
pnpm build          # 全量构建
pnpm lint           # 全局 lint（api + 两个前端）
pnpm format         # 格式化代码（prettier）
pnpm format:check   # 检查格式化
pnpm type-check     # 全局类型检查
pnpm test           # 全局测试（api unit + 两个前端）
```

### 单模块命令

```bash
# API
pnpm --filter apartment-ultra-api run build
pnpm --filter apartment-ultra-api run lint
pnpm --filter apartment-ultra-api run lint:fix
pnpm --filter apartment-ultra-api run type-check
pnpm --filter apartment-ultra-api run test           # watch 模式
pnpm --filter apartment-ultra-api run test:watch
pnpm --filter apartment-ultra-api exec prisma studio

# 前端
pnpm --filter apartment-ultra-tenant run lint
pnpm --filter apartment-ultra-tenant run type-check
pnpm --filter apartment-ultra-tenant run test:run     # 单次运行
pnpm --filter apartment-ultra-admin run test:run

# 单个测试文件
pnpm --filter apartment-ultra-api exec vitest run src/services/apartment.test.ts
pnpm --filter apartment-ultra-tenant exec vitest run components/__tests__/LeaseCard.test.tsx
```

### E2E 测试

```bash
pnpm test:e2e           # 运行所有 E2E
pnpm test:e2e:ui        # UI 模式
pnpm test:e2e:headed     # 有头模式
pnpm test:e2e:chromium   # 仅 chromium
pnpm test:e2e:report     # 查看报告
```

---

## 三、代码风格（全局约定）

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

- 使用 Prettier，两个空格缩进，单引号，trailing comma

### API 错误处理

成功：`{ code: 0, data, message }`
错误：`{ code, message, data?: { errors?: [{ field, message }] } }`

### 前端组件导出

优先使用命名导出，避免默认导出。

---

## 四、后端分层约定

- `services/`：业务规则、权限校验、流程编排；**禁止**在 service 内直接写 Prisma 查询
- `repositories/`：封装 Prisma 读写，通过 `createXxxRepository(prisma)` 注入
- 事务处理：在 service 内使用 `prisma.$transaction`

详见 [`api/AGENTS.md`](./api/AGENTS.md)

---

## 五、Agent 工作规则

1. **先读再改**：修改前先阅读目标模块 AGENTS.md、目标文件、相邻文件
2. **改动收口**：功能限制在正确模块内，优先编辑已有文件
3. **复用优先**：能复用现有工具/客户端/schema 时，不重复造轮子
4. **中文协作**：Agent 回复、新增文档、界面文案统一使用中文
