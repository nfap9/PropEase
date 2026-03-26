# Phase 1: 工程基础设施与数据层规范化 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 01-engineering-infrastructure
**Areas discussed:** CI 门禁策略

---

## CI 门禁策略

| Option | Description | Selected |
|--------|-------------|----------|
| lint + type-check + test | 覆盖代码质量、类型安全、业务逻辑三大维度 | |
| 只 lint + type-check | 不强制测试通过，适合快速迭代期 | ✓ |
| 全部都要 + e2e | 最严格，适合希望 zero regression 的团队 | |

**User's choice:** 只 lint + type-check
**Notes:** Phase 1 重点是基础设施规范化，不需要过度工程化

---

## 测试覆盖率要求

| Option | Description | Selected |
|--------|-------------|----------|
| >70% | 平衡工程质量和迭代速度 | ✓ |
| 无强制要求 | 只要求测试存在，不卡百分比 | |
| 100% 强制 | 所有文件、所有分支必须被测试覆盖 | |

**User's choice:** >70%
**Notes:** 覆盖率作为目标维护，但 CI 不强制运行测试

---

## 合并策略

| Option | Description | Selected |
|--------|-------------|----------|
| block PR 合并 | CI 必须全部通过才能 merge | ✓ |
| 只发警告不阻塞 | CI 失败仍可合并，需要人工 override | |
| 可配置是否强制 | 由开发者自行决定是否开启强制模式 | |

**User's choice:** block PR 合并
**Notes:** 最标准的团队实践

---

## 触发时机

| Option | Description | Selected |
|--------|-------------|----------|
| PR 时执行 | push 时自动跑，只管 PR 质量 | ✓ |
| PR + pre-commit hook | 本地也拦截，适合强制的代码规范 | |
| 手动触发 | 不自动跑，开发者自觉执行 | |

**User's choice:** PR 时执行
**Notes:** 不依赖本地 pre-commit hook

---

## Claude's Discretion

- 空状态组件的具体文案和展示形式
- 具体哪些文件/路由存在 mock 数据需要 scouted 后确定
- CI 具体工具选择（GitHub Actions / 其他）
- API 契约一致性检测的具体实现方式

## Deferred Ideas

None — discussion stayed within phase scope
