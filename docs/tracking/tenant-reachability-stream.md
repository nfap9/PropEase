# 租客触达能力流

## 覆盖范围

- `#28 [tenant-web] 建立租客端消息触达能力`

## 当前状态

- 第一阶段已落地。
- 默认正式渠道已确定为短信。

## 已交付内容

- 覆盖三类租客通知场景：
  - 账单生成通知
  - 到期前提醒
  - 逾期催缴
- 后端已补齐：
  - 短信模板配置
  - 发送记录落库与查询
  - 租客短信退订边界
  - 基于 Webhook 的短信发送适配层
- `tenant-web` 已补齐：
  - 设置页“消息触达”入口
  - 模板管理界面
  - 发送记录查询界面
  - 租客详情页的触达状态与最近记录

## 当前边界

- 第一阶段只接 `sms`
- 实际真实发送依赖部署环境配置 `SMS_WEBHOOK_URL`
- 管理员站内通知页继续只承载站内消息；租客正式触达使用独立记录链路
- “回复退订”等入站自动处理暂不在本阶段扩展，当前以后台标记退订为主

## 失败与退订边界

- 缺少手机号：记录为 `skipped`
- 已退订：记录为 `skipped`
- 模板停用：记录为 `skipped`
- 短信网关失败：记录为 `failed`
- 发送成功：记录为 `sent`

## 验证情况

- `pnpm lint`
- `XDG_CACHE_HOME=/tmp/prisma-cache pnpm type-check`
- `pnpm --filter apartment-ultra-api run test`
- `pnpm --filter apartment-ultra-tenant run test:run`
- `git diff --check`

## 完成信号

- 至少一条正式渠道能发出真实账单相关消息
- 可以查询发送记录
- 模板与失败兜底路径明确

当前判断：代码侧已满足，生产环境真实发送取决于是否已配置短信 Webhook。
