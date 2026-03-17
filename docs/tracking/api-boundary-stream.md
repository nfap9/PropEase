# 后端分层试点流

## 覆盖范围

- `#37 [api] 统一服务层与仓储层职责边界`

## 当前判断

- 这条流可以与“共享层收敛流”并行推进。
- 但试点模块不应选择近期正在频繁变动的通知、账单、租客触达相关代码。

## 推荐试点模块

- 第一优先：`apartment`
- 第二优先：`subscription`

选择理由：

- 这两个模块都存在 service 直接依赖 Prisma 的情况
- 与 `#28` 的租客触达链路重合较少
- 重构后更容易沉淀成可复制的 repository / transaction 模式

## 本流边界

- 只做 1 到 2 个模块试点
- 不追求一次性清空全部 direct Prisma import
- 重点输出：
  - service / repository 职责规则
  - 事务注入模式
  - 单测替身写法

## 阻塞与风险

- 如果没有先选试点模块，这张 issue 会迅速膨胀成全局重构
- 如果试点选到通知 / 账单 / 租客链路，会与 `#28` 产生不必要冲突

## 下一步动作

1. 盘点 `api/src/services/` 中 direct Prisma import 的模块清单
2. 先固定试点为 `apartment` + `subscription`
3. 先写分层规则，再做代码迁移

## 完成信号

- 试点模块中的 service 不再直接 import Prisma
- 对应单测主要 mock repository，而不是 mock Prisma
- `api/AGENTS.md` 补上统一分层说明
