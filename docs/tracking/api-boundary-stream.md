# 后端分层试点流

## 当前状态

- 状态：已完成
- 对应 issue：`#37`

## 覆盖范围

- `#37 [api] 统一服务层与仓储层职责边界`

## 已完成结果

- `api/AGENTS.md` 已写明统一分层规则：
  - service 负责业务编排与错误语义
  - repository 负责 Prisma 读写
  - 事务内通过 `createXxxRepository(tx)` 组装仓储
- `apartment` 试点已完成：
  - `apartment.service.ts` 通过 repository 注入访问数据
  - 房间统计逻辑沉淀在 repository 辅助函数
  - service 测试以 mock repository 为主
- `subscription` 试点已完成：
  - 服务产品、订阅、订单查询已统一收敛到 `subscription.repo.ts`
  - `subscription.service.ts` 通过 repository 注入访问数据
  - 对应 service / repository 测试已补齐
- 事务型流程已完成试点：
  - `createPersonalOrgWithFreePlan.ts`
  - `fulfillSubscription.ts`
  这两处都改成在事务内组装 repository，而不是在 service 中混用事务对象和裸 Prisma

## 当前边界

- 当前只完成 `apartment` 与 `subscription` 两个试点模块
- 通知、账单、租客触达等近期波动较大的模块未在本轮继续展开

## 验证结果

- `pnpm --filter apartment-ultra-api run test`
- `XDG_CACHE_HOME=/tmp/prisma-cache pnpm type-check`

## 沉淀结论

- 后续模块继续按“repository 注入 + 事务内组装仓储”的模式推进
- 单元测试优先 mock repository，避免把 Prisma 细节泄漏到 service 测试里
