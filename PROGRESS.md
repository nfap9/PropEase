# Apartment Ultra Progress

> Last updated: 2026-03-17
> Source of truth for scheduling: GitHub Project `apartment-ultra Roadmap`

## Current Window

当前执行窗口按 `2026-03-17` 到 `2026-03-29` 跟踪。结合最近提交记录，当前窗口内已排定的执行流均已完成：

- 治理收敛流：`#39`、`#40`、`#38` 已完成
- 共享层收敛流：`#35`、`#36` 已完成
- 业务价值流：`#24`、`#26`、`#30`、`#27`、`#28` 已完成
- 后端分层试点流：`#37` 已完成
- 移动端能力流：`#29` 已完成

## Completed This Window

### `#39 [mobile] 明确包定位并接入仓库治理`

- `mobile/` 保持实验性定位
- 已提供独立开发入口 `pnpm dev:mobile`
- 已提供独立最小质量门 `pnpm type-check:mobile`
- 文档已明确不纳入根级聚合质量门

### `#40 [infra] 修复 monorepo 根脚本与 CI 覆盖失真`

- 根 `lint / type-check / test` 已覆盖 `api + tenant-web + admin-web`
- CI 已切换到真实 workspace，不再使用不存在的 `frontend` 过滤
- `mobile/` 继续单独治理

### `#24 [admin-web] 支持运营人员赠送套餐`

- 后端新增管理员赠送套餐接口
- 复用现有 `subscriptionOrder -> fulfillSubscription` 订阅链路
- 后台在注册用户详情页新增“赠送套餐”入口
- 支持选择目标组织、套餐周期、附加赠送月数

当前边界：

- 仅支持为无生效订阅组织开通，或为当前同套餐做顺延赠送
- 不在本窗口内扩展为独立权益系统

### `#26 [tenant-web] 支持账单分享`

- 账单列表新增“分享账单”入口
- 账单详情新增“分享账单”入口
- 分享内容采用前端生成的 PNG 账单分享图
- 支持优先调用系统分享；不支持时自动下载分享图

当前边界：

- 不引入公开账单链接体系
- 不接入第三方原生分享 SDK

### `#29 [mobile] 完善现场操作核心能力`

- 抄表录入主链路可用
- 抄表页已支持“保存并下一间”
- 已补充“查看房间 / 联系租客”快捷动作
- 账单列表中的快捷收款确认链路可用

当前边界：

- 不做离线、推送、扫码支付、照片凭证上传

### `#38 [infra] 建立 monorepo 共享工程配置与依赖治理`

- 根目录新增共享 `tsconfig.base.json`、`tsconfig.nextjs.json`、`tsconfig.react-package.json`
- `tenant-web/`、`admin-web/`、`packages/shared-ui/`、`packages/api-contract/`、`api/` 已接入共享配置
- 根目录新增 `.eslintrc.next.json`，双 Web 端不再各自复制同一份 Next ESLint 配置
- 根 `package.json` 已用 `pnpm.overrides` 收敛核心前端依赖版本
- 新增 `docs/monorepo-governance.md`，明确新增应用 / 包的接入方式

当前边界：

- 这次只收敛工程配置和版本治理，不在本窗口内继续推进共享 API client 或 shared-ui 迁移

### `#35 [packages] 提取共享 API client 包`

- 已新增共享包 `packages/web-api-client/`
- 共享包已承接 `ApiError`、统一响应解包、401 refresh 处理与通用错误/表单工具
- `tenant-web` 与 `admin-web` 的通用 `lib/api/client.ts` 已改为复用共享实现
- 双端重复的错误提示与表单错误转换工具已改为复用共享包导出

当前边界：

- `admin-web` 的 `admin-client.ts` 仍保持独立，继续使用后台专用 token 与接口语义
- 这轮不继续扩张为所有 API 模块一次性全面迁移

### `#36 [packages] 让 shared-ui 成为可独立复用的 UI 包`

- `shared-ui` 已清掉包内对应用级 `@/` alias 的依赖
- 已补齐 `components` 包入口与 `switch` 导出，包可独立 type-check
- `tenant-web` / `admin-web` 的首批基础 UI 引用已切到 `@apartment-ultra/shared-ui/components/ui`
- `shared-ui` 内的通用工具已改为直接复用共享 API client

当前边界：

- 应用侧原有 `src/components/ui/*` 副本暂时保留，避免在本窗口里混入大规模删除与视觉回归
- 这轮优先收敛消费入口与包独立性，不扩展成完整设计系统重组

### `#30 [tenant-web] 完善管理员消息提醒能力`

- 后端通知列表接口已支持按 `status / category` 过滤
- 通知服务会统一补齐 `category / target_path / action_label / channels` 元数据
- 通知页已支持分类筛选、仅看未读、业务跳转和站内通知边界说明
- 合同到期、交租提醒、账单逾期、租客入住 / 退租的跳转和动作文案已收口

当前边界：

- 当前正式交付仍是站内消息
- 短信 / 企微仅保留为预留通道字段，不在本窗口内接入真实发送

### `#28 [tenant-web] 建立租客端消息触达能力`

- 默认正式渠道已落为短信
- 已覆盖账单生成、到期前提醒、逾期催缴三类租客通知场景
- 后端已补齐模板配置、发送记录、失败/退订边界与短信 Webhook 适配层
- `tenant-web` 已补齐“消息触达”设置页、模板管理、发送记录查询和租客详情触达状态

当前边界：

- 当前只接 `sms`，后续渠道继续沿同一套模板/记录接口扩展
- 实际真实发送取决于部署环境是否配置 `SMS_WEBHOOK_URL`
- 入站自动退订不在本窗口内扩展，当前以后台退订标记为准

### `#27 [tenant-web] 增加水电读数异常校验`

- 后端新增读数异常二次校验，覆盖缺少上期读数、读数倒转、异常暴涨
- 单条录入和批量录入都会自动回填上一期读数，避免账单侧缺少基线
- 前端录入 / 编辑弹窗新增“首次录入 / 更换新表 / 异常说明”处理入口
- 首次录入与换表场景会在保存时留痕到备注，便于后续追溯

当前边界：

- 异常阈值仍是代码内固定规则，暂未做后台可配置化
- 当前主要覆盖单条录入与保存校验，不扩展成完整对账工作台

### `#37 [api] 统一服务层与仓储层职责边界`

- `api/AGENTS.md` 已补齐 service / repository / transaction 统一约定
- `apartment` 试点已改为 service 通过 repository 注入访问数据，不再在 service 中直接写 Prisma 查询
- `subscription` 试点已落成同样模式，并把订单、订阅、服务产品查询收敛到 repository
- `createPersonalOrgWithFreePlan`、`fulfillSubscription` 已改为事务内组装仓储，避免混用裸 Prisma 与事务对象
- 对应 repository / service 层已补最小测试，覆盖事务与仓储注入场景

当前边界：

- 当前试点聚焦 `apartment` 与 `subscription`，不在本轮继续扩张到全部 service 模块
- 其余模块后续继续沿同一分层模式迁移

## Verification

本轮已通过：

- `pnpm install`
- `pnpm --filter @apartment-ultra/web-api-client test:run`
- `pnpm --filter @apartment-ultra/shared-ui type-check`
- `pnpm --filter @apartment-ultra/shared-ui test:run`
- `pnpm --filter apartment-ultra-tenant type-check`
- `pnpm --filter apartment-ultra-admin type-check`
- `pnpm lint`
- `XDG_CACHE_HOME=/tmp/prisma-cache pnpm type-check`
- `pnpm --filter apartment-ultra-api run test`
- `pnpm --filter apartment-ultra-tenant run test:run`
- `pnpm type-check:mobile`
- `git diff --check`

最近提交核对：

- `6ddc3bd`：共享 Web 包收敛 + 租客触达第一期 + `apartment/subscription` 分层试点
- `5791aa8`：共享工程配置、通知链路与水电异常校验收口
- `2055dd3`：运营赠送套餐与账单分享能力

## Next Up

当前两周窗口内已排定任务已完成。下一步建议按新的 roadmap 或新增 issue 重新排期，而不是沿用本窗口的旧顺序。

## Parallel Tracks

当前建议拆成 3 条追踪流：

### A. 共享层收敛流

- 覆盖：`#35 -> #36`
- 状态：已完成
- 结论：已完成共享 API client 与 shared-ui 第一轮收敛，可关闭本追踪流
- 追踪文档：`docs/tracking/shared-layer-stream.md`

### B. 后端分层试点流

- 覆盖：`#37`
- 状态：已完成
- 结论：`apartment` / `subscription` 试点已落地，可作为后续模块迁移模板
- 追踪文档：`docs/tracking/api-boundary-stream.md`

### C. 租客触达能力流

- 覆盖：`#28`
- 状态：第一期已完成
- 结论：短信模板、发送记录和退订链路已落地；后续渠道可沿现有接口继续扩展
- 追踪文档：`docs/tracking/tenant-reachability-stream.md`

## Notes

- GitHub Project 状态应与本文件保持一致。
- 当前仓库代码与最近提交表明本窗口任务已全部落地；若 GitHub issue / Project 未同步，应按本文件回写状态。
- 若实际排期调整，以 GitHub Project 为准，并同步修改本文件。
- 并行任务的细粒度状态，统一维护在 `docs/tracking/`。
