# 公寓管理字段补全设计

## 背景

原始需求中公寓模型定义了 9 个字段在 DB 层存在但 API/UI 未开放：

- **基本信息**：`floors`、`land_area`、`total_area`
- **上游信息**：`landlord_name`、`landlord_contact`、`contract_start`、`contract_end`、`landlord_rent`
- **经营成本**：`operating_cost`

补全这些字段，让用户能完整记录公寓的物业信息和上游租赁信息。

## 设计决策

1. 公寓表单分两区：基本信息（始终展示）、上游信息（可折叠 `details` 元素）
2. 详情页：在基础信息 tab 内新增"物业信息"区块展示 floors/land_area/total_area；新增"上游信息"独立 tab 展示 landlord_* 和 operating_cost

---

## API 层改动

### 文件：`api/src/routes/v1/apartments.ts`

#### 扩展 `ApartmentCreateSchema`

```typescript
const ApartmentCreateSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
  // 基本信息
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),   // 亩
  total_area: z.number().min(0).optional(),   // 平方米
  // 上游信息
  landlord_name: z.string().max(100).optional(),
  landlord_contact: z.string().max(50).optional(),
  contract_start: z.string().optional(),       // ISO date string
  contract_end: z.string().optional(),         // ISO date string
  landlord_rent: z.number().min(0).optional(),
  // 经营成本
  operating_cost: z.number().min(0).optional(),
});
```

#### 扩展 `ApartmentUpdateSchema`

```typescript
const ApartmentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  landlord_name: z.string().max(100).optional(),
  landlord_contact: z.string().max(50).optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().min(0).optional(),
  operating_cost: z.number().min(0).optional(),
});
```

#### OpenAPI 文档更新

`POST /apartments` 和 `PUT /apartments/{id}` 的 OpenAPI 注释补充所有新字段的 requestBody schema。

#### 响应处理

`GET /apartments/{id}` 直接返回 Prisma 全量对象（包含所有字段），无需改动。

---

### 文件：`api/src/services/apartment.service.ts`

#### 扩展接口

```typescript
export interface CreateApartmentInput {
  name: string;
  address?: string;
  description?: string;
  floors?: number;
  land_area?: number;
  total_area?: number;
  landlord_name?: string;
  landlord_contact?: string;
  contract_start?: string;
  contract_end?: string;
  landlord_rent?: number;
  operating_cost?: number;
}

export interface UpdateApartmentInput {
  name?: string;
  address?: string;
  description?: string;
  floors?: number;
  land_area?: number;
  total_area?: number;
  landlord_name?: string;
  landlord_contact?: string;
  contract_start?: string;
  contract_end?: string;
  landlord_rent?: number;
  operating_cost?: number;
}
```

#### 扩展 `buildCreateData`

```typescript
function buildCreateData(orgId: string, data: CreateApartmentInput): Prisma.ApartmentCreateInput {
  return {
    id: ulid().toLowerCase(),
    organization: { connect: { id: orgId } },
    name: data.name,
    address: data.address,
    description: data.description,
    floors: data.floors,
    land_area: data.land_area,
    total_area: data.total_area,
    landlord_name: data.landlord_name,
    landlord_contact: data.landlord_contact,
    contract_start: data.contract_start ? new Date(data.contract_start) : undefined,
    contract_end: data.contract_end ? new Date(data.contract_end) : undefined,
    landlord_rent: data.landlord_rent,
    operating_cost: data.operating_cost,
  };
}
```

#### 扩展 `buildUpdateData`

```typescript
function buildUpdateData(existing: Apartment, data: UpdateApartmentInput): Prisma.ApartmentUpdateInput {
  return {
    name: data.name ?? existing.name,
    address: data.address ?? existing.address,
    description: data.description ?? existing.description,
    floors: data.floors ?? existing.floors,
    land_area: data.land_area ?? existing.land_area,
    total_area: data.total_area ?? existing.total_area,
    landlord_name: data.landlord_name ?? existing.landlord_name,
    landlord_contact: data.landlord_contact ?? existing.landlord_contact,
    contract_start: data.contract_start ? new Date(data.contract_start) : (existing.contract_start ?? undefined),
    contract_end: data.contract_end ? new Date(data.contract_end) : (existing.contract_end ?? undefined),
    landlord_rent: data.landlord_rent ?? existing.landlord_rent,
    operating_cost: data.operating_cost ?? existing.operating_cost,
  };
}
```

---

## 前端 UI 改动

### 文件：`tenant-web/src/app/apartments/page.tsx`

#### 扩展 schema

```typescript
const apartmentSchema = z.object({
  name: z.string().min(1, '请输入公寓名称'),
  address: z.string().min(1, '请输入公寓地址'),
  description: z.string().optional(),
  // 基本信息
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  // 上游信息
  landlord_name: z.string().optional(),
  landlord_contact: z.string().optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().min(0).optional(),
  // 经营成本
  operating_cost: z.number().min(0).optional(),
});
```

#### 创建 Dialog 表单布局

```
基本信息:
  公寓名称 | 地址
  描述
  楼层数 | 用地面积(亩) | 总面积(㎡)

<details> 上游信息（可折叠）
  房东姓名 | 房东联系方式
  合同开始 | 合同结束
  房东租金(元/月) | 经营成本(元/月)
</details>
```

- `floors` 用 number input（min=1）
- `land_area` / `total_area` / `landlord_rent` / `operating_cost` 用 number input（min=0，步进 0.01）
- `contract_start` / `contract_end` 用 date input

#### 编辑 Dialog

同上，使用 `editForm.reset()` 时需要重置所有新增字段。

#### 表单默认值

```typescript
createForm.init({ name: '', address: '', description: '',
  floors: undefined, land_area: undefined, total_area: undefined,
  landlord_name: '', landlord_contact: '', contract_start: '',
  contract_end: '', landlord_rent: undefined, operating_cost: undefined });
```

#### filterEmptyStrings 处理

`filterEmptyStrings` 作用于表单提交数据，将 `''` 转为 `undefined`，确保可选字段正确处理。

---

### 文件：`tenant-web/src/app/apartments/[id]/page.tsx`

#### 类型扩展

`Apartment` 类型已通过 `Partial<Apartment>` 覆盖所有字段，无需改动 api 类型文件。

#### 基础信息 Tab 改动

在现有基础信息展示区（name/address/description）下方，新增"物业信息"区块：

```tsx
<div className="space-y-2">
  <h3 className="text-sm font-medium text-muted-foreground">物业信息</h3>
  <div className="grid grid-cols-3 gap-4">
    <div>楼层数: {apartment.floors ?? '-'} 层</div>
    <div>用地面积: {apartment.land_area ? `${apartment.land_area} 亩` : '-'}</div>
    <div>总面积: {apartment.total_area ? `${apartment.total_area} ㎡` : '-'}</div>
  </div>
</div>
```

#### 新增"上游信息" Tab

新增 tab 内容：

```
上游信息
  房东: {landlord_name ?? '-'}
  联系方式: {landlord_contact ?? '-'}
  合同期: {contract_start ? format(contract_start) : '-'} ~ {contract_end ? format(contract_end) : '-'}
  房东租金: {landlord_rent ? `¥${landlord_rent}/月` : '-'}
  经营成本: {operating_cost ? `¥${operating_cost}/月` : '-'}
```

- tab 使用 `ScrollArea` 布局
- 日期使用 `format` 函数（从 `date-fns` 导入）展示为 `YYYY-MM-DD` 格式

---

## 组织 notes 字段改动（低工作量）

### 文件：`api/src/routes/v1/organizations.ts`

在 `CreateOrgSchema` 和 `UpdateOrgSchema` 中各加一个 `notes: z.string().max(1000).optional()` 字段即可。响应通过 `toOrgResponse` 透传（目前全量返回）。

### 文件：`tenant-web/src/app/organizations/new/page.tsx`

在创建表单加一行 `<Textarea id="notes" {...form.register('notes')} placeholder="备注信息（选填）" />`。

---

## 租客房 sms_opt_out 改动（低工作量）

仅补 OpenAPI 文档注释和响应说明，不改 UI（UI 保持简洁，短信退订由后台自动处理）。

---

## 实现顺序

1. `api/src/services/apartment.service.ts` — 扩展 service 接口和 buildData
2. `api/src/routes/v1/apartments.ts` — 扩展 Zod schema 和 OpenAPI 注释
3. `tenant-web/src/app/apartments/[id]/page.tsx` — 详情页展示新字段
4. `tenant-web/src/app/apartments/page.tsx` — 表单新增字段
5. `api/src/routes/v1/organizations.ts` — Organization.notes
6. `tenant-web/src/app/organizations/new/page.tsx` — Organization notes 表单

---

## 验证标准

- [ ] 创建公寓时可填入 floors/land_area/total_area/landlord_*/operating_cost
- [ ] 编辑公寓时回显所有新字段并可保存
- [ ] 详情页"基础信息" tab 显示物业信息（floors/land_area/total_area）
- [ ] 详情页有独立的"上游信息" tab 显示房东/合同/成本信息
- [ ] `pnpm type-check` 通过
- [ ] `pnpm lint` 通过
