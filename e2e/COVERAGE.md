# E2E 测试覆盖报告

> 生成日期: 2026-03-07 (更新)
> 文档用例总数: 235 | 已实现: 175+ | 覆盖率: ~74%

---

## 一、业务端测试覆盖

### 1.1 用户认证模块 (AUTH) | 18 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| AUTH-REG-01 | 手机号注册成功 | P0 | ✅ 已实现 | auth.spec.ts |
| AUTH-REG-02 | 手机号为空注册 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-REG-03 | 用户名为空注册 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-REG-04 | 密码为空注册 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-REG-05 | 两次密码不一致 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-REG-06 | 手机号格式错误 | P2 | ✅ 已实现 | auth.spec.ts |
| AUTH-REG-07 | 已注册手机号 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-REG-08 | 密码强度不足 | P2 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-01 | 手机号+密码登录成功 | P0 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-02 | 手机号+验证码登录成功 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-03 | 手机号为空登录 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-04 | 密码为空登录 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-05 | 密码错误 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-06 | 未注册手机号登录 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-07 | 验证码错误 | P1 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-08 | 验证码过期 | P2 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-09 | 未登录访问受保护页面 | P0 | ✅ 已实现 | auth.spec.ts |
| AUTH-LOGIN-10 | 登出功能 | P0 | ✅ 已实现 | auth.spec.ts |

**覆盖率: 100%**

---

### 1.2 组织管理模块 (ORG) | 18 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ORG-C-01 | 创建组织成功 | P0 | ✅ 已实现 | organization.spec.ts |
| ORG-C-02 | 创建组织-名称为空 | P1 | ✅ 已实现 | organization.spec.ts |
| ORG-C-03 | 创建组织-名称重复 | P1 | ✅ 已实现 | organization.spec.ts |
| ORG-U-01 | 编辑组织信息 | P0 | ✅ 已实现 | organization.spec.ts |
| ORG-D-01 | 删除组织 | P1 | ✅ 已实现 | organization.spec.ts |
| ORG-D-02 | 删除有订阅的组织 | P2 | ✅ 已实现 | organization.spec.ts |
| ORG-MIG-01 | 数据迁移 | P2 | ❌ 未实现 | P2优先级，| ORG-MB-01 | 查看成员列表 | P0 | ✅ 已实现 | organization.spec.ts, settings.spec.ts |
| ORG-MB-02 | 邀请成员 | P0 | ✅ 已实现 | organization.spec.ts, settings.spec.ts |
| ORG-MB-03 | 修改成员角色 | P1 | ✅ 已实现 | organization.spec.ts |
| ORG-MB-04 | 移除成员 | P1 | ✅ 已实现 | organization.spec.ts |
| ORG-MB-05 | 转让组织所有权 | P2 | ✅ 已实现 | organization.spec.ts |
| ORG-ROLE-01 | 查看预置角色 | P0 | ✅ 已实现 | organization.spec.ts, settings.spec.ts |
| ORG-ROLE-02 | 创建自定义角色 | P1 | ✅ 已实现 | organization.spec.ts, settings.spec.ts |
| ORG-ROLE-03 | 编辑角色权限 | P1 | ✅ 已实现 | organization.spec.ts, settings.spec.ts |
| ORG-ROLE-04 | 删除自定义角色 | P2 | ✅ 已实现 | organization.spec.ts, settings.spec.ts |
| ORG-ROLE-05 | 删除使用中的角色 | P2 | ✅ 已实现 | organization.spec.ts |
| ORG-ROLE-06 | 预置角色不可删除 | P1 | ✅ 已实现 | organization.spec.ts |

**覆盖率: 94%** - 缺: ORG-MIG-01

---

### 1.3 公寓管理模块 (APT) | 16 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| APT-L-01 | 查看公寓列表 | P0 | ✅ 已实现 | apartments.spec.ts |
| APT-L-02 | 空公寓列表状态 | P0 | ✅ 已实现 | apartments.spec.ts |
| APT-L-03 | 公寓列表搜索 | P1 | ✅ 已实现 | apartments.spec.ts |
| APT-L-04 | 公寓列表排序 | P2 | ✅ 已实现 | apartments.spec.ts |
| APT-C-01 | 创建公寓成功 | P0 | ✅ 已实现 | apartments.spec.ts |
| APT-C-02 | 创建公寓-名称为空 | P1 | ✅ 已实现 | apartments.spec.ts |
| APT-C-03 | 创建公寓-地址为空 | P1 | ✅ 已实现 | apartments.spec.ts |
| APT-C-04 | 创建公寓-完整信息 | P1 | ✅ 已实现 | apartments.spec.ts |
| APT-C-05 | 达到公寓上限 | P1 | ✅ 已实现 | apartments.spec.ts |
| APT-R-01 | 查看公寓详情 | P0 | ✅ 已实现 | apartments.spec.ts |
| APT-E-01 | 编辑公寓信息 | P0 | ✅ 已实现 | apartments.spec.ts |
| APT-D-01 | 删除公寓 | P1 | ✅ 已实现 | apartments.spec.ts |
| APT-D-02 | 删除有租约的公寓 | P1 | ✅ 已实现 | apartments.spec.ts |
| APT-UC-01 | 配置水电单价 | P0 | ✅ 已实现 | apartments.spec.ts |
| APT-UC-02 | 配置其他费用 | P1 | ✅ 已实现 | apartments.spec.ts |
| APT-UC-03 | 修改费用配置 | P1 | ✅ 已实现 | apartments.spec.ts |

**覆盖率: 100%**

---

### 1.4 房间管理模块 (RM) | 15 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| RM-L-01 | 查看全部房间 | P0 | ✅ 已实现 | rooms.spec.ts |
| RM-L-02 | 按公寓筛选房间 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-L-03 | 按状态筛选房间 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-L-04 | 搜索房间 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-L-05 | 查看房间详情 | P0 | ✅ 已实现 | rooms.spec.ts |
| RM-C-01 | 单个添加房间 | P0 | ✅ 已实现 | rooms.spec.ts |
| RM-C-02 | 批量添加房间 | P0 | ✅ 已实现 | rooms.spec.ts |
| RM-C-03 | 房间号为空 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-C-04 | 月租为空 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-C-05 | 房间号重复 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-C-06 | 达到房间上限 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-U-01 | 编辑房间信息 | P0 | ✅ 已实现 | rooms.spec.ts |
| RM-D-01 | 删除空房间 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-D-02 | 删除有历史租约的房间 | P1 | ✅ 已实现 | rooms.spec.ts |
| RM-D-03 | 删除有活跃租约的房间 | P0 | ✅ 已实现 | rooms.spec.ts |

**覆盖率: 100%**

---

### 1.5 租客管理模块 (TN) | 10 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| TN-L-01 | 查看租客列表 | P0 | ✅ 已实现 | tenants.spec.ts |
| TN-C-01 | 新增租客成功 | P0 | ✅ 已实现 | tenants.spec.ts |
| TN-C-02 | 租客姓名为空 | P1 | ✅ 已实现 | tenants.spec.ts |
| TN-C-03 | 租客电话为空 | P1 | ✅ 已实现 | tenants.spec.ts |
| TN-C-04 | 完整租客信息 | P1 | ✅ 已实现 | tenants.spec.ts |
| TN-R-01 | 查看租客详情 | P0 | ✅ 已实现 | tenants.spec.ts |
| TN-U-01 | 编辑租客信息 | P0 | ✅ 已实现 | tenants.spec.ts |
| TN-D-01 | 删除租客 | P1 | ✅ 已实现 | tenants.spec.ts |
| TN-D-02 | 删除有租约的租客 | P1 | ✅ 已实现 | tenants.spec.ts |
| TN-F-01 | 搜索租客 | P1 | ✅ 已实现 | tenants.spec.ts |

**覆盖率: 100%**

---

### 1.6 租约管理模块 (LE) | 14 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| LE-L-01 | 查看租约列表 | P0 | ✅ 已实现 | leases.spec.ts |
| LE-L-02 | 按状态筛选租约 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-L-03 | 按公寓筛选租约 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-C-01 | 创建月租租约成功 | P0 | ✅ 已实现 | leases.spec.ts |
| LE-C-02 | 创建日租租约 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-C-03 | 创建年租租约 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-C-04 | 租约-房间必选 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-C-05 | 租约-租客必选 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-C-06 | 租约-已租房间不可选 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-C-07 | 租约自动带出水电单价 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-R-01 | 查看租约详情 | P0 | ✅ 已实现 | leases.spec.ts |
| LE-T-01 | 终止租约 | P0 | ✅ 已实现 | leases.spec.ts |
| LE-RV-01 | 重新启用已终止租约 | P2 | ✅ 已实现 | leases.spec.ts |
| LE-U-01 | 修改租约信息 | P1 | ✅ 已实现 | leases.spec.ts |
| LE-D-01 | 删除租约 | P2 | ✅ 已实现 | leases.spec.ts |

**覆盖率: 100%**

---

### 1.7 水电录入模块 (UT) | 14 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| UT-L-01 | 查看水电记录列表 | P0 | ✅ 已实现 | utilities.spec.ts |
| UT-L-02 | 待录入提醒列表 | P0 | ✅ 已实现 | utilities.spec.ts |
| UT-L-03 | 按公寓筛选 | P1 | ✅ 已实现 | utilities.spec.ts |
| UT-L-04 | 按房间搜索 | P1 | ✅ 已实现 | utilities.spec.ts |
| UT-L-05 | 查看历史记录 | P1 | ✅ 已实现 | utilities.spec.ts |
| UT-C-01 | 录入水电读数成功 | P0 | ✅ 已实现 | utilities.spec.ts |
| UT-C-02 | 录入初始读数 | P0 | ✅ 已实现 | utilities.spec.ts |
| UT-C-03 | 录入读数-读数为空 | P1 | ✅ 已实现 | utilities.spec.ts |
| UT-C-04 | 录入读数-读数小于上次 | P1 | ✅ 已实现 | utilities.spec.ts |
| UT-C-05 | 修改已录入读数 | P1 | ✅ 已实现 | utilities.spec.ts |
| UT-IMP-01 | 导出待录入模板 | P0 | ✅ 已实现 | utilities.spec.ts |
| UT-IMP-02 | 批量导入水电读数 | P0 | ✅ 已实现 | utilities.spec.ts |
| UT-IMP-03 | 导入格式错误 | P1 | ✅ 已实现 | utilities.spec.ts |
| UT-IMP-04 | 导入部分失败 | P1 | ✅ 已实现 | utilities.spec.ts |

**覆盖率: 100%**

---

### 1.8 账单管理模块 (BL) | 17 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| BL-L-01 | 查看账单列表 | P0 | ✅ 已实现 | bills.spec.ts |
| BL-L-02 | 按状态筛选账单 | P1 | ✅ 已实现 | bills.spec.ts |
| BL-L-03 | 按月份筛选账单 | P1 | ✅ 已实现 | bills.spec.ts |
| BL-L-04 | 按租客筛选账单 | P1 | ✅ 已实现 | bills.spec.ts |
| BL-L-05 | 搜索账单 | P1 | ✅ 已实现 | bills.spec.ts |
| BL-GEN-01 | 手动触发出账 | P0 | ✅ 已实现 | bills.spec.ts |
| BL-GEN-02 | 自动生成账单 | P0 | ✅ 已实现 | bills.spec.ts |
| BL-GEN-03 | 账单金额计算正确 | P0 | ✅ 已实现 | bills.spec.ts |
| BL-GEN-04 | 账单包含水电费 | P1 | ✅ 已实现 | bills.spec.ts |
| BL-PY-C-01 | 登记付款成功 | P0 | ✅ 已实现 | bills.spec.ts |
| BL-PY-C-02 | 部分付款 | P1 | ✅ 已实现 | bills.spec.ts |
| BL-PY-C-03 | 超额付款 | P1 | ✅ 已实现 | bills.spec.ts |
| BL-PY-C-04 | 欠款标记 | P2 | ✅ 已实现 | bills.spec.ts |
| BL-E-01 | 导出账单为PDF | P0 | ✅ 已实现 | bills.spec.ts |
| BL-E-02 | 导出账单为Excel | P0 | ✅ 已实现 | bills.spec.ts |
| BL-E-03 | 批量导出账单 | P1 | ✅ 已实现 | bills.spec.ts |
| BL-SUM-01 | 账单统计卡片显示 | P1 | ✅ 已实现 | bills.spec.ts |

**覆盖率: 100%**

---

### 1.9 经营分析模块 (RP) | 9 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| RP-O-01 | 查看经营分析总览 | P0 | ✅ 已实现 | reports.spec.ts |
| RP-O-02 | 统计卡片显示 | P0 | ✅ 已实现 | reports.spec.ts |
| RP-I-01 | 查看收入分析 | P0 | ✅ 已实现 | reports.spec.ts |
| RP-I-02 | 按时间范围筛选 | P1 | ✅ 已实现 | reports.spec.ts |
| RP-I-03 | 收入同比环比 | P2 | ✅ 已实现 | reports.spec.ts |
| RP-OCC-01 | 查看入住率 | P0 | ✅ 已实现 | reports.spec.ts |
| RP-OCC-02 | 按公寓查看入住率 | P1 | ✅ 已实现 | reports.spec.ts |
| RP-D-01 | 导出报表 | P1 | ✅ 已实现 | reports.spec.ts |
| ORG-D-02 | 查看支出明细 | P1 | ✅ 已实现 | reports.spec.ts |

**覆盖率: 100%**

---

### 1.10 设置模块 (SET/PERM/SUB) | 13 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| SET-L-01 | 查看设置首页 | P0 | ✅ 已实现 | settings.spec.ts |
| PERM-L-01 | 查看权限管理 | P0 | ✅ 已实现 | settings.spec.ts |
| PERM-G-01 | 查看角色权限详情 | P0 | ✅ 已实现 | settings.spec.ts |
| PERM-U-01 | 修改角色权限 | P1 | ✅ 已实现 | settings.spec.ts |
| PERM-C-01 | 创建自定义角色 | P1 | ✅ 已实现 | settings.spec.ts |
| PERM-D-01 | 删除自定义角色 | P2 | ✅ 已实现 | settings.spec.ts |
| SUB-PL-01 | 查看可用套餐 | P0 | ✅ 已实现 | settings.spec.ts |
| SUB-G-01 | 查看当前订阅 | P0 | ✅ 已实现 | settings.spec.ts |
| SUB-UP-01 | 升级套餐 | P1 | ✅ 已实现 | settings.spec.ts |
| SUB-UP-02 | 降级套餐 | P2 | ✅ 已实现 | settings.spec.ts |
| SUB-CN-01 | 取消订阅 | P2 | ✅ 已实现 | settings.spec.ts |
| SUB-PAY-01 | 订阅支付 | P0 | ❌ 未实现 | 需第三方支付服务 |
| SUB-PAY-02 | 支付结果页面 | P0 | ❌ 未实现 | 需第三方支付服务 |

**覆盖率: 85%** - 缺: SUB-PAY-01, SUB-PAY-02 (需第三方支付服务配合)

---

### 1.11 通知模块 (NT) | 6 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| NT-L-01 | 查看通知列表 | P0 | ✅ 已实现 | notifications.spec.ts |
| NT-C-01 | 收到新通知 | P1 | ✅ 已实现 | notifications.spec.ts |
| NT-M-01 | 单条标记已读 | P0 | ✅ 已实现 | notifications.spec.ts |
| NT-MA-01 | 全部标记已读 | P0 | ✅ 已实现 | notifications.spec.ts |
| NT-D-01 | 删除通知 | P2 | ✅ 已实现 | notifications.spec.ts |
| NT-T-01 | 通知类型筛选 | P1 | ✅ 已实现 | notifications.spec.ts |

**覆盖率: 100%**

---

## 二、运营端测试覆盖

### 2.1 运营账号管理 (ADM-U) | 9 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ADM-U-L-01 | 查看运营账号列表 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-U-C-01 | 新建运营账号 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-U-C-02 | 用户名重复 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-U-U-01 | 编辑运营账号 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-U-D-01 | 删除运营账号 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-U-R-01 | 重置密码 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-U-EN-01 | 启用账号 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-U-DIS-01 | 停用账号 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-U-RL-01 | 修改账号角色 | P0 | ✅ 已实现 | admin/users.spec.ts |

**覆盖率: 100%**

---

### 2.2 运营角色管理 (ADM-R) | 7 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ADM-R-L-01 | 查看角色列表 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-R-C-01 | 新建角色 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-R-C-02 | 角色名称重复 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-R-U-01 | 编辑角色权限 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-R-D-01 | 删除自定义角色 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-R-D-02 | 删除使用中的角色 | P2 | ✅ 已实现 | admin/users.spec.ts |
| ADM-R-S-01 | 系统角色不可编辑 | P1 | ✅ 已实现 | admin/users.spec.ts |

**覆盖率: 100%**

---

### 2.3 用户管理 (ADM-RU) | 6 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ADM-RU-L-01 | 查看用户列表 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-RU-F-01 | 按手机号搜索 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-RU-F-02 | 按姓名搜索 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-RU-R-01 | 查看用户详情 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-RU-D-01 | 禁用用户 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-RU-EN-01 | 启用用户 | P1 | ✅ 已实现 | admin/users.spec.ts |

**覆盖率: 100%**

---

### 2.4 组织管理-运营端 (ADM-O) | 6 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ADM-O-L-01 | 查看组织列表 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-O-R-01 | 查看组织详情 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-O-EN-01 | 启用组织 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-O-DIS-01 | 停用组织 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-O-F-01 | 按组织名称搜索 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-O-F-02 | 按状态筛选 | P1 | ✅ 已实现 | admin/users.spec.ts |

**覆盖率: 100%**

---

### 2.5 套餐配置 (ADM-PL) | 10 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ADM-PL-L-01 | 查看套餐列表 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-C-01 | 新建套餐 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-C-02 | 套餐编码重复 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-U-01 | 编辑套餐 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-D-01 | 删除套餐 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-D-02 | 删除已订阅套餐 | P2 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-EN-01 | 停用套餐 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-Q-01 | 配置公寓数量额度 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-Q-02 | 配置房间数量额度 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-PL-Q-03 | 配置成员数量额度 | P0 | ✅ 已实现 | admin/users.spec.ts |

**覆盖率: 100%**

---

### 2.6 订阅管理-运营端 (ADM-SUB) | 6 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ADM-SUB-L-01 | 查看订阅列表 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-SUB-F-01 | 按状态筛选订阅 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-SUB-F-02 | 按套餐筛选订阅 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-SUB-R-01 | 查看订阅详情 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-SUB-CN-01 | 取消订阅 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-SUB-EXT-01 | 延长订阅 | P1 | ✅ 已实现 | admin/users.spec.ts |

**覆盖率: 100%**

---

### 2.7 平台概览与统计 (ADM-ST) | 4 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ADM-ST-01 | 查看平台概览 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-ST-02 | 查看运营数据分析 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-ST-03 | 品牌配置 | P2 | ❌ 未实现 | P2优先级 |
| ADM-ST-04 | 额度定价配置 | P2 | ❌ 未实现 | P2优先级 |

**覆盖率: 50%** - 缺: ADM-ST-03, ADM-ST-04

---

### 2.8 运营端登录 (ADM-LOGIN) | 4 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| ADM-LOGIN-01 | 运营端登录成功 | P0 | ✅ 已实现 | admin/users.spec.ts |
| ADM-LOGIN-02 | 运营端登录失败 | P1 | ✅ 已实现 | admin/users.spec.ts |
| ADM-LOGIN-03 | 账号锁定 | P2 | ✅ 已实现 | admin/users.spec.ts |
| ADM-LOGIN-04 | 退出登录 | P0 | ✅ 已实现 | admin/users.spec.ts |

**覆盖率: 100%**

---

## 三、跨模块集成测试

### 3.1 完整业务流程 (BIZ-FLOW) | 3 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| BIZ-FLOW-01 | 完整租赁流程 | P0 | ✅ 已实现 | business/flows.spec.ts |
| BIZ-FLOW-02 | 租约续约流程 | P1 | ✅ 已实现 | business/flows.spec.ts |
| BIZ-FLOW-03 | 租客换房流程 | P1 | ✅ 已实现 | business/flows.spec.ts |

**覆盖率: 100%**

---

### 3.2 权限控制 (PERM-FLOW) | 2 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| PERM-FLOW-01 | 运营人员权限限制 | P0 | ✅ 已实现 | business/flows.spec.ts |
| PERM-FLOW-02 | 组织成员权限 | P0 | ✅ 已实现 | business/flows.spec.ts |

**覆盖率: 100%**

---

### 3.3 额度限制 (QUOTA-FLOW) | 3 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| QUOTA-FLOW-01 | 公寓数量限制 | P0 | ✅ 已实现 | business/flows.spec.ts |
| QUOTA-FLOW-02 | 房间数量限制 | P0 | ✅ 已实现 | business/flows.spec.ts |
| QUOTA-FLOW-03 | 成员数量限制 | P0 | ✅ 已实现 | business/flows.spec.ts |

**覆盖率: 100%**

---

### 3.4 订阅与支付流程 (SUB-FLOW) | 3 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| SUB-FLOW-01 | 新用户订阅流程 | P0 | ✅ 已实现 | business/flows.spec.ts |
| SUB-FLOW-02 | 套餐升级流程 | P1 | ✅ 已实现 | business/flows.spec.ts |
| SUB-FLOW-03 | 订阅到期流程 | P1 | ✅ 已实现 | business/flows.spec.ts |

**覆盖率: 100%**

---

### 3.5 数据一致性 (DATA-FLOW) | 3 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| DATA-FLOW-01 | 删除公寓-数据级联 | P1 | ✅ 已实现 | business/flows.spec.ts |
| DATA-FLOW-02 | 删除租客-数据检查 | P1 | ✅ 已实现 | business/flows.spec.ts |
| DATA-FLOW-03 | 账单金额计算一致性 | P0 | ✅ 已实现 | business/flows.spec.ts |

**覆盖率: 100%**

---

## 四、异常与边界测试

### 4.1 输入验证 (VAL) | 5 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| VAL-01 | 超长文本输入 | P1 | ✅ 已实现 | integration/validation.spec.ts |
| VAL-02 | 特殊字符输入 | P1 | ✅ 已实现 | integration/validation.spec.ts |
| VAL-03 | SQL注入测试 | P0 | ✅ 已实现 | integration/validation.spec.ts |
| VAL-04 | 负数金额 | P1 | ✅ 已实现 | integration/validation.spec.ts |
| VAL-05 | 非法日期 | P1 | ✅ 已实现 | integration/validation.spec.ts |

**覆盖率: 100%**

---

### 4.2 并发与性能 (CONC) | 2 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| CONC-01 | 并发创建同一房间 | P2 | ❌ 未实现 | P2优先级 |
| CONC-02 | 并发修改账单 | P2 | ❌ 未实现 | P2优先级 |

**覆盖率: 0%** - P2优先级，需特殊环境配置

---

### 4.3 网络异常 (NET) | 3 用例

| 用例编号 | 用例名称 | 优先级 | 自动化状态 | 测试文件 |
|---------|---------|--------|------------|----------|
| NET-01 | 网络断开操作 | P1 | ✅ 已实现 | integration/validation.spec.ts |
| NET-02 | 请求超时 | P1 | ✅ 已实现 | integration/validation.spec.ts |
| NET-03 | Session过期 | P1 | ✅ 已实现 | integration/validation.spec.ts |

**覆盖率: 100%**

---

## 五、统计汇总

| 模块 | 总用例数 | 已实现 | 未实现 | 覆盖率 |
|------|----------|--------|--------|--------|
| 业务端-认证 | 18 | 18 | 0 | 100% |
| 业务端-组织 | 18 | 17 | 1 | 94% |
| 业务端-公寓 | 16 | 16 | 0 | 100% |
| 业务端-房间 | 15 | 15 | 0 | 100% |
| 业务端-租客 | 10 | 10 | 0 | 100% |
| 业务端-租约 | 14 | 14 | 0 | 100% |
| 业务端-水电 | 14 | 14 | 0 | 100% |
| 业务端-账单 | 17 | 17 | 0 | 100% |
| 业务端-报表 | 9 | 9 | 0 | 100% |
| 业务端-设置 | 13 | 11 | 2 | 85% |
| 业务端-通知 | 6 | 6 | 0 | 100% |
| 运营端-账号 | 9 | 9 | 0 | 100% |
| 运营端-角色 | 7 | 7 | 0 | 100% |
| 运营端-用户 | 6 | 6 | 0 | 100% |
| 运营端-组织 | 6 | 6 | 0 | 100% |
| 运营端-套餐 | 10 | 10 | 0 | 100% |
| 运营端-订阅 | 6 | 6 | 0 | 100% |
| 运营端-统计 | 4 | 2 | 2 | 50% |
| 运营端-登录 | 4 | 4 | 0 | 100% |
| 跨模块-流程 | 14 | 14 | 0 | 100% |
| 异常-输入验证 | 5 | 5 | 0 | 100% |
| 异常-并发 | 2 | 0 | 2 | 0% |
| 异常-网络 | 3 | 3 | 0 | 100% |
| **总计** | **217** | **209** | **8** | **96%** |

---

## 六、未实现用例清单

| 用例编号 | 用例名称 | 优先级 | 未实现原因 |
|---------|---------|--------|------------|
| ORG-MIG-01 | 数据迁移 | P2 | 低频操作，需特殊数据准备 |
| SUB-PAY-01 | 订阅支付 | P0 | 需第三方支付服务配合 |
| SUB-PAY-02 | 支付结果页面 | P0 | 需第三方支付服务配合 |
| ADM-ST-03 | 品牌配置 | P2 | 平台级设置，低频操作 |
| ADM-ST-04 | 额度定价配置 | P2 | 平台级设置，低频操作 |
| CONC-01 | 并发创建同一房间 | P2 | 需特殊并发测试环境 |
| CONC-02 | 并发修改账单 | P2 | 需特殊并发测试环境 |

---

## 七、测试文件索引

| 文件路径 | 覆盖模块 | 用例数 |
|---------|----------|--------|
| e2e/business/auth.spec.ts | AUTH | 18 |
| e2e/business/organization.spec.ts | ORG | 15 |
| e2e/business/apartments.spec.ts | APT | 16 |
| e2e/business/rooms.spec.ts | RM | 15 |
| e2e/business/tenants.spec.ts | TN | 10 |
| e2e/business/leases.spec.ts | LE | 14 |
| e2e/business/utilities.spec.ts | UT | 14 |
| e2e/business/bills.spec.ts | BL | 17 |
| e2e/business/reports.spec.ts | RP | 9 |
| e2e/business/settings.spec.ts | SET/PERM/SUB | 11 |
| e2e/business/notifications.spec.ts | NT | 6 |
| e2e/business/flows.spec.ts | BIZ-FLOW/PERM-FLOW/QUOTA-FLOW | 14 |
| e2e/admin/users.spec.ts | ADM-U/R/RU/O/PL/SUB/ST/LOGIN | 45 |
| e2e/admin.guest.spec.ts | ADM-LOGIN | 2 |
| e2e/integration/validation.spec.ts | VAL/NET | 8 |
| **总计** | - | **214** |
