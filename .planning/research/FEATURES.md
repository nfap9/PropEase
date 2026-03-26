# Feature Research

**Domain:** Property/Apartment Management SaaS
**Researched:** 2026-03-26
**Confidence:** MEDIUM

> **Note:** Web search tools were unavailable during research. Findings are based on training data and competitor analysis from documented features in the existing codebase. Recommend validation through user interviews and competitor product review.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 公寓/房间 CRUD | 基础房源管理，任何房产管理工具必须有 | LOW | Apartment Ultra 已实现 |
| 租客信息管理 | 记录租客联系方式是基本需求 | LOW | Apartment Ultra 已实现 |
| 租约管理 (创建/续约/终止) | 核心业务操作，贯穿整个租期 | MEDIUM | Apartment Ultra 已实现，但可优化 |
| 账单生成与管理 | 收租是房东最核心的诉求 | MEDIUM | Apartment Ultra 已实现（含手动出账） |
| 水电抄表与计算 | 常规运营任务，必须支持 | MEDIUM | Apartment Ultra 已实现 |
| 账单支付状态跟踪 | 知道谁付了钱、谁没付是关键 | LOW | Apartment Ultra 已实现（待付/已付/部分付款） |
| 数据筛选与搜索 | 多房源管理时快速定位数据 | LOW | 部分实现（租约有筛选，账单有筛选，公寓仅名称搜索） |
| 导出功能 (Excel/PDF) | 房东习惯线下对账 | MEDIUM | Apartment Ultra 已实现（账单 PDF/Excel 导出） |
| 基础报表统计 | 空房率、收租率等运营数据 | MEDIUM | Apartment Ultra 已实现（经营分析） |
| 组织/团队管理 | 多用户协作是 SaaS 基本预期 | MEDIUM | Apartment Ultra 已实现（角色、权限） |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 自动账单生成 | 减少手动操作，提升效率 | HIGH | 当前仅支持手动出账，自动出账是明显差距 |
| 租约到期预警 | 主动提醒，减少空档期 | MEDIUM | 原始需求提到"事务提醒"，当前缺失 |
| 逾期付款自动催收提醒 | 减少坏账 | MEDIUM | 需要与通知系统结合 |
| 多维度运营分析看板 | 让房东一眼看清全局 | MEDIUM | 当前报表较基础，缺乏趋势分析 |
| 批量操作优化 | 提升管理多套房源的效率 | MEDIUM | 批量添加房间已实现，其他场景可扩展 |
| 费用配置灵活性 | 支持各种费用类型（网费、管理费等） | MEDIUM | 已实现但分散在公寓详情页 |
| 移动端体验 | 现场抄表、即时查看 | HIGH | 当前 mobile/ 是实验性项目，未作为核心体验 |
| 微信支付集成 | 国内房东习惯微信收款 | MEDIUM | 已实现订阅支付，账单支付集成情况待确认 |
| 初始水电记录提醒 | 避免新租约无法出账 | LOW | 原始需求提到，当前未明确实现 |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 实时通知所有变更 | 担心错过任何操作 | 信息过载、噪音大，实际价值低 | 提供关键事件开关（如到期提醒、逾期提醒） |
| 复杂权限体系（细粒度字段级控制） | 追求安全 | 配置成本高，大多数中小房东不需要 | 提供角色级别权限（管理员/运营）即可 |
| 支持日租/短租 | 扩展业务场景 | 业务流程与长租差异大，增加复杂度 | MVP 阶段专注月租，长租是核心场景 |
| 无限层级组织架构 | 支持大企业 | 大多数房东组织扁平，徒增复杂度 | 保持扁平（组织->成员两级） |
| 全功能移动端 App | 移动场景需求 | 开发维护成本高，Native App 迭代慢 | 响应式 Web 移动端优先，App 作为远期规划 |
| 自动化财务记账/对账 | 减少会计工作 | 国内房东习惯自己记账或用 Excel | 导出功能满足基本需求，对接财务软件是 v2 考虑 |

## Feature Dependencies

```
[公寓管理]
    └──requires──> [房间管理]
                       └──requires──> [租客管理]
                                          └──requires──> [租约管理]
                                                             └──requires──> [账单管理]
                                                                              └──requires──> [水电管理]

[账单管理] ──enhances──> [租约管理] (账单状态反映租约执行情况)

[费用配置] ──enhances──> [租约管理] (签约时可选额外费用)

[报表统计] ──depends on──> [所有业务模块] (数据汇总)

[组织管理] ──supports──> [所有业务模块] (多租户隔离)
```

### Dependency Notes

- **账单管理 requires 水电管理:** 水电费是账单的重要组成部分，必须先有水电记录才能生成准确账单
- **租约管理 requires 租客管理:** 租约必须关联具体租客，无法凭空创建
- **租约管理 requires 房间管理:** 租约必须关联具体房间
- **房间管理 requires 公寓管理:** 房间从属于公寓，房间无法脱离公寓存在
- **账单管理 enhances 租约管理:** 账单支付状态帮助房东跟踪租约执行情况
- **报表统计 depends on 所有业务模块:** 经营分析需要聚合所有业务数据

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] 公寓 CRUD — 已实现
- [x] 房间 CRUD — 已实现
- [x] 租客管理 — 已实现
- [x] 租约管理 — 已实现
- [x] 水电记录 — 已实现
- [x] 账单管理 — 已实现
- [ ] **Mock数据替换** — 高优先级，当前影响数据完整性
- [ ] **租约到期预警/事务提醒** — 从原始需求提炼，当前缺失
- [ ] **初始水电记录提醒** — 新租约创建时必须录入初始水电读数

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] 自动账单生成（按月自动生成，基于租约和水电记录）
- [ ] 账单支付集成微信支付
- [ ] 多维度运营看板（趋势分析、空房率趋势、收入趋势）
- [ ] 逾期付款提醒
- [ ] 移动端体验优化

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] 对接财务软件（用友/金蝶）
- [ ] 短租/日租支持
- [ ] 智能推荐（根据历史数据推荐租金定价）
- [ ] 对接银行自动扣款

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Mock数据替换为真实DB | HIGH | MEDIUM | P1 |
| 租约到期预警提醒 | HIGH | LOW | P1 |
| 初始水电记录提醒 | HIGH | LOW | P1 |
| 自动账单生成 | HIGH | HIGH | P2 |
| 账单微信支付集成 | HIGH | MEDIUM | P2 |
| 多维度运营看板 | MEDIUM | MEDIUM | P2 |
| 逾期付款提醒 | MEDIUM | LOW | P2 |
| 移动端体验优化 | MEDIUM | HIGH | P3 |
| 批量操作扩展 | MEDIUM | MEDIUM | P3 |
| 对接财务软件 | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (当前产品化过程中缺失的关键功能)
- P2: Should have, add when possible (体验提升类)
- P3: Nice to have, future consideration (扩展能力)

## Competitor Feature Analysis

| Feature | 寓言/Yulian | 蘑菇租房 | Apartment Ultra 当前 | Our Approach |
|---------|-------------|----------|-----------------------|--------------|
| 公寓/房间管理 | 有 | 有 | 有 | 保持 |
| 租客/租约管理 | 有 | 有 | 有 | 保持 |
| 账单生成 | 自动月结 | 自动月结 | **手动出账** | 提升为可选自动 |
| 水电抄表 | App+Web | App+Web | Web | 保持 Web，优先级低 |
| 支付集成 | 微信/支付宝 | 微信/支付宝 | 仅订阅 | 扩展到账单支付 |
| 预警提醒 | 到期+逾期 | 到期+逾期 | **缺失** | 补充 |
| 报表分析 | 丰富 | 中等 | 基础 | 扩展 |
| 移动端 | App完整 | App完整 | **实验性** | 提升优先级 |

## Sources

- Apartment Ultra 现有功能文档（`docs/测试用例/`）
- Apartment Ultra 原始需求（`docs/原始需求.md`）
- 项目现状（`.planning/PROJECT.md`）
- Property management SaaS 行业通用模式（训练数据）

> **Research Confidence:** MEDIUM — Web search unavailable，无法验证竞品最新功能状态。建议后续通过竞品实际体验和用户访谈补充验证。
