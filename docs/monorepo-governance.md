# Monorepo 共享工程配置说明

本文件记录当前 workspace 的共享工程约束，避免新模块重复复制配置。

## 当前共享配置

- 根 `tsconfig.base.json`
  作用：放所有 TypeScript 项目都应遵守的通用严格模式与解析规则。
- 根 `tsconfig.nextjs.json`
  作用：供 `tenant-web/`、`admin-web/` 这类 Next.js 应用复用。
- 根 `tsconfig.react-package.json`
  作用：供 `packages/shared-ui/` 这类 React 包复用。
- 根 `.eslintrc.next.json`
  作用：供所有 Next.js 应用统一继承，避免每个应用复制同一份规则。
- 根 `package.json > pnpm.overrides`
  作用：把跨 workspace 的核心前端依赖版本收敛到一处维护。

## 当前模块如何继承

- `tenant-web/`、`admin-web/`
  - `tsconfig.json` 继承 `../tsconfig.nextjs.json`
  - `.eslintrc.json` 继承 `../.eslintrc.next.json`
- `packages/shared-ui/`
  - `tsconfig.json` 继承 `../../tsconfig.react-package.json`
- `api/`、`packages/api-contract/`
  - `tsconfig.json` 继承根 `tsconfig.base.json`
  - 各自补充 Node/构建相关设置
- `mobile/`
  - 继续继承 Expo 官方基础配置
  - 当前不并入根聚合质量门

## 新增应用或包时怎么做

### 新增 Next.js 应用

1. `tsconfig.json` 继承根 `tsconfig.nextjs.json`
2. 在本地 `compilerOptions.paths` 里只保留本应用需要的 alias
3. `.eslintrc.json` 继承根 `.eslintrc.next.json`
4. 如需新增公共依赖版本，优先先改根 `pnpm.overrides`

### 新增 React 共享包

1. `tsconfig.json` 继承根 `tsconfig.react-package.json`
2. 仅在包内部补充 `baseUrl`、`paths`、`include`
3. 若依赖已在 `tenant-web/`、`admin-web/`、`packages/shared-ui/` 重复出现，优先更新根 `pnpm.overrides`

### 新增 Node 包

1. `tsconfig.json` 至少继承根 `tsconfig.base.json`
2. 包内自行声明 `module`、`moduleResolution`、`outDir`、`rootDir`
3. 如果是运行时代码，避免继承浏览器相关 lib 配置

## 依赖治理原则

- 跨多个 workspace 复用的核心依赖，优先在根 `pnpm.overrides` 统一版本。
- 应用私有依赖仍留在各自 `package.json`，不要盲目上提到根目录。
- 若某个模块需要刻意偏离共享版本，必须在对应 issue 或 PR 中说明原因。

## 质量门边界

- 根 `pnpm lint` / `pnpm type-check` / `pnpm test` 当前覆盖：
  - `api`
  - `tenant-web`
  - `admin-web`
- `mobile/` 继续使用独立入口：
  - `pnpm dev:mobile`
  - `pnpm type-check:mobile`

## 维护约定

- 共享配置变更时，优先更新本文件，再更新具体模块。
- 如果某个模块无法继续复用共享配置，不要直接复制一份新配置；先判断是否应该新增新的根级共享配置。
