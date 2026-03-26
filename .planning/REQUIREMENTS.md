# Requirements: Apartment Ultra 优化

**Defined:** 2026-03-26
**Core Value:** 房东能够通过一个系统高效管理公寓、房间、租客、租约、水电和账单，提升运营效率并减少人工错误。

## v1 Requirements

当前阶段优化目标：替换 Mock 数据、拆分臃肿页面、统一 UI 风格、提升易用性。

### 数据层规范化 (Data)

- [x] **DATA-01**: 租客端所有使用 mock 数据的 API 调用替换为真实数据库查询
- [x] **DATA-02**: 运营后台所有使用 mock 数据的 API 调用替换为真实数据库查询
- [x] **DATA-03**: API 响应类型与前端类型定义保持一致（Zod schema 校验）
- [x] **DATA-04**: 空状态（empty state）正确处理，无数据时显示友好提示

### 页面拆分 (Page Split)

- [ ] **PAGE-01**: `apartments/[id]/page.tsx` 拆分为 Page + Section 组件结构
- [ ] **PAGE-02**: 租客端详情页（公寓/房间/租客/租约详情）应用 Page Composition 模式
- [ ] **PAGE-03**: 对话框组件化（Dialog as Component），从页面中提取为独立组件
- [ ] **PAGE-04**: 页面导航上下文完善（面包屑、返回链接、操作步骤指示）

### 组件提取 (Component)

- [ ] **COMP-01**: 数据获取 hooks 封装（useApartment, useRooms, useTenants, useLeases 等）
- [ ] **COMP-02**: 统一页面头部组件（PageHeader）标准化
- [ ] **COMP-03**: 共享 UI 组件补充（StatCard, EmptyState, LoadingState）
- [ ] **COMP-04**: TanStack Query queryKey 规范化，统一缓存策略

### 样式统一 (Style)

- [ ] **STYLE-01**: admin-web 和 tenant-web 设计令牌统一（颜色、间距、字体）
- [ ] **STYLE-02**: 组件行为规范建立（组件在不同状态下的一致性）
- [ ] **STYLE-03**: CSS Variables 主题化机制完善，支持必要的情景覆盖

### 易用性优化 (Usability)

- [ ] **USAB-01**: 租约到期预警提醒功能（租约到期前 N 天提醒）
- [ ] **USAB-02**: 初始水电记录提醒（新租约必须录入初始读数）
- [ ] **USAB-03**: 账单生成流程优化（步骤更清晰，错误提示更明确）
- [ ] **USAB-04**: 列表页筛选和搜索体验优化

### 工程保障 (Engineering)

- [x] **ENG-01**: CI 门禁建立（lint/type-check/test）
- [x] **ENG-02**: 回归测试套件覆盖核心业务流程

## v2 Requirements

下一阶段考虑的功能（当前不需要实现，但需要了解）

### 差异化功能

- **AUTO-01**: 自动账单生成（每月自动生成账单）
- **AUTO-02**: 账单微信支付集成（账单可直接微信支付）
- **AUTO-03**: 多维度运营看板（趋势分析、空房率趋势）

### 移动端

- **MOBI-01**: 现场抄表功能优化
- **MOBI-02**: 移动端账单支付

## Out of Scope

明确排除的功能

| Feature | Reason |
|---------|--------|
| 技术栈更换 | 当前栈已合理，不需要更换 |
| 架构大幅重构 | 只做渐进式优化，不做破坏性重构 |
| 新增主要功能模块 | 保持现有模块结构不变 |
| 对接财务软件（用友/金蝶） | 复杂度高，v2+ 考虑 |
| 短租/日租支持 | 与长租管理逻辑差异大 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| PAGE-01 | Phase 2 | Pending |
| PAGE-02 | Phase 2 | Pending |
| PAGE-03 | Phase 2 | Pending |
| PAGE-04 | Phase 2 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| STYLE-01 | Phase 4 | Pending |
| STYLE-02 | Phase 4 | Pending |
| STYLE-03 | Phase 4 | Pending |
| USAB-01 | Phase 5 | Pending |
| USAB-02 | Phase 5 | Pending |
| USAB-03 | Phase 5 | Pending |
| USAB-04 | Phase 5 | Pending |
| ENG-01 | Phase 1 | Complete |
| ENG-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after initial definition*
