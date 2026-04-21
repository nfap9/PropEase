# 讨论议题记录

> 创建于 2026-04-21，小虾 & 搭档

## 待讨论议题

### 1. API 文档规范
- **现状**: Schema 分离在 swagger.ts，路由注释用 JSDoc，两者容易不同步
- **方案**: Schema 内联到路由文件；建立 docs/api/ 模块文档；添加 openapi 校验脚本
- **状态**: 进行中（已建立共享 schemas）
- **已完成**:
  - ✅ 创建 `api/src/lib/schemas.ts` 集中管理 Zod schemas
  - ✅ bills.ts/bills.controller.ts 作为示例
  - ⚠️ zod-to-openapi 0.2.1 与当前 Zod 版本不兼容，暂用手动同步方案
- **待完成**:
  - 逐步迁移其他路由的 schemas 到 lib/schemas.ts
  - 考虑升级 zod-to-openapi 或使用其他方案实现自动同步

### 2. 业务流程文档扩充
- **状态**: 大部分已完成，详见 business-flow.md v2.0
- **已完成**:
  - ✅ 费用项体系（OrgFeeItem 三层架构）
  - ✅ 角色权限矩阵（预制角色 + 权限码体系）
  - ✅ 状态机细节（Room/Lease/Bill/Payment/Subscription）
  - ✅ 异常流程（退租、水电异常、超期占用、钥匙押金）
  - ✅ 账单调整/冲销规则（方案四：红冲+新出）
- **待补充**:
  - 通知触发规则 + 模板（站内通知） ✅ 已完成，见 notification-spec.md v1.0
  - 完整字段说明（entity-spec.md） ✅ 已完成，共 31 个 entity
- **待开发**:
  - 账单冲销功能：Bill 表新增字段 + 账单调整 API + 前端
  - 事件触发通知：N1（账单生成）、N4（收款到账）、N6（租约结束）、N7（水电异常）需从定时轮询改为事件实时触发

### 3. 数据库迁移规范
- **现状**: 无明确生产变更流程
- **需确定**: migration 管理流程、review 机制、部署时序
- **状态**: 待讨论

### 4. 测试规范
- **现状**: 有 E2E（Playwright），单元测试和集成测试几乎空白
- **需确定**: 
  - 单元测试覆盖哪些核心逻辑
  - 集成测试范围
  - 测试覆盖率目标
  - CI 接入方式
- **状态**: 待讨论

### 5. 项目规范 & 开发流程
- **需确定**:
  - Git commit 规范
  - Code review 流程
  - 分支策略
  - 发布节奏
- **状态**: 待讨论

---

## 已完成讨论

- 业务流程文档扩充（business-flow.md v2.0）
- 通知规范（notification-spec.md v1.0）
- Entity 字段说明（entity-spec.md v1.0，共 31 个 entity）
