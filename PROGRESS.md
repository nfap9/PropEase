# Apartment Ultra 开发进度跟踪

> 最后更新: 2026-03-17

## 当前概况

| 维度 | 状态 | 说明 |
|------|------|------|
| API | 稳定迭代 | Node.js + Express + Prisma，核心业务已完成主链路 |
| 租客端 | 稳定迭代 | Next.js 14，订阅购买、账单、公寓与租客管理已接入 |
| 运营后台 | 持续完善 | 已包含概览、组织、角色、服务定价、商店配置、订阅管理 |
| 测试 | 持续补强 | API 当前 34 个测试文件、374 个测试通过 |
| 部署 | 可用 | Docker 与 GitHub Actions 已接入，部署文档需持续维护 |

## 最近完成

### 1. 订阅体系重构

- 已完成从旧 `SubscriptionPlan` 模型向“服务定价 + 商店配置”模型迁移。
- 运营后台已具备：
  - 服务定价管理
  - 商店配置管理
  - 订阅管理
- 业务端订阅流程已接入当前订阅状态、购买、支付结果页。

### 2. 技术债清理

- 已关闭 GitHub Issue `#31`。
- 清理了服务定价模块相关生产代码中的 `as unknown as` 断言。
- 增加了统一的 Prisma JSON 输入转换工具：
  - `api/src/utils/json.ts`
- 一次性迁移脚本已迁移到：
  - `api/scripts/migrate-plans-to-services.ts`

### 3. 当前验证状态

- `pnpm --filter apartment-ultra-api run type-check` 通过
- `pnpm --filter apartment-ultra-api run test` 通过

## 当前重点模块

### 租客端

- 公寓、房间、租客、租约
- 水电记录与账单
- 订阅状态查看与套餐购买

### 运营后台

- 概览页
- 运营账号与角色
- 组织管理
- 服务定价
- 商店配置
- 按量定价
- 订阅管理

## 待持续关注

- 根 README、部署文档、测试文档要继续和页面路由、脚本命令保持同步。
- `api/scripts/migrate-plans-to-services.ts` 属于一次性历史迁移脚本，确认线上迁移完成后可考虑彻底归档或删除。
- 历史优惠活动相关说明文档已废弃，后续如果重新引入营销体系，应重新编写对应设计和测试文档。