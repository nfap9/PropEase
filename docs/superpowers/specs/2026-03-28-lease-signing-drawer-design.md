# 签约抽屉组件设计

## 概述

将现有签约对话框改为抽屉组件（Sheet），分为房间信息、租客信息、合同信息三个区域。

## 组件结构

### 1. 主抽屉：LeaseSigningDrawer

使用 `Sheet` 组件，右侧弹出，宽度 `max-w-2xl`。

**Props:**
```typescript
interface LeaseSigningDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;        // 指定房间时只读
  onSuccess?: () => void;
}
```

**布局分区（使用 `<Separator />` 分割）：**

#### 区域一：房间信息
- 公寓下拉选择 → 房间下拉选择（仅显示空置房间 `status === 'available'`）
- 指定房间时：显示只读的房间信息（公寓名 - 房间号）

#### 区域二：租客信息
- 表单字段：
  - 租客姓名
  - 联系电话
  - 身份证号
  - 紧急联系人
  - 紧急联系人电话
  - 备注
- "选择已有租客" 按钮：点击后打开租客搜索抽屉

#### 区域三：合同信息
- 租期：开始日期、结束日期（可选）
- 月租、押金
- 水电单价（从公寓配置读取默认值）
- 额外费用（多选费用类型，可修改价格）

#### 页脚
- 取消按钮
- 确认签约按钮

---

### 2. 租客搜索抽屉：TenantSearchDrawer

**Props:**
```typescript
interface TenantSearchDrawerProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (tenant: Tenant) => void;  // 选择后回填
}
```

**功能：**
- 输入框搜索（按姓名/电话搜索）
- 显示已有租客列表
- 点击选中后回填所有字段到主抽屉表单
- 按身份证号判断是否重复

---

## 表单验证

```typescript
const leaseSigningSchema = z.object({
  room_id: z.string().min(1, '请选择房间'),
  tenant_name: z.string().min(1, '请输入租客姓名'),
  tenant_phone: z.string().min(1, '请输入联系电话'),
  tenant_id_card: z.string().optional(),
  tenant_emergency_contact: z.string().optional(),
  tenant_emergency_phone: z.string().optional(),
  tenant_notes: z.string().optional(),
  start_date: z.string().min(1, '请选择开始日期'),
  end_date: z.string().optional(),
  monthly_rent: z.coerce.number().min(0, '月租不能为负'),
  deposit: z.coerce.number().min(0, '押金不能为负').optional(),
  water_rate: z.coerce.number().min(0).optional(),
  electricity_rate: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
  selectedFees: z.array(feeSchema).optional(),
});
```

---

## 签约逻辑

### 提交数据流程

1. **按身份证号查询已有租客**
   - `GET /tenants?org_id=xxx&search=id_card`

2. **根据查询结果决策**
   - 存在：执行 `PUT /tenants/{id}` 更新租客信息
   - 不存在：执行 `POST /tenants` 创建新租客

3. **创建租约**
   - `POST /leases`（后端自动创建首个账单）

### 首个账单自动创建（后端）

后端在 `POST /leases` 成功时，自动创建第一个账单：
- 账单月份：签约月份
- 账单金额：月租 + 押金 + 额外费用（月费用总和）
- 账单状态：pending

---

## 涉及的文件变更

### 新增
- `tenant-web/src/features/leases/components/lease-signing-drawer.tsx` - 主抽屉组件
- `tenant-web/src/features/leases/components/tenant-search-drawer.tsx` - 租客搜索抽屉

### 修改
- `tenant-web/src/features/leases/components/leases-page-content.tsx` - 替换对话框为抽屉
- `tenant-web/src/features/leases/leases.hooks.ts` - 添加签约相关 hooks
- `packages/api-contract/src/leases.ts` - 如需新增字段
- 后端 `api/src/services/lease.service.ts` - 签约时自动创建首个账单

---

## 状态管理

使用 React Hook Form 管理表单状态，通过以下 hooks：

- `useLeaseSigningDrawer` - 主抽屉状态
- `useTenantSearchDrawer` - 租客搜索抽屉状态

---

## 错误处理

- 表单验证错误：显示在对应字段下方
- API 错误：使用 sonner toast 提示
- 签约成功：toast 提示 "签约成功"，关闭抽屉，刷新列表
