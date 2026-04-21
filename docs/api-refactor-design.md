# API 参数传递规范重构设计

> 版本：v1.0 | 状态：设计中 | 创建日期：2026-04-21

---

## 一、背景与目标

### 1.1 现状问题

- 列表/查询接口使用 query 参数传参，参数多了不直观
- 部分接口路径参数过多，如 `/:orgId/members/:userId`
- 前端调试时不清晰参数结构

### 1.2 重构目标

- **orgId** → 通过 `X-Org-Id` 请求头传递（已在 `requireOrgMembership` 中支持）
- **业务参数 ≥ 2 个** → 通过请求 body 传递
- **单个资源 ID** → 保持 URL 路径方式

---

## 二、参数传递规范

| 参数类型 | 传递方式 | 示例 |
|---------|---------|------|
| orgId（组织上下文） | `X-Org-Id` 请求头 | `X-Org-Id: org_xxx` |
| 资源标识（单个） | URL 路径 | `GET /bills/:id` |
| 业务参数（≥2个） | 请求 body | `POST /bills/query { lease_id, year, month, status }` |
| 列表查询条件 | 请求 body | `POST /bills/query { ... }` |
| 分页参数 | 请求 body | `{ page, pageSize }` |

---

## 三、需要改动的接口清单

### 3.1 列表查询接口（query → body）

| 模块 | 当前 | 改成 | 说明 |
|------|------|------|------|
| bills | `GET /bills?lease_id&year&month&status` | `POST /bills/query` | |
| bills | `GET /bills/export?status&year&month&exportType` | `POST /bills/export` | |
| utilities | `GET /utilities?room_id&apartment_id&period_year&period_month` | `POST /utilities/query` | |
| utilities | `GET /utilities/export?period_year&period_month&days_range` | `POST /utilities/export` | |
| utilities | `GET /utilities/rooms-missing-initial?period_year&period_month&days_range` | `POST /utilities/rooms-missing-initial` | |
| reports | `GET /reports/income?year&start_month&end_month` | `POST /reports/income` | |
| notifications | `GET /notifications?status&category&limit` | `POST /notifications/query` | |
| tenant-reachability | `GET /deliveries?status&event_type&tenant_id&limit` | `POST /deliveries/query` | |

### 3.2 嵌套资源路径（2个路径参数 → 扁平化）

| 模块 | 当前 | 改成 | 说明 |
|------|------|------|------|
| organizations | `PUT /:orgId/members/:userId` | `PUT /members/:userId` | orgId 从 header 取 |
| organizations | `DELETE /:orgId/members/:userId` | `DELETE /members/:userId` | orgId 从 header 取 |
| subscriptions | `GET /organizations/:org_id/orders/:order_id` | `GET /orders/:order_id` | orgId 从 header 取 |
| subscriptions | `POST /organizations/:org_id/orders/:order_id/simulate-pay` | `POST /orders/:order_id/simulate-pay` | orgId 从 header 取 |

### 3.3 保持不变的接口

| 类型 | 示例 | 理由 |
|------|------|------|
| 单个资源操作 | `GET /bills/:id`, `PUT /bills/:id` | 只有1个路径参数 |
| 无参数的简单操作 | `GET /organizations`, `POST /organizations` | 参数<2个 |
| 特殊 action 接口 | `POST /bills/:id/terminate` | 已是 body 传参 |

---

## 四、具体改动示例

### 4.1 bills 模块

#### 列表查询

```typescript
// 改前
GET /api/v1/bills?lease_id=xxx&year=2026&month=4&status=pending
X-Org-Id: org_xxx

// 改后
POST /api/v1/bills/query
X-Org-Id: org_xxx
Content-Type: application/json

{
  "lease_id": "xxx",
  "year": 2026,
  "month": 4,
  "status": "pending"
}
```

#### 导出

```typescript
// 改前
GET /api/v1/bills/export?status=pending&year=2026&month=4&exportType=unfinished
X-Org-Id: org_xxx

// 改后
POST /api/v1/bills/export
X-Org-Id: org_xxx
Content-Type: application/json

{
  "status": "pending",
  "year": 2026,
  "month": 4,
  "exportType": "unfinished"
}
```

### 4.2 organizations 模块

#### 成员操作

```typescript
// 改前
PUT /api/v1/organizations/:orgId/members/:userId
{
  "role_id": "xxx"
}

DELETE /api/v1/organizations/:orgId/members/:userId

// 改后
PUT /api/v1/members/:userId
X-Org-Id: org_xxx
{
  "role_id": "xxx"
}

DELETE /api/v1/members/:userId
X-Org-Id: org_xxx
```

#### 路由注册改法

```typescript
// 改前
router.put('/:orgId/members/:userId', ctrl.updateMember);
router.delete('/:orgId/members/:userId', ctrl.removeMember);

// 改后
router.put('/:userId', ctrl.updateMember);  // orgId 从 header 获取
router.delete('/:userId', ctrl.removeMember);
```

### 4.3 subscriptions 模块

```typescript
// 改前
GET /api/v1/subscriptions/organizations/:org_id/orders/:order_id
POST /api/v1/subscriptions/organizations/:org_id/orders/:order_id/simulate-pay

// 改后
GET /api/v1/orders/:order_id
POST /api/v1/orders/:order_id/simulate-pay
X-Org-Id: org_xxx
```

---

## 五、Controller 层改动

### 5.1 bills.controller.ts 改动示例

```typescript
// 改前
export async function list(req: Request, res: Response, next: NextFunction) {
  const orgId = await requireOrgMembership(req);
  const filter: BillFilter = {
    leaseId: typeof req.query.lease_id === 'string' ? req.query.lease_id : undefined,
    year: req.query.year != null ? Number(req.query.year) : undefined,
    month: req.query.month != null ? Number(req.query.month) : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
  };
  const list = await defaultBillService.list(orgId, filter);
  res.json(list);
}

// 改后
export const BillQuerySchema = z.object({
  lease_id: z.string().optional(),
  year: z.number().optional(),
  month: z.number().optional(),
  status: z.string().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export async function query(req: Request, res: Response, next: NextFunction) {
  try {
    const orgId = await requireOrgMembership(req);
    const parsed = BillQuerySchema.safeParse(req.body);
    if (!parsed.success) return next(createAppError(422, '参数校验失败'));
    
    const filter: BillFilter = {
      leaseId: parsed.data.lease_id,
      year: parsed.data.year,
      month: parsed.data.month,
      status: parsed.data.status,
    };
    const list = await defaultBillService.list(orgId, filter);
    res.json(list);
  } catch (e) {
    next(e);
  }
}
```

### 5.2 bills.ts 路由改动

```typescript
// 改前
router.get('/', ctrl.list);
router.post('/generate', ctrl.generate);
router.post('/', ctrl.create);
router.get('/export/excel', ctrl.exportExcel);

// 改后
router.post('/query', ctrl.query);  // 列表查询
router.post('/generate', ctrl.generate);
router.post('/', ctrl.create);
router.post('/export', ctrl.exportExcel);  // 导出也改用 body
```

---

## 六、前端适配

### 6.1 API Client 改动建议

```typescript
// packages/web-api-client/src/index.ts

// 统一的列表查询方法
async function queryBills(params: BillQueryParams): Promise<Bill[]> {
  return this.request({
    method: 'POST',
    path: '/bills/query',
    body: params,
    headers: { 'X-Org-Id': this.orgId }
  });
}

// 统一的导出方法
async function exportBills(params: BillExportParams): Promise<Blob> {
  return this.request({
    method: 'POST',
    path: '/bills/export',
    body: params,
    headers: { 'X-Org-Id': this.orgId },
    responseType: 'blob'
  });
}
```

### 6.2 调用方式对比

```typescript
// 改前（query 参数）
const bills = await api.get('/bills', { 
  params: { lease_id, year, month, status } 
});

// 改后（body 传参）
const bills = await api.post('/bills/query', { 
  lease_id, year, month, status 
});
```

---

## 七、文件变更清单

| 文件 | 变更内容 |
|------|----------|
| `api/src/routes/v1/bills.ts` | `GET /` → `POST /query`，`GET /export/excel` → `POST /export` |
| `api/src/routes/v1/bills.controller.ts` | list → query，新增 schema，导出改用 body |
| `api/src/routes/v1/utilities.ts` | query 相关接口改 POST，export 改 POST |
| `api/src/routes/v1/utilities.controller.ts` | 适配 body 解析 |
| `api/src/routes/v1/reports.ts` | income 改 POST |
| `api/src/routes/v1/notifications.ts` | list 改 POST /query |
| `api/src/routes/v1/organizations.ts` | 扁平化 members 路由 |
| `api/src/routes/v1/subscriptions.ts` | 扁平化 orders 路由 |
| `packages/web-api-client/src/index.ts` | 新增统一的 query 方法 |
| `packages/api-contract/src/` | 新增 query 参数类型定义 |

---

## 八、实施计划

### Phase 1: 核心模块（bills, utilities）
- bills 模块重构
- utilities 模块重构

### Phase 2: 报表和通知
- reports 模块重构
- notifications 模块重构

### Phase 3: 嵌套资源扁平化
- organizations 成员管理路由
- subscriptions 订单路由

### Phase 4: 前端适配
- API Client 更新
- 调用处适配

---

## 九、注意事项

1. **向后兼容**：重构期间可保留旧接口，标记 `@deprecated`
2. **Swagger 文档**：同步更新 OpenAPI 描述
3. **测试**：更新单元测试和集成测试
4. **分页**：列表查询接口建议统一增加分页参数 `{ page, pageSize }`

---

*文档版本：v1.0 | 更新日期：2026-04-21*
