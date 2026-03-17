# Mobile 开发指南

本文件适用于 `mobile/` 下的 Expo 客户端开发。

## 当前定位

`mobile/` 当前按实验性原型包治理：

- 已纳入 `pnpm workspace`
- 已提供独立开发入口与最小 `type-check`
- 暂未并入根级 `pnpm lint` / `pnpm type-check` / `pnpm test`

在共享层方案稳定前，移动端的目标是保持“可启动、可类型检查、和现有后端契约一致”，而不是追求完整功能覆盖。

## 开发约定

- 修改前先检查 `mobile/services/api/` 与 `packages/api-contract/`，确保字段和认证流与后端一致。
- 当前认证只支持密码登录/注册，不要在移动端新增短信验证码假实现。
- 如果需要沉淀跨端复用，优先推动共享包方案，不要直接复制 Web 端实现。
- 保持所有界面文案使用中文。

## 常用命令

```bash
pnpm dev:mobile
pnpm type-check:mobile
```

## 相关边界

- 根 `README.md` 负责说明项目启动入口。
- 根 `CLAUDE.md` 负责项目级 Agent 规则。
- 本文件负责说明移动端当前阶段的维护方式与限制。

## 后续关联

- 共享 API client：Issue `#35`
- monorepo 工程收敛：Issue `#38`
- 根脚本与 CI 治理：Issue `#40`
