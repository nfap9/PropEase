# E2E 测试覆盖报告

自动生成日期：2026-03-07

## 模块测试覆盖详情

### 业务端 (business)

| 模块 | 测试文件 | 测试用例数 | 状态 |
|------|----------|------------|------|
| 认证 (AUTH) | auth.spec.ts | 16 | ✅ |
| 公寓管理 (APT) | apartments.spec.ts | 15 | ✅ |
| 房间管理 (ROOM) | rooms.spec.ts | 10 | ✅ |
| 租客管理 (TENANT) | tenants.spec.ts | 14 | ✅ |
| 租约管理 (LEASE) | leases.spec.ts | 14 | ✅ |
| 水电录入 (UTIL) | utilities.spec.ts | 14 | ✅ |
| 账单管理 (BILL) | bills.spec.ts | 17 | ✅ |
| 经营分析 (REPORT) | reports.spec.ts | 9 | ✅ |
| 设置模块 (SET) | settings.spec.ts | 13 | ✅ |
| 通知 (NT) | notifications.spec.ts | 6 | ✅ |
| 组织管理 (ORG) | organization.spec.ts | 16 | ✅ |

### 跨模块集成测试

| 流程编号 | 描述 | 状态 |
|----------|------|------|
| BIZ-FLOW-01 | 完整租赁流程 | ✅ |
| BIZ-FLOW-02 | 租约续约流程 | ✅ |
| BIZ-FLOW-03 | 租客换房流程 | ✅ |
| PERM-FLOW-01 | 运营人员权限限制 | ✅ |
| PERM-FLOW-02 | 组织成员权限 | ✅ |
| QUOTA-FLOW-01 | 公寓数量限制 | ✅ |
| QUOTA-FLOW-02 | 房间数量限制 | ✅ |
| QUOTA-FLOW-03 | 成员数量限制 | ✅ |
| SUB-FLOW-01 | 查看订阅列表 | ✅ |
| SUB-FLOW-02 | 套餐升级流程 | ✅ |
| SUB-FLOW-03 | 订阅到期流程 | ✅ |
| DATA-FLOW-01 | 删除公寓-数据级联 | ✅ |
| DATA-FLOW-02 | 删除租客-数据检查 | ✅ |
| DATA-FLOW-03 | 账单金额计算一致性 | ✅ |

### 运营端 (admin)

| 模块 | 测试文件 | 测试用例数 | 状态 |
|------|----------|------------|------|
| 运营账号管理 | admin/users.spec.ts | - | ✅ |
| 运营登录 | admin.guest.spec.ts | - | ✅ |

## 测试配置

- **测试框架**: Playwright
- **基础 URL**: http://localhost:3000
- **API URL**: http://localhost:8000/api/v1
- **浏览器**: Chromium

## 测试账号

- **业务端**: 13800138000 / Test1234
- **运营端**: (配置环境变量)

## 运行测试

```bash
# 安装依赖
pnpm install

# 运行所有测试
pnpm e2e

# 运行特定测试
pnpm playwright test --project=business

# 查看 HTML 报告
pnpm playwright show-report
```
