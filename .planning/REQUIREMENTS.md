# Requirements: Apartment Ultra Web Testing

**Defined:** 2026-03-18
**Core Value:** 核心业务流程稳定运行

## v1 Requirements

### 测试框架

- [ ] **TEST-01**: 配置 Playwright E2E 测试环境
- [ ] **TEST-02**: 配置 Vitest 单元/组件测试环境
- [ ] **TEST-03**: 创建测试工具函数（登录、API Mock、数据清理）

### 租户端 E2E 测试

- [ ] **TE2E-01**: 用户登录流程测试（手机号+密码）
- [ ] **TE2E-02**: 用户注册流程测试
- [ ] **TE2E-03**: 公寓管理 CRUD 测试
- [ ] **TE2E-04**: 房间管理测试
- [ ] **TE2E-05**: 租客/租约管理测试
- [ ] **TE2E-06**: 账单生成与查看测试

### 运营后台 E2E 测试

- [ ] **AE2E-01**: 运营账号登录测试
- [ ] **AE2E-02**: 组织管理测试
- [ ] **AE2E-03**: 订阅管理测试
- [ ] **AE2E-04**: 服务定价管理测试

### 组件测试

- [ ] **COMP-01**: 关键表单组件测试
- [ ] **COMP-02**: 表格组件测试
- [ ] **COMP-03**: 权限守卫组件测试

## v2 Requirements

- **全面页面覆盖**: 所有页面均添加测试
- **视觉回归测试**: 添加视觉比对
- **CI 集成**: 每次 PR 自动运行

## Out of Scope

| Feature | Reason |
|---------|--------|
| 性能测试 | 超出当前范围 |
| 视觉回归测试 | 暂不需要 |
| 非核心页面测试 | 优先核心流程 |
| CI 集成 | 本地验证优先 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 1 | Pending |
| TEST-02 | Phase 1 | Pending |
| TEST-03 | Phase 1 | Pending |
| TE2E-01 | Phase 2 | Pending |
| TE2E-02 | Phase 2 | Pending |
| TE2E-03 | Phase 2 | Pending |
| TE2E-04 | Phase 2 | Pending |
| TE2E-05 | Phase 2 | Pending |
| TE2E-06 | Phase 2 | Pending |
| AE2E-01 | Phase 3 | Pending |
| AE2E-02 | Phase 3 | Pending |
| AE2E-03 | Phase 3 | Pending |
| AE2E-04 | Phase 3 | Pending |
| COMP-01 | Phase 4 | Pending |
| COMP-02 | Phase 4 | Pending |
| COMP-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
