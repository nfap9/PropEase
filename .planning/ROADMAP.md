# Roadmap: Apartment Ultra Web Testing

**Created:** 2026-03-18
**Core Value:** 核心业务流程稳定运行

## Phase Summary

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | 测试框架搭建 | 配置 Playwright + Vitest 环境 | 3 | 6 |
| 2 | 租户端 E2E | 完成租户端核心流程测试 | 6 | 8 |
| 3 | 运营后台 E2E | 完成运营后台核心流程测试 | 4 | 6 |
| 4 | 组件测试 | 完成关键组件测试 | 3 | 4 |

---

## Phase 1: 测试框架搭建

**Goal:** 配置 Playwright + Vitest 测试环境，创建测试工具函数

**Requirements:**
- TEST-01: 配置 Playwright E2E 测试环境
- TEST-02: 配置 Vitest 单元/组件测试环境
- TEST-03: 创建测试工具函数（登录、API Mock、数据清理）

**Success Criteria:**
1. `pnpm test:e2e` 可以运行 Playwright 测试
2. `pnpm test` 可以运行 Vitest 测试
3. 测试配置文件正确（playwright.config.ts, vitest.config.ts）
4. 登录辅助函数可用
5. API Mock 工具可用
6. 测试数据清理机制可用

---

## Phase 2: 租户端 E2E 测试

**Goal:** 完成租户端核心业务流程的 E2E 测试覆盖

**Requirements:**
- TE2E-01: 用户登录流程测试（手机号+密码）
- TE2E-02: 用户注册流程测试
- TE2E-03: 公寓管理 CRUD 测试
- TE2E-04: 房间管理测试
- TE2E-05: 租客/租约管理测试
- TE2E-06: 账单生成与查看测试

**Success Criteria:**
1. 登录测试通过
2. 注册测试通过
3. 公寓创建/编辑/删除测试通过
4. 房间创建/编辑/删除测试通过
5. 租客创建/编辑测试通过
6. 租约创建/终止测试通过
7. 账单生成测试通过
8. 账单查看测试通过

---

## Phase 3: 运营后台 E2E 测试

**Goal:** 完成运营后台核心业务流程的 E2E 测试覆盖

**Requirements:**
- AE2E-01: 运营账号登录测试
- AE2E-02: 组织管理测试
- AE2E-03: 订阅管理测试
- AE2E-04: 服务定价管理测试

**Success Criteria:**
1. 运营登录测试通过
2. 组织列表/创建/编辑测试通过
3. 订阅查看/修改测试通过
4. 定价查看/修改测试通过

---

## Phase 4: 组件测试

**Goal:** 完成关键前端组件的单元/集成测试

**Requirements:**
- COMP-01: 关键表单组件测试
- COMP-02: 表格组件测试
- COMP-03: 权限守卫组件测试

**Success Criteria:**
1. 表单组件测试通过
2. 表格组件测试通过
3. 权限守卫组件测试通过

---

## Execution Notes

- **Parallelization:** Phase 内独立测试可以并行执行
- **Mode:** Interactive - 每完成一个测试文件确认结果
- **Verification:** 每个 success criteria 需要实际运行测试验证

---
*Roadmap created: 2026-03-18*
