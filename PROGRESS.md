# Apartment Ultra Progress

> Last updated: 2026-03-17
> Source of truth for scheduling: GitHub Project `apartment-ultra Roadmap`

## Current Window

当前执行窗口按 `2026-03-17` 到 `2026-03-29` 跟踪，聚焦 3 条并行流：

- 治理收敛流：`#39`、`#40`、`#38` 已完成
- 业务价值流：`#24`、`#26`、`#30`、`#27` 已完成
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

### `#30 [tenant-web] 完善管理员消息提醒能力`

- 后端通知列表接口已支持按 `status / category` 过滤
- 通知服务会统一补齐 `category / target_path / action_label / channels` 元数据
- 通知页已支持分类筛选、仅看未读、业务跳转和站内通知边界说明
- 合同到期、交租提醒、账单逾期、租客入住 / 退租的跳转和动作文案已收口

当前边界：

- 当前正式交付仍是站内消息
- 短信 / 企微仅保留为预留通道字段，不在本窗口内接入真实发送

### `#27 [tenant-web] 增加水电读数异常校验`

- 后端新增读数异常二次校验，覆盖缺少上期读数、读数倒转、异常暴涨
- 单条录入和批量录入都会自动回填上一期读数，避免账单侧缺少基线
- 前端录入 / 编辑弹窗新增“首次录入 / 更换新表 / 异常说明”处理入口
- 首次录入与换表场景会在保存时留痕到备注，便于后续追溯

当前边界：

- 异常阈值仍是代码内固定规则，暂未做后台可配置化
- 当前主要覆盖单条录入与保存校验，不扩展成完整对账工作台

## Verification

本轮已通过：

- `pnpm lint`
- `XDG_CACHE_HOME=/tmp/prisma-cache pnpm type-check`
- `XDG_CACHE_HOME=/tmp/prisma-cache pnpm test`
- `pnpm type-check:mobile`
- `git diff --check`

## Next Up

按当前 Project 排期，下一批待进入实施的是：

1. `#35 [packages] 提取共享 API client 包`
2. `#36 [packages] 让 shared-ui 成为可独立复用的 UI 包`
3. `#28 [tenant-web] 建立租客端消息触达能力`
4. `#37 [api] 统一服务层与仓储层职责边界`

## Notes

- GitHub Project 状态应与本文件保持一致。
- 已完成但尚未验收发布的工作，允许保持代码完成、等待业务确认。
- 若实际排期调整，以 GitHub Project 为准，并同步修改本文件。
