# Roadmap: Apartment Ultra 优化

## Overview

本路线图面向现有 Apartment Ultra 系统的优化项目，目标是替换 Mock 数据为真实数据库查询、拆分臃肿页面、统一 UI 风格、提升易用性。遵循"先数据后架构"原则：先建立真实数据基础，再基于真实数据流做页面拆分和组件提取，最后统一样式并补充易用性功能。

## Phases

- [x] **Phase 1: 工程基础设施与数据层规范化** - 建立 CI 门禁，将所有 Mock 数据替换为真实 API 调用 (completed 2026-03-26)
- [ ] **Phase 2: 页面拆分规划与导航架构** - 拆分巨型页面，完善页面导航上下文
- [ ] **Phase 3: 组件提取与数据访问 Hooks** - 提取可复用组件和 data hooks
- [ ] **Phase 4: 样式统一与设计系统完善** - 统一设计令牌，完善 CSS 主题化
- [ ] **Phase 5: 易用性优化** - 补充租约预警、初始水电提醒、账单流程优化

## Phase Details

### Phase 1: 工程基础设施与数据层规范化

**Goal**: 建立 CI 门禁防止回归，将租客端和运营后台所有 Mock 数据替换为真实数据库查询，并确保 API 契约与前端类型一致

**Depends on**: Nothing (first phase)

**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, ENG-01, ENG-02

**Success Criteria** (what must be TRUE):
  1. 租客端所有 API 调用使用真实数据库查询，不再返回 mock 数据
  2. 运营后台所有 API 调用使用真实数据库查询，不再返回 mock 数据
  3. API 响应类型与前端 Zod schema 校验通过，类型不一致问题清零
  4. 空状态（无数据时）显示友好提示而非空白或错误
  5. CI 门禁包含 lint/type-check/test，执行失败则无法合并

**Plans**: 1 plan
- [x] 01-01-PLAN.md — Mock数据替换(Reports)、CI门禁修改、EmptyState组件创建

---

### Phase 2: 页面拆分规划与导航架构

**Goal**: 将巨型页面拆分为 Page + Section 组件结构，完善页面导航上下文（面包屑、返回链接、步骤指示）

**Depends on**: Phase 1

**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04

**Success Criteria** (what must be TRUE):
  1. `apartments/[id]/page.tsx` 已拆分为 Page + Section 组件结构，不再是单文件巨无霸
  2. 租客端详情页（公寓/房间/租客/租约）应用 Page Composition 模式
  3. 对话框已组件化（Dialog as Component），不再内联在页面中
  4. 页面导航上下文完善：面包屑显示当前位置，返回链接可用，复杂操作有步骤指示

**Plans**: TBD

---

### Phase 3: 组件提取与数据访问 Hooks

**Goal**: 封装可复用的数据获取 hooks 和共享 UI 组件，统一 TanStack Query queryKey 和缓存策略

**Depends on**: Phase 2

**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04

**Success Criteria** (what must be TRUE):
  1. 数据获取 hooks 已封装（useApartment, useRooms, useTenants, useLeases 等），组件直接调用而非手动 fetch
  2. 页面头部组件（PageHeader）标准化，所有页面使用统一的头部结构
  3. 共享 UI 组件已补充（StatCard, EmptyState, LoadingState），各模块复用一致组件
  4. TanStack Query queryKey 规范化，相同数据的查询使用统一的 key 格式

**Plans**: TBD

---

### Phase 4: 样式统一与设计系统完善

**Goal**: 统一 admin-web 和 tenant-web 的设计令牌，建立组件行为规范，完善 CSS Variables 主题化机制

**Depends on**: Phase 3

**Requirements**: STYLE-01, STYLE-02, STYLE-03

**Success Criteria** (what must be TRUE):
  1. admin-web 和 tenant-web 的颜色、间距、字体等设计令牌已统一
  2. 组件在不同状态下（默认/悬停/激活/禁用）的行为一致
  3. CSS Variables 主题化机制支持必要的情景覆盖，特殊业务模块可局部调整

**Plans**: TBD

---

### Phase 5: 易用性优化

**Goal**: 补充租约到期预警、初始水电记录提醒，优化账单生成流程和列表页筛选体验

**Depends on**: Phase 4

**Requirements**: USAB-01, USAB-02, USAB-03, USAB-04

**Success Criteria** (what must be TRUE):
  1. 租约到期前 N 天显示预警提醒，用户可配置提醒天数
  2. 新租约创建时强制录入初始水电读数，否则无法完成创建流程
  3. 账单生成流程步骤清晰，错误提示明确，用户知道每步在做什么
  4. 列表页筛选和搜索体验流畅，筛选条件组合使用方便

**Plans**: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 1. 工程基础设施与数据层规范化 | 1/1 | Complete   | 2026-03-26 |
| 2. 页面拆分规划与导航架构 | 0/TBD | Not started | - |
| 3. 组件提取与数据访问 Hooks | 0/TBD | Not started | - |
| 4. 样式统一与设计系统完善 | 0/TBD | Not started | - |
| 5. 易用性优化 | 0/TBD | Not started | - |
