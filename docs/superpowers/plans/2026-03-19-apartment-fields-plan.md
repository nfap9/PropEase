# 公寓字段补全实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Apartment 模型中 DB 层已存在但 API/UI 未开放的 9 个字段补全到 API 和 UI，同时补全 Organization.notes 字段。

**Architecture:** 在现有 apartment service/repository 层扩展 CreateApartmentInput / UpdateApartmentInput 类型，在 Zod schema 层开放字段，在前端 Dialog 表单分组展示，在详情页分 Tab 展示。

**Tech Stack:** Node/Express/TypeScript (api), Next.js/React (tenant-web), Prisma ORM, Zod validation

---

## 文件映射

| 文件 | 改动类型 | 负责内容 |
|------|---------|---------|
| `api/src/services/apartment.service.ts` | 修改 | 扩展 service 接口和 buildData 函数 |
| `api/src/routes/v1/apartments.ts` | 修改 | 扩展 Zod schema 和 OpenAPI 注释 |
| `tenant-web/src/app/apartments/[id]/page.tsx` | 修改 | 详情页新增"物业信息"区块和"上游信息" Tab |
| `tenant-web/src/app/apartments/page.tsx` | 修改 | 创建/编辑表单新增字段（基本信息 + 可折叠上游信息） |
| `api/src/routes/v1/organizations.ts` | 修改 | CreateOrgSchema / UpdateOrgSchema 加 notes |
| `tenant-web/src/app/organizations/new/page.tsx` | 修改 | 表单加 notes textarea |

---

## Task 1: API Service 层 — 扩展 Apartment Service 接口

**Files:**
- Modify: `api/src/services/apartment.service.ts`

- [ ] **Step 1: 扩展 CreateApartmentInput 接口**

在 `CreateApartmentInput` 中添加以下字段（共 13 个字段）：

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
```

- [ ] **Step 2: 扩展 UpdateApartmentInput 接口**

```typescript
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

- [ ] **Step 3: 扩展 buildCreateData 函数**

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

- [ ] **Step 4: 扩展 buildUpdateData 函数**

```typescript
function buildUpdateData(
  existing: Apartment,
  data: UpdateApartmentInput,
): Prisma.ApartmentUpdateInput {
  return {
    name: data.name ?? existing.name,
    address: data.address ?? existing.address,
    description: data.description ?? existing.description,
    floors: data.floors ?? existing.floors,
    land_area: data.land_area ?? existing.land_area,
    total_area: data.total_area ?? existing.total_area,
    landlord_name: data.landlord_name ?? existing.landlord_name,
    landlord_contact: data.landlord_contact ?? existing.landlord_contact,
    contract_start: data.contract_start
      ? new Date(data.contract_start)
      : (existing.contract_start ?? undefined),
    contract_end: data.contract_end
      ? new Date(data.contract_end)
      : (existing.contract_end ?? undefined),
    landlord_rent: data.landlord_rent ?? existing.landlord_rent,
    operating_cost: data.operating_cost ?? existing.operating_cost,
  };
}
```

- [ ] **Step 5: 验证 type-check**

```bash
cd /Users/shen/workspace/apartment-ultra && pnpm --filter apartment-ultra-api type-check
```

预期：编译通过，无错误

- [ ] **Step 6: 提交**

```bash
git add api/src/services/apartment.service.ts
git commit -m "feat(api): extend Apartment CreateApartmentInput/UpdateApartmentInput with 9 new fields

- Add floors, land_area, total_area (basic property info)
- Add landlord_name, landlord_contact, contract_start, contract_end, landlord_rent (upstream info)
- Add operating_cost (operating expense)
- Extend buildCreateData/buildUpdateData to handle new fields"
```

---

## Task 2: API Route 层 — 扩展 Apartments Zod Schema

**Files:**
- Modify: `api/src/routes/v1/apartments.ts:19-28`

- [ ] **Step 1: 扩展 ApartmentCreateSchema**

找到当前 `ApartmentCreateSchema` 定义（约第 19 行），替换为：

```typescript
const ApartmentCreateSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
  // 基本信息
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  // 上游信息
  landlord_name: z.string().max(100).optional(),
  landlord_contact: z.string().max(50).optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().min(0).optional(),
  // 经营成本
  operating_cost: z.number().min(0).optional(),
});
```

- [ ] **Step 2: 扩展 ApartmentUpdateSchema**

找到当前 `ApartmentUpdateSchema` 定义（约第 24-28 行），替换为：

```typescript
const ApartmentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  // 基本信息
  floors: z.number().int().min(1).optional(),
  land_area: z.number().min(0).optional(),
  total_area: z.number().min(0).optional(),
  // 上游信息
  landlord_name: z.string().max(100).optional(),
  landlord_contact: z.string().max(50).optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  landlord_rent: z.number().min(0).optional(),
  // 经营成本
  operating_cost: z.number().min(0).optional(),
});
```

- [ ] **Step 3: 更新 POST /apartments OpenAPI 注释**

找到约第 74-130 行的 `POST /apartments` 注释，补充新字段的 requestBody schema properties：

```yaml
# 在现有 properties 后追加：
#               floors:
#                 type: integer
#               land_area:
#                 type: number
#               total_area:
#                 type: number
#               landlord_name:
#                 type: string
#               landlord_contact:
#                 type: string
#               contract_start:
#                 type: string
#                 format: date
#               contract_end:
#                 type: string
#                 format: date
#               landlord_rent:
#                 type: number
#               operating_cost:
#                 type: number
```

- [ ] **Step 4: 更新 PUT /apartments/{id} OpenAPI 注释**

找到约第 982-1018 行的 `PUT /apartments/{id}` 注释，补充相同的新字段 properties。

- [ ] **Step 5: 验证 type-check**

```bash
cd /Users/shen/workspace/apartment-ultra && pnpm --filter apartment-ultra-api type-check
```

预期：编译通过

- [ ] **Step 6: 提交**

```bash
git add api/src/routes/v1/apartments.ts
git commit -m "feat(api): extend apartment Zod schemas and OpenAPI docs with 9 new fields

- ApartmentCreateSchema/ApartmentUpdateSchema: add floors, land_area, total_area, landlord_name, landlord_contact, contract_start, contract_end, landlord_rent, operating_cost
- Update POST /apartments and PUT /apartments/{id} OpenAPI requestBody"
```

---

## Task 3: 前端详情页 — 新增"物业信息"区块和"上游信息" Tab

**Files:**
- Modify: `tenant-web/src/app/apartments/[id]/page.tsx`

> 该文件较大（约 800+ 行），需要找到正确的插入位置。

- [ ] **Step 1: 在基础信息 Tab 内新增"物业信息"区块**

在详情页的基础信息 tab content 中，找到 `CardContent` 内展示 `description` 的位置，在其下方（`description` 展示块之后、`apartment.facilities` 之前或合适位置）插入：

```tsx
{(apartment.floors || apartment.land_area || apartment.total_area) && (
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-muted-foreground">物业信息</h3>
    <div className="grid grid-cols-3 gap-4">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">楼层数</span>
        <span className="font-medium">{apartment.floors ?? '-'} 层</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">用地面积</span>
        <span className="font-medium">
          {apartment.land_area ? `${apartment.land_area} 亩` : '-'}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">总面积</span>
        <span className="font-medium">
          {apartment.total_area ? `${apartment.total_area} ㎡` : '-'}
        </span>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: 新增"上游信息" Tab**

在详情页找到 tab 定义区域（tabs 数组或 tabs 内容定义），新增一个 tab。

在文件顶部找到 `const tabs` 定义（约 `[{ value: 'basic' }, { value: 'rooms' }, ...]`），追加：

```typescript
{ value: 'upstream', label: '上游信息' }
```

- [ ] **Step 3: 新增"上游信息" Tab Content**

在 tab panels 中新增：

```tsx
<TabsContent value="upstream" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>上游信息</CardTitle>
      <CardDescription>房东和合同相关信息</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">房东姓名</span>
          <span className="font-medium">{apartment.landlord_name ?? '-'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">联系方式</span>
          <span className="font-medium">{apartment.landlord_contact ?? '-'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">合同开始</span>
          <span className="font-medium">
            {apartment.contract_start
              ? format(new Date(apartment.contract_start), 'yyyy-MM-dd')
              : '-'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">合同结束</span>
          <span className="font-medium">
            {apartment.contract_end
              ? format(new Date(apartment.contract_end), 'yyyy-MM-dd')
              : '-'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">房东租金</span>
          <span className="font-medium">
            {apartment.landlord_rent ? `¥${apartment.landlord_rent}/月` : '-'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">经营成本</span>
          <span className="font-medium">
            {apartment.operating_cost ? `¥${apartment.operating_cost}/月` : '-'}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

> 提示：文件顶部已有 `format` from `date-fns` 的 import，如没有则需添加：
> `import { format } from 'date-fns';`
> 如果有中文 locale 需求可用 `zhCN` 参数。

- [ ] **Step 4: 验证 type-check**

```bash
cd /Users/shen/workspace/apartment-ultra && pnpm --filter tenant-web type-check 2>&1 | head -50
```

预期：编译通过。如有类型错误根据提示修复。

- [ ] **Step 5: 提交**

```bash
git add tenant-web/src/app/apartments/[id]/page.tsx
git commit -m "feat(tenant-web): add upstream info tab and property info block to apartment detail page

- Add property info block (floors/land_area/total_area) to basic info tab
- Add new '上游信息' tab showing landlord_name, landlord_contact, contract dates, landlord_rent, operating_cost"
```

---

## Task 4: 前端公寓列表页 — 表单新增字段

**Files:**
- Modify: `tenant-web/src/app/apartments/page.tsx`

- [ ] **Step 1: 扩展 apartmentSchema**

找到第 68-72 行的 `apartmentSchema`，替换为：

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

- [ ] **Step 2: 更新 createForm 默认值**

找到第 93-96 行的 `useForm` 调用，添加新字段默认值：

```typescript
const createForm = useForm<ApartmentFormData>({
  resolver: zodResolver(apartmentSchema),
  defaultValues: {
    name: '',
    address: '',
    description: '',
    floors: undefined,
    land_area: undefined,
    total_area: undefined,
    landlord_name: '',
    landlord_contact: '',
    contract_start: '',
    contract_end: '',
    landlord_rent: undefined,
    operating_cost: undefined,
  },
});
```

- [ ] **Step 3: 更新 editForm.reset 处理**

找到 `handleEdit` 函数（约第 136-144 行），在 `reset` 调用中添加新字段：

```typescript
editForm.reset({
  name: apartment.name,
  address: apartment.address ?? '',
  description: apartment.description ?? '',
  floors: apartment.floors ?? undefined,
  land_area: apartment.land_area ?? undefined,
  total_area: apartment.total_area ?? undefined,
  landlord_name: apartment.landlord_name ?? '',
  landlord_contact: apartment.landlord_contact ?? '',
  contract_start: apartment.contract_start
    ? new Date(apartment.contract_start).toISOString().split('T')[0]
    : '',
  contract_end: apartment.contract_end
    ? new Date(apartment.contract_end).toISOString().split('T')[0]
    : '',
  landlord_rent: apartment.landlord_rent ?? undefined,
  operating_cost: apartment.operating_cost ?? undefined,
});
```

- [ ] **Step 4: 更新 Create Dialog 表单**

找到第 358-406 行的 Dialog 内容，在现有三个字段后（`description` 字段下方）追加：

```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="space-y-2">
    <Label htmlFor="floors">楼层数</Label>
    <Input id="floors" type="number" min={1} {...createForm.register('floors', { valueAsNumber: true })} placeholder="如：5" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="land_area">用地面积（亩）</Label>
    <Input id="land_area" type="number" min={0} step={0.01} {...createForm.register('land_area', { valueAsNumber: true })} placeholder="如：2.5" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="total_area">总面积（㎡）</Label>
    <Input id="total_area" type="number" min={0} step={0.01} {...createForm.register('total_area', { valueAsNumber: true })} placeholder="如：500" />
  </div>
</div>

<details className="group border rounded-md p-3">
  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
    上游信息（点击展开）
  </summary>
  <div className="mt-3 space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="landlord_name">房东姓名</Label>
        <Input id="landlord_name" {...createForm.register('landlord_name')} placeholder="如：张三" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="landlord_contact">联系方式</Label>
        <Input id="landlord_contact" {...createForm.register('landlord_contact')} placeholder="如：138xxxx" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contract_start">合同开始</Label>
        <Input id="contract_start" type="date" {...createForm.register('contract_start')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contract_end">合同结束</Label>
        <Input id="contract_end" type="date" {...createForm.register('contract_end')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="landlord_rent">房东租金（元/月）</Label>
        <Input id="landlord_rent" type="number" min={0} step={0.01} {...createForm.register('landlord_rent', { valueAsNumber: true })} placeholder="如：5000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="operating_cost">经营成本（元/月）</Label>
        <Input id="operating_cost" type="number" min={0} step={0.01} {...createForm.register('operating_cost', { valueAsNumber: true })} placeholder="如：1000" />
      </div>
    </div>
  </div>
</details>
```

- [ ] **Step 5: 更新 Edit Dialog 表单**

找到第 408-453 行的 Edit Dialog，用相同的结构替换 `description` 字段之后的内容，使用 `editForm.register` 而不是 `createForm.register`。

- [ ] **Step 6: 验证 type-check**

```bash
cd /Users/shen/workspace/apartment-ultra && pnpm --filter tenant-web type-check 2>&1 | head -50
```

预期：编译通过

- [ ] **Step 7: 提交**

```bash
git add tenant-web/src/app/apartments/page.tsx
git commit -m "feat(tenant-web): add 9 new fields to apartment create/edit dialogs

- Add floors, land_area, total_area to basic info section
- Add collapsible upstream info section with landlord/contract/cost fields"
```

---

## Task 5: Organization Notes 字段

**Files:**
- Modify: `api/src/routes/v1/organizations.ts`
- Modify: `tenant-web/src/app/organizations/new/page.tsx`

- [ ] **Step 1: 在 API CreateOrgSchema 加 notes**

找到 `CreateOrgSchema` 定义，添加：

```typescript
notes: z.string().max(1000).optional(),
```

- [ ] **Step 2: 在 API UpdateOrgSchema 加 notes**

找到 `UpdateOrgSchema` 定义，添加：

```typescript
notes: z.string().max(1000).optional(),
```

- [ ] **Step 3: 前端组织创建表单加 notes**

在 `organizations/new/page.tsx` 的表单中，在 `description` 字段后加一行：

```tsx
<div className="space-y-2">
  <Label htmlFor="notes">备注</Label>
  <Textarea id="notes" {...form.register('notes')} placeholder="备注信息（选填）" rows={3} />
</div>
```

> 注意：需确认该文件已导入 `Textarea` 组件。如无 import，需添加。

- [ ] **Step 4: 验证 type-check**

```bash
cd /Users/shen/workspace/apartment-ultra && pnpm --filter apartment-ultra-api type-check && pnpm --filter tenant-web type-check 2>&1 | head -30
```

预期：编译通过

- [ ] **Step 5: 提交**

```bash
git add api/src/routes/v1/organizations.ts tenant-web/src/app/organizations/new/page.tsx
git commit -m "feat: add notes field to organization create form

- Add notes to Organization CreateSchema/UpdateSchema
- Add notes textarea to tenant-web organization creation form"
```

---

## Task 6: 最终验证

- [ ] **Step 1: 运行 type-check 全量验证**

```bash
cd /Users/shen/workspace/apartment-ultra && pnpm type-check 2>&1 | tail -20
```

预期：无错误

- [ ] **Step 2: 运行 lint 验证**

```bash
cd /Users/shen/workspace/apartment-ultra && pnpm lint 2>&1 | tail -20
```

预期：无 lint 错误

- [ ] **Step 3: 确认 git status**

```bash
git status
```

预期：显示修改的文件列表

- [ ] **Step 4: 最终提交**

```bash
git add -A && git commit -m "feat: complete apartment missing fields and org notes

- Apartment: add floors/land_area/total_area (property info)
- Apartment: add landlord_name/contact/contract dates/rent (upstream info)
- Apartment: add operating_cost
- Organization: add notes field

Closes #功能差距分析"
```
