# 前端路由重构 - 设置页面优化

## What This Is

重构 Apartment Ultra 的前端路由结构，尤其是设置页面(/settings)及其子页面，提供更直觉的用户导航体验。

## Core Value

让用户能直觉地在设置页面及其子页面之间导航，没有任何页面会"丢失"。

## Requirements

### Active

- [ ] 统一设置页面的返回导航（所有子页面都能返回到设置首页）
- [ ] 创建 settings 统一布局（layout），提供一致的导航栏
- [ ] 修复链接指向不一致问题（如"组织管理"链接错误）
- [ ] 确保所有前端应用（tenant-web, admin-web, mobile）的设置导航一致

### Out of Scope

- [后端 API 变更] — 仅限前端路由重构
- [新功能开发] — 不添加新功能，仅优化导航

## Context

**现有结构问题：**
- tenant-web/src/app/settings/ 有多个子页面，但无统一 layout
- /settings/team, /settings/permissions, /settings/notifications 等页面没有返回按钮
- /settings/subscription 有多层子页面（purchase, pay, result）
- 移动端 (mobile/) 也有独立的 settings 页面结构

## Constraints

- **[技术限制]**: Next.js App Router 的 layout 机制
- **[兼容性]**: 保持现有 URL 结构，避免破坏已有书签/链接

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 使用 Next.js Layout | 提供统一的导航结构 | — Pending |
| 保持 URL 兼容性 | 避免破坏已有链接 | — Pending |

---
*Last updated: 2026-03-19 after initialization*
