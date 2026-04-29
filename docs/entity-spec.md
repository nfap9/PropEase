# Entity 字段说明

> 文档版本：v1.0 | 创建日期：2026-04-21

本文档详细说明 Apartment Ultra 数据模型中每个 entity 的字段含义、枚举值及业务说明。字段类型以 Prisma schema 为准。

---

## 目录

1. [User](#1-user-用户)
2. [Organization](#2-organization-组织)
3. [OrganizationMember](#3-organizationmember-组织成员)
4. [OrgRole](#4-orgrole-组织角色)
5. [Apartment](#5-apartment-公寓)
6. [Room](#6-room-房间)
7. [RoomPricing](#7-roompricing-房间价格)
8. [Tenant](#8-tenant-租客)
9. [Lease](#9-lease-租约)
10. [LeaseFeeItem](#10-leasefeeitem-租约费用项)
11. [LeaseChangeLog](#11-leasechangelog-租约变更记录)
12. [UtilityReading](#12-utilityreading-水电读数)
13. [ApartmentConfig](#13-apartmentconfig-公寓配置)
14. [ApartmentFeeItem](#14-apartmentfeeitem-公寓费用项)
15. [Bill](#15-bill-账单)
16. [BillFeeItem](#16-billfeeitem-账单费用项)
17. [Payment](#17-payment-收款记录)
18. [Notification](#18-notification-通知记录)
19. [NotificationTemplate](#19-notificationtemplate-通知模板)
20. [NotificationDelivery](#20-notificationdelivery-通知投递记录)
21. [OrganizationSubscription](#21-organizationsubscription-组织订阅)
22. [SmsVerificationCode](#22-smsverificationcode-短信验证码)
23. [AdminUser](#23-adminuser-平台管理员)
24. [BillingOrder](#24-billingorder-统一订单)
25. [UsageUnitPricing](#25-usageunitpricing-用量单价)
26. [UsageAllowance](#26-usageallowance-组织用量额度)
27. [UserBalance](#27-userbalance-用户余额)
28. [ServiceProduct](#28-serviceproduct-服务产品)
29. [ServicePricing](#29-servicepricing-服务定价)

---

## 1. User（用户）

平台注册用户，一个用户可属于多个组织。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| phone | varchar(20) | ✅ | — | 手机号（唯一），登录账号 |
| password_hash | varchar(255) | ✅ | — | bcrypt 哈希后的密码 |
| full_name | varchar(255) | ✅ | — | 用户真实姓名 |
| referral_code | varchar(20) | ❌ | — | 用户推荐码（唯一），用于推荐注册 |
| is_active | boolean | — | true | 账号是否启用 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

---

## 2. Organization（组织）

多租户隔离单位，用户创建组织后自动成为组织所有者。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| name | varchar(255) | ✅ | — | 组织名称 |
| slug | varchar(100) | ✅ | — | URL 友好名称（唯一） |
| type | varchar(20) | — | "individual" | 组织类型，individual=个人 |
| notes | varchar(1000) | ❌ | — | 备注 |
| settings | json | ❌ | — | 组织自定义配置 |
| is_personal | boolean | — | false | 是否个人组织（true=个人创建） |
| is_active | boolean | — | true | 组织是否启用 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**说明：** 一个用户可创建多个组织（`is_personal=true` 的个人组织一对一），不同组织之间数据完全隔离。

---

## 3. OrganizationMember（组织成员）

关联 User 与 Organization，记录成员在组织中的角色。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 所属组织 ID |
| user_id | varchar(26) | ✅ | — | 用户 ID |
| role_id | varchar(26) | ✅ | — | 关联 OrgRole |
| created_at | datetime | — | now() | 加入时间 |
| updated_at | datetime | — | now() | 更新时间 |

**唯一约束：** `(organization_id, user_id)` 唯一，一个用户在同一个组织只能有一个角色。

---

## 4. OrgRole（组织角色）

组织内的角色定义，分预制角色（`is_system=true`）和自定义角色。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 所属组织 ID |
| name | varchar(50) | ✅ | — | 角色名称 |
| description | varchar(255) | ❌ | — | 角色描述 |
| is_system | boolean | — | false | 是否预制角色；true=不可删除/改名称 |
| permissions | json | — | "[]" | 权限码数组，如 `["apartment:view","room:create"]` |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**唯一约束：** `(organization_id, name)` 唯一，同一组织内角色名不可重复。

**预制角色（is_system=true）：**

| 角色名 | 权限数量 | 说明 |
|--------|---------|------|
| 组织所有者 | 45个 | 全部权限（9模块×5操作） |
| 公寓管理人 | 40个 | 除 settings 外的全部权限 |
| 一般合伙人 | 16个 | 仅 view/export |

---

## 5. Apartment（公寓）

组织下的公寓/楼盘。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 所属组织 ID |
| name | varchar(255) | ✅ | — | 公寓名称 |
| address | varchar(500) | ❌ | — | 详细地址 |
| floors | int | ❌ | — | 楼层数 |
| land_area | decimal(10,2) | ❌ | — | 占地面积（平方米） |
| total_area | decimal(10,2) | ❌ | — | 总面积（平方米） |
| landlord_name | varchar(100) | ❌ | — | 上游房东姓名 |
| landlord_contact | varchar(50) | ❌ | — | 上游房东联系方式 |
| contract_start | date | ❌ | — | 上游合同开始日期 |
| contract_end | date | ❌ | — | 上游合同结束日期 |
| landlord_rent | decimal(10,2) | ❌ | — | 上游房东租金（元/月） |
| operating_cost | decimal(10,2) | ❌ | — | 运营成本 |
| description | varchar(1000) | ❌ | — | 公寓描述 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

---

## 6. Room（房间）

公寓下的房间。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| apartment_id | varchar(26) | ✅ | — | 所属公寓 ID |
| room_number | varchar(50) | ✅ | — | 房间号，如 "101"、"A-203" |
| layout | varchar(50) | ❌ | — | 户型，如 "一室一厅" |
| status | varchar(20) | — | "available" | 房间状态，见下方状态值 |
| maintenance | boolean | — | false | 是否正在维护（与 status 独立） |
| area | decimal(10,2) | ❌ | — | 房间面积（平方米） |
| facilities | json | ❌ | — | 设施列表，如 `["空调","热水器"]` |
| notes | varchar(500) | ❌ | — | 备注 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**status 状态值：**

| 值 | 说明 |
|----|------|
| available | 可用（空置中） |
| occupied | 已出租 |
| maintenance | 维护中（由 maintenance 字段独立控制） |
| reserved | 已预留 |

---

## 7. RoomPricing（房间价格）

房间的月租金定价。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| room_id | varchar(26) | ✅ | — | 房间 ID（一对一） |
| monthly_rent | decimal(10,2) | ✅ | — | 月租金（元） |
| effective_date | datetime | — | now() | 生效日期 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**说明：** RoomPricing 与 Room 一对一；同一房间有多条定价记录时，取 `effective_date` 最晚的为当前租金。变更租金时应新增记录而非修改旧记录。

---

## 8. Tenant（租客）

租客信息，独立于租约存在（一个租客可有多个租约）。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 所属组织 ID |
| name | varchar(255) | ✅ | — | 租客姓名 |
| phone | varchar(50) | ❌ | — | 租客手机号 |
| sms_opt_out | boolean | — | false | 是否拒绝接收短信 |
| sms_opt_out_at | datetime | ❌ | — | 拒绝短信的时间 |
| sms_opt_out_reason | varchar(255) | ❌ | — | 拒绝原因 |
| id_card | varchar(50) | ❌ | — | 身份证号 |
| emergency_contact | varchar(255) | ❌ | — | 紧急联系人 |
| emergency_phone | varchar(50) | ❌ | — | 紧急联系人电话 |
| notes | varchar(500) | ❌ | — | 备注 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

---

## 9. Lease（租约）

房间与租客的租赁关系核心记录。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| room_id | varchar(26) | ✅ | — | 房间 ID |
| tenant_id | varchar(26) | ✅ | — | 租客 ID |
| start_date | date | ✅ | — | 租约开始日期 |
| end_date | date | ❌ | — | 租约结束日期；null 表示无固定期限 |
| rental_type | varchar(20) | — | "monthly" | 租金类型，见下方枚举 |
| billing_day | int | — | 1 | 每月账单日（1-28） |
| monthly_rent | decimal(10,2) | ✅ | — | 月租金（元） |
| deposit | decimal(10,2) | — | 0 | 押金金额（元） |
| water_rate | decimal(10,4) | — | 0 | 水费单价（元/吨） |
| electricity_rate | decimal(10,4) | — | 0 | 电费单价（元/度） |
| is_active | boolean | — | true | 租约是否生效 |
| notes | varchar(500) | ❌ | — | 备注 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**rental_type 枚举值：**

| 值 | 说明 |
|----|------|
| monthly | 月租（按月计费） |
| quarterly | 季付（按季度计费） |
| yearly | 年付（按年计费） |
| fixed_term | 固定期限（按天计费，超期后按天续） |

**is_active 状态说明：**

- `true` = 租约生效中
- `false` = 租约已结束/终止（由系统自动在租约到期或退租时更新）

---

## 10. LeaseFeeItem（租约费用项）

租约关联的费用项实例，关联 ApartmentFeeItem 并在租约级别落地金额。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| lease_id | varchar(26) | ✅ | — | 所属租约 ID |
| fee_type_id | varchar(26) | ❌ | — | 关联 ApartmentFeeItem ID |
| fee_category | varchar(20) | ✅ | — | 费用分类：fixed/utility/optional |
| fee_name | varchar(100) | ✅ | — | 费用项名称，如 "租金"、"卫生费" |
| fee_amount | decimal(10,2) | — | 1 | 费用金额（元） |
| fee_cycle | varchar(20) | ✅ | — | 计费周期：monthly/quarterly/yearly/one_time |
| quantity | decimal(10,2) | — | 1 | 数量（固定费用一般为1） |
| notes | varchar(500) | ❌ | — | 备注 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**fee_category 说明：**

| 值 | 说明 |
|----|------|
| fixed | 固定费用（如月租、管理费） |
| utility | 用量费用（如水电费，按实际用量计算） |
| optional | 可选费用（如押金、退房卫生费） |

**fee_cycle 说明：**

| 值 | 说明 |
|----|------|
| monthly | 每月重复 |
| quarterly | 每季度重复 |
| yearly | 每年重复 |
| one_time | 一次性（仅首期收取） |

**amount 计算公式：** `amount = fee_amount × quantity`

---

## 11. LeaseChangeLog（租约变更记录）

记录租约期间的变更历史（租金调整、水电单价变更等）。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| lease_id | varchar(26) | ✅ | — | 所属租约 ID |
| change_type | varchar(50) | ✅ | — | 变更类型，如 "rent_change" |
| old_value | json | ❌ | — | 变更前的值 |
| new_value | json | ❌ | — | 变更后的值 |
| effective_from_year | int | ❌ | — | 变更生效年份（账单生成时参考） |
| effective_from_month | int | ❌ | — | 变更生效月份 |
| reason | varchar(500) | ❌ | — | 变更原因 |
| created_by | varchar(26) | ❌ | — | 操作用户 ID |
| created_at | datetime | — | now() | 创建时间 |

**change_type 枚举：**

| 值 | 说明 |
|----|------|
| rent_change | 租金变更 |
| deposit_change | 押金变更 |
| water_rate_change | 水费单价变更 |
| electricity_rate_change | 电费单价变更 |
| term_extension | 租约延期 |
| term_termination | 提前终止 |

---

## 12. UtilityReading（水电读数）

每月水电表读数记录。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| room_id | varchar(26) | ✅ | — | 房间 ID |
| period_year | int | ✅ | — | 账期年份 |
| period_month | int | ✅ | — | 账期月份 |
| reading_date | date | ✅ | — | 抄表日期 |
| water_reading | decimal(10,2) | ❌ | — | 本期水表读数（吨） |
| electricity_reading | decimal(10,2) | ❌ | — | 本期电表读数（度） |
| water_previous | decimal(10,2) | ❌ | — | 上期水表读数（吨），用于校验 |
| electricity_previous | decimal(10,2) | ❌ | — | 上期电表读数（度），用于校验 |
| notes | varchar(500) | ❌ | — | 备注 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**唯一约束：** `(room_id, period_year, period_month)` 唯一，每房间每月只有一条读数记录。

**异常处理：** 本期读数 < 上期读数时，标记异常，暂停自动计费，待人工处理。

---

## 13. ApartmentConfig（公寓配置）

公寓级别的配置，包含水电单价和费用项目。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| apartment_id | varchar(26) | ✅ | — | 所属公寓 ID（一对一） |
| water_price_per_unit | decimal(10,2) | ❌ | — | 水费单价（元/吨） |
| electricity_price_per_unit | decimal(10,2) | ❌ | — | 电费单价（元/度） |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**说明：** 此配置为公寓级别默认值；实际计费以 Lease 上的 water_rate / electricity_rate 为准。每个公寓独立管理自己的费用项目（ApartmentFeeItem）。

---

## 14. ApartmentFeeItem（公寓费用项）

公寓下可用的费用项，供创建租约时选择。每个公寓独立管理自己的费用项列表。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| apartment_id | varchar(26) | ✅ | — | 所属公寓配置 ID |
| category | varchar(20) | ✅ | — | 分类：fixed/utility/optional |
| name | varchar(100) | ✅ | — | 费用项名称，如 "卫生费"、"清运费" |
| amount | decimal(10,2) | ✅ | — | 默认金额（元） |
| cycle | varchar(20) | ✅ | — | 周期：monthly/quarterly/yearly/one_time |
| sort_order | int | — | 0 | 排序顺序（数字越小越靠前） |
| is_active | boolean | — | true | 是否启用 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**唯一约束：** `(apartment_id, name)` 唯一，同一公寓内费用项名称不可重复。

---

## 15. Bill（账单）

每月生成给租客的账单。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| lease_id | varchar(26) | ✅ | — | 关联租约 ID |
| bill_year | int | ✅ | — | 账期年份 |
| bill_month | int | ✅ | — | 账期月份（1-12） |
| due_date | date | ✅ | — | 应付截止日期 |
| rent_amount | decimal(10,2) | — | 0 | 租金金额 |
| deposit_amount | decimal(10,2) | — | 0 | 押金金额（仅首期） |
| water_amount | decimal(10,2) | — | 0 | 水费金额 |
| electricity_amount | decimal(10,2) | — | 0 | 电费金额 |
| other_amount | decimal(10,2) | — | 0 | 其他费用金额（BillFeeItem 小计） |
| total_amount | decimal(10,2) | ✅ | — | 账单总金额 |
| paid_amount | decimal(10,2) | — | 0 | 已付款金额 |
| status | varchar(20) | — | "pending" | 账单状态 |
| notes | varchar(500) | ❌ | — | 备注 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**唯一约束：** `(lease_id, bill_year, bill_month)` 唯一，每租约每账期只出一张账单。

**status 状态值：**

| 值 | 说明 |
|----|------|
| pending | 待支付 |
| partial | 部分支付 |
| paid | 已支付 |
| overdue | 逾期 |
| reversed | 已冲销（红冲后不可修改，仅追溯「冲销关联字段待实现」） |

---

## 16. BillFeeItem（账单费用项）

账单的费用明细，替代原有的 other_amount 字段。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| bill_id | varchar(26) | ✅ | — | 所属账单 ID |
| fee_type_id | varchar(26) | ✅ | — | 关联 ApartmentFeeItem ID |
| fee_category | varchar(20) | ✅ | — | 费用分类 |
| fee_name | varchar(100) | ✅ | — | 费用项名称 |
| fee_amount | decimal(10,2) | — | 1 | 单价（元） |
| fee_cycle | varchar(20) | ✅ | — | 计费周期 |
| quantity | decimal(10,2) | — | 1 | 数量 |
| unit_price | decimal(10,2) | ✅ | — | 单位价格（与 fee_amount 相同，用于记录） |
| amount | decimal(10,2) | ✅ | — | 费用小计 = fee_amount × quantity |
| notes | varchar(500) | ❌ | — | 备注 |
| created_at | datetime | — | now() | 创建时间 |

---

## 17. Payment（收款记录）

租客付款记录。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| bill_id | varchar(26) | ✅ | — | 所属账单 ID |
| amount | decimal(10,2) | ✅ | — | 付款金额（元） |
| payment_date | date | ✅ | — | 付款日期 |
| payment_method | varchar(20) | — | "cash" | 支付方式 |
| reference | varchar(255) | ❌ | — | 付款凭证号/备注 |
| notes | varchar(500) | ❌ | — | 备注 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**payment_method 枚举值：**

| 值 | 说明 |
|----|------|
| cash | 现金 |
| wechat | 微信支付 |
| alipay | 支付宝 |
| bank_transfer | 银行转账 |
| other | 其他 |

---

## 18. Notification（通知记录）

用户收到的站内通知。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| user_id | varchar(26) | ✅ | — | 接收用户 ID |
| organization_id | varchar(26) | ✅ | — | 所属组织 ID |
| type | varchar(50) | ✅ | — | 通知类型码，如 bill_generated |
| title | varchar(255) | ✅ | — | 通知标题 |
| content | varchar(1000) | ✅ | — | 通知内容文本 |
| is_read | boolean | — | false | 是否已读 |
| extra_data | json | ❌ | — | 扩展数据（跳转路径、关联ID等） |
| created_at | datetime | — | now() | 发送时间 |
| updated_at | datetime | — | now() | 更新时间 |

**type 枚举值：**

| 值 | 说明 |
|----|------|
| bill_generated | 账单已生成 |
| rent_due_reminder | 交租日提醒 |
| bill_overdue | 账单逾期 |
| payment_received | 收款到账 |
| lease_expiring | 租约即将到期 |
| lease_ended | 租约已结束 |
| utility_reading_abnormal | 水电读数异常 |

---

## 19. NotificationTemplate（通知模板）

组织级通知模板配置。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 所属组织 ID |
| channel | varchar(20) | ✅ | — | 通知渠道：in_app/sms/email |
| event_type | varchar(50) | ✅ | — | 事件类型（对应 Notification.type） |
| name | varchar(100) | ✅ | — | 模板名称 |
| content | varchar(1000) | ✅ | — | 模板内容（支持变量占位符） |
| is_enabled | boolean | — | true | 是否启用 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**唯一约束：** `(organization_id, channel, event_type)` 唯一。

---

## 20. NotificationDelivery（通知投递记录）

记录通知的实际投递结果。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 所属组织 ID |
| tenant_id | varchar(26) | ❌ | — | 关联租客 ID（租客通知用） |
| lease_id | varchar(26) | ❌ | — | 关联租约 ID |
| bill_id | varchar(26) | ❌ | — | 关联账单 ID |
| template_id | varchar(26) | ❌ | — | 关联模板 ID |
| channel | varchar(20) | ✅ | — | 渠道：in_app/sms/email |
| event_type | varchar(50) | ✅ | — | 事件类型 |
| recipient | varchar(50) | ❌ | — | 接收人标识（手机号/邮箱） |
| status | varchar(20) | ✅ | — | 投递状态 |
| content | varchar(1000) | ✅ | — | 实际发送内容 |
| provider_message_id | varchar(100) | ❌ | — | 第三方服务商消息 ID |
| status_reason | varchar(255) | ❌ | — | 状态原因（如失败原因） |
| extra_data | json | ❌ | — | 扩展数据 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**status 枚举值：**

| 值 | 说明 |
|----|------|
| pending | 待发送 |
| sent | 已发送 |
| delivered | 已送达 |
| failed | 发送失败 |
| read | 已读 |

---

## 21. OrganizationSubscription（组织订阅）

记录组织的服务订阅状态。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 所属组织 ID（一对一） |
| service_id | varchar(26) | ✅ | — | 订阅的服务产品 ID |
| pricing_id | varchar(26) | ❌ | — | 购买的定价周期 ID |
| status | varchar(20) | — | "active" | 订阅状态 |
| billing_months | int | — | 1 | 订阅月数 |
| start_date | date | ✅ | — | 订阅开始日期 |
| end_date | date | ❌ | — | 订阅结束日期（null 表示永久） |
| auto_renew | boolean | — | true | 是否自动续费 |
| trial_ends_at | datetime | ❌ | — | 试用期结束时间 |
| next_service_id | varchar(26) | ❌ | — | 下一订阅的服务产品 ID（切换用） |
| cancel_reason | varchar(500) | ❌ | — | 取消原因 |
| limits_snapshot | json | ❌ | — | 订阅限制快照（如房间数上限） |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**status 枚举值：**

| 值 | 说明 |
|----|------|
| active | 生效中 |
| expired | 已过期 |
| cancelled | 已取消 |

---

## 22. SmsVerificationCode（短信验证码）

手机验证码记录。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| phone | varchar(20) | ✅ | — | 接收手机号 |
| code | varchar(6) | ✅ | — | 6位验证码 |
| purpose | varchar(20) | ✅ | — | 用途：login/register/reset_password |
| is_used | boolean | — | false | 是否已使用 |
| expires_at | datetime | ✅ | — | 过期时间（通常10分钟后） |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

---

## 23. AdminUser（平台管理员）

运营后台管理员账号，与组织体系独立。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| username | varchar(64) | ✅ | — | 登录用户名（唯一） |
| password_hash | varchar(255) | ✅ | — | 密码哈希 |
| name | varchar(100) | ✅ | — | 姓名 |
| email | varchar(255) | ❌ | — | 邮箱 |
| is_active | boolean | — | true | 账号是否启用 |
| is_system | boolean | — | false | 是否系统预置账号（不可删除） |
| last_login_at | datetime | ❌ | — | 最后登录时间 |
| failed_login_attempts | int | — | 0 | 连续失败登录次数 |
| locked_until | datetime | ❌ | — | 锁定截止时间（超过次数后锁定） |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

---

## 24. BillingOrder（统一订单）

整合订阅订单和用量订单的统一订单表（替代 SubscriptionOrder 和 UsageQuotaOrder）。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| order_no | varchar(64) | ✅ | — | 订单编号（唯一） |
| order_type | varchar(20) | ✅ | — | 订单类型：subscription/usage |
| organization_id | varchar(26) | ❌ | — | 组织 ID（subscription 必填） |
| user_id | varchar(26) | ❌ | — | 用户 ID（usage 必填） |
| service_id | varchar(26) | ❌ | — | 服务产品 ID（subscription 用） |
| pricing_id | varchar(26) | ❌ | — | 定价周期 ID |
| billing_months | int | ❌ | — | 订阅月数 |
| usage_details | json | ❌ | — | 用量明细 `{ orgs, apartments, rooms, members }` |
| amount | decimal(10,2) | ✅ | — | 实际支付金额 |
| original_amount | decimal(10,2) | ❌ | — | 原价（优惠前） |
| currency | varchar(10) | — | "CNY" | 货币 |
| status | varchar(32) | — | "pending" | 订单状态 |
| payment_method | varchar(32) | — | "wechat_native" | 支付方式 |
| code_url | varchar(512) | ❌ | — | 微信支付二维码链接 |
| wechat_transaction_id | varchar(64) | ❌ | — | 微信交易号 |
| paid_at | datetime | ❌ | — | 支付时间 |
| expires_at | datetime | ✅ | — | 订单过期时间 |
| applied_discounts | json | ❌ | — | 已应用折扣列表 |
| total_discount | decimal(10,2) | ❌ | — | 总折扣金额 |
| total_gift_months | int | — | 0 | 赠送月数 |
| balance_deduction | decimal(10,2) | ❌ | — | 余额抵扣金额 |
| subscription_id | varchar(26) | ❌ | — | 关联的订阅 ID |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**order_type 枚举值：**

| 值 | 说明 |
|----|------|
| subscription | 订阅订单（按时长） |
| usage | 用量订单（按量付费） |

**status 枚举值：**

| 值 | 说明 |
|----|------|
| pending | 待支付 |
| paid | 已支付 |
| cancelled | 已取消 |
| expired | 已过期 |

---

## 25. UsageUnitPricing（用量单价）

用量计费的单位定价。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| unit_type | varchar(20) | ✅ | — | 单位类型：org/apartment/room/member |
| price_per_unit | decimal(10,2) | ✅ | — | 单价（元/单位/月） |
| is_active | boolean | — | true | 是否启用 |
| valid_from | datetime | — | now() | 生效开始时间 |
| valid_to | datetime | ❌ | — | 生效结束时间（null 表示永久） |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

---

## 26. UsageAllowance（组织用量额度）

每月组织实际使用的额度记录。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 组织 ID |
| year | int | ✅ | — | 年份 |
| month | int | ✅ | — | 月份（1-12） |
| orgs | int | — | 0 | 组织数（当前始终为1） |
| apartments | int | — | 0 | 公寓数 |
| rooms | int | — | 0 | 房间数 |
| members | int | — | 0 | 成员数 |
| billing_order_id | varchar(26) | ❌ | — | 关联订单 ID |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**唯一约束：** `(organization_id, year, month)` 唯一。

---

## 27. UserBalance（用户余额）

用户账户余额信息。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| organization_id | varchar(26) | ✅ | — | 组织 ID（一对一） |
| balance | decimal(10,2) | — | 0 | 当前可用余额 |
| total_gifted | decimal(10,2) | — | 0 | 累计获赠金额 |
| total_used | decimal(10,2) | — | 0 | 累计已使用金额 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

---

## 28. ServiceProduct（服务产品）

平台服务产品定义。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| name | varchar(100) | ✅ | — | 服务名称 |
| code | varchar(50) | ✅ | — | 服务代码（唯一） |
| description | varchar(500) | ❌ | — | 服务描述 |
| max_organizations | int | ❌ | — | 最大组织数（null=不限制） |
| max_apartments | int | — | 1 | 最大公寓数 |
| max_rooms | int | — | 100 | 最大房间数 |
| max_members | int | — | 1 | 最大成员数 |
| is_active | boolean | — | true | 是否启用 |
| sort_order | int | — | 0 | 排序顺序 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

---

## 29. ServicePricing（服务定价）

服务产品的时长定价。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | varchar(26) | ✅ | — | ULID 主键 |
| service_id | varchar(26) | ✅ | — | 服务产品 ID |
| months | int | ✅ | — | 购买时长（月） |
| price | decimal(10,2) | ✅ | — | 价格（元） |
| is_active | boolean | — | true | 是否启用 |
| sort_order | int | — | 0 | 排序顺序 |
| created_at | datetime | — | now() | 创建时间 |
| updated_at | datetime | — | now() | 更新时间 |

**唯一约束：** `(service_id, months)` 唯一。

---

## 附录：已废弃模型（Deprecated）

以下模型已废弃，功能已迁移至 BillingOrder，使用时请勿新建。

| 废弃模型 | 替代者 | 废弃说明 |
|---------|--------|---------|
| SubscriptionOrder | BillingOrder | 订单格式统一 |
| UsageQuota | UsageAllowance | 用量记录统一 |
| UsageQuotaOrder | BillingOrder | 订单格式统一 |

