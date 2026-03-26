# Architecture Research: Frontend Optimization Patterns

**Domain:** Multi-tenant SaaS Apartment Management System
**Researched:** 2026-03-26
**Confidence:** MEDIUM (基于代码库现状分析 + Next.js 14 App Router 最佳实践)

## Current State Analysis

### 现有项目结构

```
tenant-web/src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx          # 认证布局
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   └── layout.tsx          # 仪表板布局
│   ├── apartments/
│   │   ├── page.tsx            # 622行，包含CRUD对话框
│   │   └── [id]/
│   │       └── page.tsx        # 1552行，巨型页面
│   ├── dashboard/
│   │   ├── page.tsx            # 认证+布局包装器
│   │   └── dashboard-content.tsx # 288行，展示组件
│   ├── rooms/
│   │   ├── page.tsx
│   │   └── components/         # 局部组件
│   └── settings/
│       ├── layout.tsx
│       └── [...sections]/page.tsx
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx     # 侧边栏+头部
│   │   ├── nav-content.tsx
│   │   └── permission-page-guard.tsx
│   ├── common/
│   │   ├── data-table.tsx
│   │   └── table-actions.tsx
│   └── ui/                    # shadcn/ui 组件
└── lib/
    ├── api/                   # API 调用层
    └── auth/                  # 认证上下文
```

### 识别的问题

| 问题 | 文件 | 影响 |
|------|------|------|
| 巨型页面组件 | `apartments/[id]/page.tsx` (1552行) | 难以维护、难以测试 |
| 对话框内联 | 各 page.tsx 内 | 代码重复、耦合度高 |
| 状态分散 | 多 useState 散落各处 | 逻辑难以追踪 |
| 组件边界模糊 | 展示/表单/操作混杂 | 复用性差 |

---

## Recommended Architecture

### 系统分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Page Layer (页面)                         │
│  ├── 认证状态检查                                              │
│  ├── 权限验证                                                 │
│  ├── 布局嵌套                                                 │
│  └── 数据获取编排                                              │
├─────────────────────────────────────────────────────────────┤
│                 Section Layer (区块)                          │
│  ├── PageHeader        - 页面标题、操作按钮                    │
│  ├── DataSection       - 数据展示区块                         │
│  ├── FormSection       - 表单区块                            │
│  └── ActionDialog      - 操作对话框                          │
├─────────────────────────────────────────────────────────────┤
│               Component Layer (组件)                         │
│  ├── Display           - 纯展示组件                          │
│  ├── Interactive       - 交互组件                            │
│  └── Composite        - 复合组件                            │
├─────────────────────────────────────────────────────────────┤
│                Hook Layer (逻辑)                             │
│  ├── useQueries        - 数据获取                            │
│  ├── useMutations      - 数据变更                            │
│  └── useCustom         - 业务逻辑                            │
└─────────────────────────────────────────────────────────────┘
```

### 推荐的目录结构

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── apartments/
│   │   │   ├── page.tsx                    # 公寓列表页
│   │   │   ├── _components/
│   │   │   │   ├── apartment-list.tsx       # 列表展示
│   │   │   │   ├── apartment-card.tsx       # 卡片组件
│   │   │   │   ├── apartment-filters.tsx   # 筛选器
│   │   │   │   └── apartment-form-dialog.tsx # 创建/编辑对话框
│   │   │   └── [id]/
│   │   │       ├── page.tsx                 # 公寓详情页（精简）
│   │   │       ├── _components/
│   │   │       │   ├── apartment-header.tsx       # 头部信息
│   │   │       │   ├── apartment-stats.tsx        # 统计卡片
│   │   │       │   ├── room-grid.tsx              # 房间网格
│   │   │       │   ├── room-card.tsx              # 房间卡片
│   │   │       │   ├── room-batch-dialog.tsx      # 批量操作
│   │   │       │   └── utility-config-dialog.tsx  # 水电配置
│   │   │       └── tabs/
│   │   │           ├── basic-info-tab.tsx
│   │   │           └── upstream-info-tab.tsx
│   │   ├── rooms/
│   │   │   ├── page.tsx
│   │   │   └── _components/
│   │   └── dashboard/
│   │       └── page.tsx
│   └── settings/
│       ├── layout.tsx
│       ├── page.tsx
│       └── _components/
│           ├── subscription-section.tsx
│           └── team-section.tsx
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx
│   │   ├── page-header.tsx              # 新增：统一页面头部
│   │   ├── section-container.tsx        # 新增：区块容器
│   │   └── breadcrumbs.tsx              # 新增：面包屑
│   ├── ui/
│   │   ├── data-table.tsx
│   │   ├── stat-card.tsx               # 新增：统计卡片
│   │   └── empty-state.tsx             # 新增：空状态
│   └── dialogs/                        # 新增：通用对话框
│       ├── confirm-dialog.tsx
│       ├── form-dialog.tsx
│       └── multi-step-dialog.tsx
├── hooks/
│   ├── use-apartments.ts               # 新增：公寓相关hooks
│   ├── use-rooms.ts
│   └── use-mutations.ts               # 通用mutation hooks
└── lib/
    └── api/
```

---

## Architectural Patterns

### Pattern 1: Page Composition (页面组合)

**What:** 将复杂页面拆分为独立的 Section 组件，页面只做组合和状态协调。

**When to use:** 页面超过 300 行，或有多个逻辑区块。

**Trade-offs:**
- 优点：更好的可维护性、可测试性、复用性
- 缺点：需要更多文件，初始开发稍慢

**Example:**

```typescript
// apartments/[id]/page.tsx (重构后)
export default function ApartmentDetailPage({ params }: { params: { id: string } }) {
  return (
    <MainLayout>
      <div className="space-y-6">
        <ApartmentHeader apartmentId={params.id} />
        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">基础信息</TabsTrigger>
            <TabsTrigger value="upstream">上游信息</TabsTrigger>
          </TabsList>
          <TabsContent value="basic">
            <BasicInfoTab apartmentId={params.id} />
          </TabsContent>
          <TabsContent value="upstream">
            <UpstreamInfoTab apartmentId={params.id} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// apartments/[id]/_components/apartment-header.tsx
function ApartmentHeader({ apartmentId }: { apartmentId: string }) {
  const { data: apartment } = useApartment(apartmentId);
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <BackButton href="/apartments" />
        <div>
          <h1 className="text-3xl font-bold">{apartment?.name}</h1>
          <p className="text-muted-foreground">{apartment?.address}</p>
        </div>
      </div>
      <EditApartmentButton apartment={apartment} />
    </div>
  );
}
```

### Pattern 2: Dialog as Component (对话框组件化)

**What:** 将对话框提取为独立组件，通过 props 传递数据和回调。

**When to use:** 对话框在多个地方使用，或对话框逻辑复杂（超过 50 行）。

**Trade-offs:**
- 优点：可复用、便于单独测试
- 缺点：props 可能变多

**Example:**

```typescript
// apartments/_components/apartment-form-dialog.tsx
interface ApartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment?: Apartment;           // 有值时为编辑
  onSubmit: (data: ApartmentFormData) => void;
  isPending: boolean;
}

export function ApartmentFormDialog({
  open,
  onOpenChange,
  apartment,
  onSubmit,
  isPending,
}: ApartmentFormDialogProps) {
  const form = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: apartment ?? { name: '', address: '' },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{apartment ? '编辑公寓' : '新增公寓'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 表单字段 */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// apartments/page.tsx - 简洁的页面
export default function ApartmentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  // ... mutations

  return (
    <>
      <ApartmentList
        apartments={apartments}
        onEdit={(apt) => {
          setEditingApartment(apt);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />
      <ApartmentFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingApartment(null);
        }}
        apartment={editingApartment ?? undefined}
        onSubmit={editingApartment ? handleUpdate : handleCreate}
        isPending={isPending}
      />
    </>
  );
}
```

### Pattern 3: Data Access Hooks (数据访问钩子)

**What:** 封装 TanStack Query 的 useQuery 调用为自定义 hooks。

**When to use:** 同一类型数据在多个页面使用，或查询逻辑复杂。

**Trade-offs:**
- 优点：查询逻辑集中、便于缓存复用、减少样板代码
- 缺点：需要维护额外的 hooks 文件

**Example:**

```typescript
// hooks/use-apartments.ts
export function useApartment(orgId: string | undefined, apartmentId: string) {
  return useQuery({
    queryKey: ['apartment', orgId, apartmentId],
    queryFn: () => apartmentsApi.get(orgId!, apartmentId),
    enabled: !!orgId,
  });
}

export function useApartmentRooms(orgId: string | undefined, apartmentId: string) {
  return useQuery({
    queryKey: ['rooms', orgId, apartmentId],
    queryFn: () => roomsApi.list(orgId!, apartmentId),
    enabled: !!orgId,
  });
}

export function useCreateApartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: ApartmentFormData }) =>
      apartmentsApi.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: ['apartments', orgId] });
    },
  });
}
```

### Pattern 4: Page Header Pattern (页面头部模式)

**What:** 统一页面头部的结构和样式。

**When to use:** 所有主内容页面。

**Trade-offs:**
- 优点：视觉一致性、减少样板代码
- 缺点：灵活性略有降低

**Example:**

```typescript
// components/layout/page-header.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backHref?: string;
}

export function PageHeader({ title, description, actions, backHref }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {backHref && (
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// 使用
<PageHeader
  title={apartment.name}
  description={apartment.address}
  backHref="/apartments"
  actions={<EditButton onClick={() => setEditOpen(true)} />}
/>
```

### Pattern 5: Progressive Disclosure (渐进披露)

**What:** 将复杂表单或信息分步骤展示。

**When to use:** 表单字段过多（超过 10 个），或操作流程有明确步骤。

**Trade-offs:**
- 优点：降低认知负担、引导用户完成流程
- 缺点：增加导航复杂度

**Example:**

```typescript
// 使用 Accordion 或 Tabs 进行渐进披露
// 当前 apartments/page.tsx 已有实践：<details> 包裹上游信息

// 更进一步的批量创建房间对话框
function BatchCreateRoomDialog() {
  const [step, setStep] = useState<'config' | 'preview' | 'confirm'>('config');

  return (
    <Dialog>
      <DialogContent>
        {step === 'config' && (
          <RoomConfigStep onNext={() => setStep('preview')} />
        )}
        {step === 'preview' && (
          <RoomPreviewStep onBack={() => setStep('config')} onNext={() => setStep('confirm')} />
        )}
        {step === 'confirm' && (
          <RoomConfirmStep onBack={() => setStep('preview')} />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 6: Server Component vs Client Component (服务端与客户端组件)

**What:** 合理划分 Server Component 和 Client Component。

**When to use:** 需要明确数据获取边界和交互边界。

**Trade-offs:**
- 优点：减少客户端 JavaScript、提升性能
- 缺点：需要理解边界

**Example:**

```typescript
// app/apartments/[id]/page.tsx - 服务端组件，处理数据获取
import { getServerData } from './lib';

export default async function ApartmentDetailPage({ params }: { params: { id: string } }) {
  // 服务端获取数据
  const { orgId, apartment } = await getServerData(params.id);

  return (
    <ApartmentDetailClient
      initialApartment={apartment}
      orgId={orgId}
    />
  );
}

// components/apartment-detail-client.tsx - 客户端组件，处理交互
'use client';
function ApartmentDetailClient({ initialApartment, orgId }: {...}) {
  // TanStack Query 处理客户端数据
  const { data: apartment } = useQuery({
    queryKey: ['apartment', apartmentId],
    queryFn: () => apartmentsApi.get(orgId, apartmentId),
    initialData: initialApartment,  // 使用服务端数据作为初始值
  });
  // ... 交互逻辑
}
```

---

## Data Flow

### TanStack Query 数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                         Query Flow                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Page Mount                                                      │
│     │                                                            │
│     ▼                                                            │
│  useQuery({ queryKey, queryFn })                                │
│     │                                                            │
│     ├─── enabled: false ──▶ 不发起请求                            │
│     │                                                            │
│     └─── enabled: true ──▶ QueryClient.checkCache()             │
│                              │                                   │
│                              ├─── Cache Hit ──▶ 返回缓存数据       │
│                              │                                   │
│                              └─── Cache Miss ──▶ 发起API请求      │
│                                                             │    │
│  API Response ◀────────────────────────────────────────────┘    │
│     │                                                            │
│     ▼                                                            │
│  QueryClient.setQueryData() ◀── 存入缓存                         │
│     │                                                            │
│     ▼                                                            │
│  Component Re-render ◀── 通知监听器                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Mutation Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  useMutation({ mutationFn, onSuccess, onError })               │
│     │                                                            │
│     ▼                                                            │
│  mutation.mutate(data)                                          │
│     │                                                            │
│     ▼                                                            │
│  mutationFn(data) ──▶ API Call                                 │
│     │                                                            │
│     ├─── Error ──▶ onError ──▶ toast.error()                   │
│     │                                                            │
│     └─── Success ──▶ onSuccess ──▶ queryClient.invalidateQueries│
│                                                     │            │
│                                                     ▼            │
│                                            重新获取相关Query      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 推荐的数据获取模式

```typescript
// 1. 列表页 - 完整控制
function ApartmentsPage() {
  const { organization } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['apartments', organization?.id],
    queryFn: () => apartmentsApi.list(organization!.id),
    enabled: !!organization?.id,
  });
  // 渲染逻辑
}

// 2. 详情页 - 使用初始数据 + 客户端更新
function ApartmentDetailPage({ params }: { params: { id: string } }) {
  const { organization } = useAuth();
  const { data: apartment } = useQuery({
    queryKey: ['apartment', organization?.id, params.id],
    queryFn: () => apartmentsApi.get(organization!.id, params.id),
    initialData: undefined, // 或者从 server component 传入
    enabled: !!organization?.id,
  });
  // 渲染逻辑
}

// 3. 关联数据 - 独立查询
function RoomList({ apartmentId }: { apartmentId: string }) {
  const { organization } = useAuth();
  const { data: rooms } = useQuery({
    queryKey: ['rooms', organization?.id, apartmentId],
    queryFn: () => roomsApi.list(organization!.id, apartmentId),
    enabled: !!organization?.id,
  });
  // 渲染逻辑
}
```

---

## Scaling Considerations

| 规模 | 架构调整 | 优先级 |
|------|----------|--------|
| 0-100 用户 | 当前架构足够，无需调整 | N/A |
| 100-1000 用户 | 引入数据获取 hooks 集中管理 | 低 |
| 1000-10000 用户 | 分离 Server/Client Components，添加 Suspense | 中 |
| 10000+ 用户 | 考虑分页/虚拟滚动，后端分页API | 高 |

### First Bottleneck: 巨型页面组件

**问题:** `apartments/[id]/page.tsx` 1552行导致：
- 首次加载时间增加（无意义的代码解析）
- 热更新变慢
- 难以定位 bug

**解决方案:**
1. 提取 Section 组件到 `_components/` 目录
2. 提取 Dialog 到 `dialogs/` 目录
3. 使用 `useMemo` 优化计算逻辑

### Second Bottleneck: 重复的数据获取逻辑

**问题:** 多个页面有相似的 useQuery 模式。

**解决方案:**
1. 创建 `hooks/use-*` 自定义 hooks
2. 统一错误处理和 loading 状态

---

## Anti-Patterns

### Anti-Pattern 1: 巨型 Monolithic 页面

**What people do:** 将所有逻辑放在单个 page.tsx 文件中。

**Why it's wrong:**
- 超过 1000 行的文件难以维护
- 无法独立测试各部分
- 热更新变慢

**Do this instead:**
```typescript
// 拆分到多个文件
page.tsx              // 组合逻辑，< 100 行
_components/
  header.tsx          // 页面头部
  stats-section.tsx   // 统计区块
  room-list.tsx       // 房间列表
dialogs/
  edit-dialog.tsx     // 编辑对话框
  delete-dialog.tsx   // 删除确认
```

### Anti-Pattern 2: 内联表单状态

**What people do:** 在页面组件中定义所有表单的 useForm。

**Why it's wrong:**
- 表单逻辑与页面逻辑耦合
- 难以复用表单组件

**Do this instead:**
```typescript
// 表单组件自己管理状态
function ApartmentFormDialog() {
  const form = useForm<ApartmentFormData>({...});
  // 表单逻辑封装在组件内
}

// 页面只传递回调
<Dialog onSubmit={(data) => onCreate(data)} />
```

### Anti-Pattern 3: 直接在组件中调用 API

**What people do:** 在组件中直接写 `useQuery({ queryFn: () => api.get() })`。

**Why it's wrong:**
- 相同查询在多处重复
- 缓存键不统一
- 难以添加全局错误处理

**Do this instead:**
```typescript
// hooks/use-apartments.ts
export function useApartments(orgId: string) {
  return useQuery({
    queryKey: ['apartments', orgId],
    queryFn: () => apartmentsApi.list(orgId),
  });
}

// 组件中使用
const { data } = useApartments(orgId);
```

### Anti-Pattern 4: 忽视 Loading/Error 边界

**What people do:** 在每个组件中单独处理 isLoading 和 error。

**Why it's wrong:**
- 样板代码重复
- 错误处理不一致

**Do this instead:**
```typescript
// components/data-loading-state.tsx
function DataLoadingState({ isLoading, error, children }: {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
}) {
  if (isLoading) return <Skeleton className="h-32" />;
  if (error) return <Alert variant="destructive">{error.message}</Alert>;
  return <>{children}</>;
}
```

---

## Integration Points

### 与现有架构的集成

| 集成点 | 当前实现 | 建议改进 |
|--------|----------|----------|
| API 层 | `lib/api/*.ts` | 保持，可补充 typed hooks |
| 认证 | `lib/auth/context.tsx` | 保持，提取 useAuth hook |
| 权限 | `components/common/permission-guard.tsx` | 保持 |
| UI 组件 | shadcn/ui | 保持，补充业务组件 |
| 布局 | `components/layout/main-layout.tsx` | 补充 PageHeader |

### 迁移策略

1. **Phase 1:** 新页面采用新模式（Page + _components）
2. **Phase 2:** 逐步重构现有巨型页面
3. **Phase 3:** 建立 hooks 库，统一数据获取

---

## Sources

- [Next.js 14 App Router Documentation](https://nextjs.org/docs/app) - 服务端组件和布局模式
- [TanStack Query v5 Documentation](https://tanstack.com/query/latest) - 数据获取最佳实践
- [shadcn/ui Patterns](https://ui.shadcn.com) - UI 组件组合模式
- [React Component Composition](https://react.dev/learn/composition) - 组件组合原则
- [Progressive Disclosure UI Pattern](https://www.nngroup.com/articles/progressive-disclosure/) - 渐进披露设计模式

---

*Architecture research for: Apartment Ultra Frontend Optimization*
*Researched: 2026-03-26*
