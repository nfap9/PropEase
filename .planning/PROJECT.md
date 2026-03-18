# Apartment Ultra Web 测试

## What This Is

为 Apartment Ultra 的 Web 端（租户端和运营后台）添加测试覆盖，包括 E2E 测试和页面级测试。目标是确保核心业务流程的稳定性和可靠性。

## Core Value

**核心业务流程稳定运行** — 租户和运营人员的关键操作流程（如登录、公寓管理、账单）必须经过测试验证。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **TEST-01**: 搭建测试框架（Playwright + Vitest）
- [ ] **TEST-02**: 租户端核心流程 E2E 测试
- [ ] **TEST-03**: 运营后台核心流程 E2E 测试
- [ ] **TEST-04**: 关键页面组件测试

### Out of Scope

- 非核心页面的测试覆盖
- 性能测试
- 视觉回归测试
- CI 集成

## Context

**现有测试状态：**
- 后端已有 Vitest 单元测试（`api/src/**/*.test.ts`）
- 前端目前无测试覆盖
- 项目使用 Playwright（已在 `e2e/` 目录）

**技术栈：**
- E2E: Playwright
- 单元/组件: Vitest + React Testing Library
- 已安装 Playwright 浏览器

## Constraints

- **工具限制**: 使用现有 Playwright 基础设施
- **范围**: 核心业务流程优先
- **执行**: 本地运行，暂不集成 CI

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 使用 Playwright | 项目已有配置，快速上手 | — Pending |
| 核心流程优先 | 最大化投资回报率 | — Pending |
| 本地运行 | 当前无需 CI，先验证可行性 | — Pending |

---
*Last updated: 2026-03-18 after initialization*
