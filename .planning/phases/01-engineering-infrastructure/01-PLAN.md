---
phase: 01-engineering-infrastructure
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - api/src/routes/v1/reports.ts
  - api/src/services/report.service.ts
  - api/src/repositories/report.repo.ts
  - packages/api-contract/src/reports.ts
  - .github/workflows/ci.yml
  - packages/shared-ui/src/components/ui/empty-state.tsx
  - packages/shared-ui/src/index.ts
autonomous: true
requirements:
  - DATA-01
  - DATA-02
  - DATA-03
  - DATA-04
  - ENG-01
  - ENG-02

must_haves:
  truths:
    - "GET /reports API调用真实服务，不再返回硬编码空数组"
    - "CI门禁只运行lint+type-check，不再运行test suite（D-01覆盖ENG-01中test要求）"
    - "EmptyState组件已创建并导出，待Phase 3集成到具体页面"
    - "API响应数据正确展示，无类型错误导致的展示异常"
  artifacts:
    - path: "api/src/routes/v1/reports.ts"
      provides: "GET /reports 路由，调用真实服务"
      contains: "defaultReportService.list"
    - path: "api/src/services/report.service.ts"
      provides: "ReportService.list方法实现"
      contains: "list:"
    - path: ".github/workflows/ci.yml"
      provides: "CI门禁配置"
      not_contains: "Run tests"
    - path: "packages/shared-ui/src/components/ui/empty-state.tsx"
      provides: "空状态组件（组件已创建，集成工作归属Phase 3 COMP-03）"
      contains: "EmptyState"
    - path: "packages/api-contract/src/reports.ts"
      provides: "Report类型定义"
      contains: "ReportMetadata"
  key_links:
    - from: "api/src/routes/v1/reports.ts"
      to: "api/src/services/report.service.ts"
      via: "import and call"
      pattern: "defaultReportService.list"
    - from: "api/src/services/report.service.ts"
      to: "api/src/repositories/report.repo.ts"
      via: "repo.listReports call"
      pattern: "prisma\\.message\\.(find|create)"
---

<objective>
建立CI门禁防止回归，将租客端和运营后台所有Mock数据替换为真实数据库查询，并确保API契约与前端类型一致。

Purpose: 规范化工程基础设施，为后续优化奠定真实数据基础
Output: CI门禁配置、Mock数据替换、EmptyState组件（组件级创建，页面集成归属Phase 3）
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-engineering-infrastructure/01-CONTEXT.md
@.planning/phases/01-engineering-infrastructure/01-RESEARCH.md
@api/src/routes/v1/reports.ts
@api/src/services/report.service.ts
@packages/api-contract/src/reports.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: 添加ReportService.list方法及Report类型定义</name>
  <files>
    packages/api-contract/src/reports.ts
    api/src/repositories/report.repo.ts
    api/src/services/report.service.ts
    api/src/routes/v1/reports.ts
  </files>
  <read_first>
    packages/api-contract/src/reports.ts
    api/src/services/report.service.ts
    api/src/routes/v1/reports.ts
    api/src/repositories/report.repo.ts
  </read_first>
  <action>
    本任务需要添加一个list方法到Report服务，因为当前服务中没有这个方法。

    **步骤1: 在api-contract中添加ReportMetadata类型**
    在packages/api-contract/src/reports.ts末尾添加：
    ```typescript
    /** 报表元数据 */
    export interface ReportMetadata {
      id: string;
      type: 'overview' | 'income' | 'occupancy';
      name: string;
      description: string;
      updated_at: string;
    }
    ```

    **步骤2: 在report.repo.ts中添加list方法**
    在ReportRepository接口中添加：
    ```typescript
    listReports(orgId: string): Promise<ReportMetadata[]>;
    ```
    在createReportRepository函数实现中添加：
    ```typescript
    listReports: async (orgId: string) => {
      // 返回三个内置报表的元数据
      const now = new Date().toISOString();
      return [
        {
          id: `${orgId}-overview`,
          type: 'overview' as const,
          name: '概览统计',
          description: '公寓、房间、入住率、收入等关键指标概览',
          updated_at: now,
        },
        {
          id: `${orgId}-income`,
          type: 'income' as const,
          name: '收入报表',
          description: '月度收入明细及收缴率统计',
          updated_at: now,
        },
        {
          id: `${orgId}-occupancy`,
          type: 'occupancy' as const,
          name: '入住率报表',
          description: '月度入住率变化趋势',
          updated_at: now,
        },
      ];
    },
    ```

    **步骤3: 在report.service.ts中添加list方法**
    在ReportService接口中添加：
    ```typescript
    list(orgId: string): Promise<ReportMetadata[]>;
    ```
    在createReportService实现的return对象中添加：
    ```typescript
    list: async (orgId: string) => {
      return getRepo().listReports(orgId);
    },
    ```

    **步骤4: 修改reports.ts路由**
    将api/src/routes/v1/reports.ts中GET /路由的:
    ```typescript
    res.json([]);
    ```
    替换为:
    ```typescript
    const orgId = await requireOrgMembership(req);
    const reports = await defaultReportService.list(orgId);
    res.json(reports);
    ```
    注意：路由已经在第8行使用了requireConsoleAuth中间件，不需要重复添加。但需要添加requireOrgMembership调用获取orgId。
  </action>
  <verify>
    <automated>
      grep -n "listReports" api/src/repositories/report.repo.ts && \
      grep -n "list.*orgId" api/src/services/report.service.ts && \
      grep -n "defaultReportService.list" api/src/routes/v1/reports.ts && \
      grep -n "ReportMetadata" packages/api-contract/src/reports.ts
    </automated>
  </verify>
  <done>
    GET /reports返回ReportMetadata数组而非空数组，调用链完整：路由->服务->仓库
  </done>
</task>

<task type="auto">
  <name>Task 2: 修改CI工作流移除test步骤</name>
  <files>
    .github/workflows/ci.yml
  </files>
  <read_first>
    .github/workflows/ci.yml
  </read_first>
  <action>
    按照D-01决策（CI门禁包含lint+type-check，不强制在CI中运行test suite）修改CI配置。D-01是用户锁定决策，覆盖了ENG-01中关于CI应包含test的要求。

    **移除api job的Test步骤**
    删除第122-125行：
    ```yaml
      - name: Test
        run: pnpm --filter apartment-ultra-api run test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
    ```
    注意：保留Prisma db push步骤（第117-120行），因为build需要。

    **移除tenant-web job的Run tests步骤**
    删除第171-172行：
    ```yaml
      - name: Run tests
        run: pnpm --filter apartment-ultra-tenant run test:run
    ```
    注意：保留Build步骤（第174-177行）。

    **移除admin-web job的Run tests步骤**
    删除第223-224行：
    ```yaml
      - name: Run tests
        run: pnpm --filter apartment-ultra-admin run test:run
    ```
    注意：保留Build步骤（第226-229行）。

    重要：只删除测试步骤，不要删除其他步骤。CI修改后D-02（CI失败block PR合并）仍然生效。
  </action>
  <verify>
    <automated>
      # 验证test步骤已移除
      ! grep -n "Run tests" .github/workflows/ci.yml && \
      ! grep -n "apartment-ultra-api run test" .github/workflows/ci.yml && \
      ! grep -n "apartment-ultra-tenant run test:run" .github/workflows/ci.yml && \
      ! grep -n "apartment-ultra-admin run test:run" .github/workflows/ci.yml && \
      # 验证lint和type-check仍然存在
      grep -n "Run ESLint" .github/workflows/ci.yml | wc -l | xargs -I {} test {} -ge 3 && \
      grep -n "Type check" .github/workflows/ci.yml | wc -l | xargs -I {} test {} -ge 3
    </automated>
  </verify>
  <done>
    CI工作流只运行lint+type-check，不再运行test suite
  </done>
</task>

<task type="auto">
  <name>Task 3: 创建共享EmptyState组件</name>
  <files>
    packages/shared-ui/src/components/ui/empty-state.tsx
    packages/shared-ui/src/index.ts
  </files>
  <read_first>
    packages/shared-ui/src/components/ui/card.tsx
    packages/shared-ui/src/components/ui/button.tsx
    packages/shared-ui/src/index.ts
  </read_first>
  <action>
    在packages/shared-ui中创建统一的EmptyState组件，用于各页面空状态展示。

    注意：此任务只创建组件本身，不包含集成到具体页面。组件集成工作归属Phase 3（COMP-03组件提取），因为ROADMAP Phase 3明确指出"共享 UI 组件已补充（StatCard, EmptyState, LoadingState），各模块复用一致组件"。

    **创建packages/shared-ui/src/components/ui/empty-state.tsx：**
    ```typescript
    import * as React from 'react';
    import { Card, CardContent } from './card';
    import { Button } from './button';
    import { cn } from '../../lib/utils';

    export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
      /** 图标，可以是React节点或Lucide图标 */
      icon?: React.ReactNode;
      /** 主标题 */
      title: string;
      /** 描述文案 */
      description?: string;
      /** 操作按钮 */
      action?: {
        label: string;
        onClick: () => void;
      };
    }

    /**
     * 统一的空状态组件
     * 用于列表为空、加载失败等场景的友好提示
     */
    export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
      ({ className, icon, title, description, action, ...props }, ref) => {
        return (
          <Card
            ref={ref}
            className={cn('border-dashed', className)}
            {...props}
          >
            <CardContent className="flex flex-col items-center justify-center py-12">
              {icon && (
                <div className="mb-4 text-muted-foreground">
                  {icon}
                </div>
              )}
              <h3 className="mb-2 text-lg font-medium">{title}</h3>
              {description && (
                <p className="mb-4 text-sm text-muted-foreground text-center max-w-sm">
                  {description}
                </p>
              )}
              {action && (
                <Button onClick={action.onClick} className="mt-2">
                  {action.label}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      }
    );
    EmptyState.displayName = 'EmptyState';
    ```

    **更新packages/shared-ui/src/index.ts：**
    添加EmptyState到导出列表。
    在现有的ui组件导出部分添加：
    ```typescript
    export { EmptyState } from './components/ui/empty-state';
    export type { EmptyStateProps } from './components/ui/empty-state';
    ```

    组件使用示例（供Phase 3集成时参考）：
    ```tsx
    <EmptyState
      icon={<Building2 className="h-12 w-12" />}
      title="暂无公寓"
      description="创建您的第一个公寓来开始管理房产"
      action={{ label: "创建公寓", onClick: () => router.push('/apartments/new') }}
    />
    ```
  </action>
  <verify>
    <automated>
      test -f packages/shared-ui/src/components/ui/empty-state.tsx && \
      grep -n "export.*EmptyState" packages/shared-ui/src/index.ts && \
      grep -n "EmptyStateProps" packages/shared-ui/src/components/ui/empty-state.tsx
    </automated>
  </verify>
  <done>
    EmptyState组件已创建并导出，待Phase 3集成到具体页面
  </done>
</task>

</tasks>

<verification>
**Phase 1 整体验证：**

1. **Mock数据验证** (DATA-01, DATA-02):
   ```bash
   grep -rn "res\.json\(\[\]\)" api/src/routes/
   # 应无输出（已替换）
   ```

2. **CI配置验证** (ENG-01 as modified by D-01):
   ```bash
   grep -n "Run tests" .github/workflows/ci.yml
   # 应无输出（test步骤已移除）
   ```

3. **EmptyState组件验证** (DATA-04):
   ```bash
   test -f packages/shared-ui/src/components/ui/empty-state.tsx
   grep -n "export.*EmptyState" packages/shared-ui/src/index.ts
   ```

4. **类型一致性验证** (DATA-03):
   ```bash
   pnpm --filter apartment-ultra-api run type-check
   pnpm --filter apartment-ultra-tenant run type-check
   pnpm --filter apartment-ultra-admin run type-check
   ```
</verification>

<success_criteria>
- [ ] GET /reports API不再返回空数组，调用defaultReportService.list(orgId)
- [ ] ReportService.list方法已实现，调用链完整
- [ ] CI工作流移除test步骤，保留lint+type-check（D-01覆盖ENG-01）
- [ ] EmptyState组件已创建并导出（集成工作归属Phase 3 COMP-03）
- [ ] 所有类型检查通过
</success_criteria>

<output>
完成验收后，创建 `.planning/phases/01-engineering-infrastructure/01-01-SUMMARY.md`
</output>
