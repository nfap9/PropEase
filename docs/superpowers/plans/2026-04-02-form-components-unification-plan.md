# 表单组件统一实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一 tenant-web 和 admin-web 的表单组件来源，移除本地 `src/components/ui/` 副本，全部从 `@apartment-ultra/shared-ui` 导入

**Architecture:** 将 shared-ui 作为唯一的 UI 组件来源，tenant-web 和 admin-web 通过 workspace 引用 shared-ui

**Tech Stack:** shadcn/ui, Radix UI, react-hook-form, zod

---

## 任务概览

| 任务 | 描述 |
|------|------|
| 1 | 将 breadcrumb 组件添加到 shared-ui |
| 2 | 迁移 tenant-web 的组件引用到 shared-ui |
| 3 | 迁移 admin-web 的组件引用到 shared-ui |
| 4 | 删除 tenant-web 本地组件目录 |
| 5 | 删除 admin-web 本地组件目录 |

---

## Task 1: 将 breadcrumb 组件添加到 shared-ui

**shared-ui 已有:** switch ✅，但缺少 breadcrumb

**Files:**
- Create: `packages/shared-ui/src/components/ui/breadcrumb.tsx`
- Modify: `packages/shared-ui/src/components/ui/index.ts`

- [ ] **Step 1: 创建 breadcrumb 组件**

创建 `packages/shared-ui/src/components/ui/breadcrumb.tsx`:

```tsx
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../../lib/utils';

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<'nav'> & {
    separator?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <nav ref={ref} aria-label="breadcrumb" className={cn('w-full', className)} {...props} />
));
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<'ol'>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<'li'>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
));
BreadcrumbItem.displayName = 'BreadcrumbItem';

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & {
    asChild?: boolean;
  }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'a';
  return (
    <Comp
      ref={ref}
      className={cn('transition-colors hover:text-foreground', className)}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('font-normal text-foreground', className)}
    {...props}
  />
));
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'li'>) => (
  <li
    role="presentation"
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props}
  >
    {children}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'span'>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="3" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="13" cy="8" r="1.5" fill="currentColor" />
    </svg>
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
```

- [ ] **Step 2: 在 shared-ui index.ts 中导出 breadcrumb**

在 `packages/shared-ui/src/components/ui/index.ts` 添加:

```ts
export * from './breadcrumb';
```

- [ ] **Step 3: 提交**

```bash
git add packages/shared-ui/src/components/ui/breadcrumb.tsx packages/shared-ui/src/components/ui/index.ts
git commit -m "feat(shared-ui): add breadcrumb component"
```

---

## Task 2: 迁移 tenant-web 的组件引用到 shared-ui

**需要修改的文件（4个）:**

1. `tenant-web/src/app/settings/notifications/page.tsx` - 使用 Badge, Button, Card, Label, Skeleton, Switch, Tabs
2. `tenant-web/src/components/layout/settings-layout.tsx` - 使用 Breadcrumb
3. `tenant-web/src/components/ui/form.tsx` - 内部引用 Label
4. `tenant-web/src/components/ui/alert-dialog.tsx` - 内部引用 buttonVariants

**Files:**
- Modify: `tenant-web/src/app/settings/notifications/page.tsx:11-17`
- Modify: `tenant-web/src/components/layout/settings-layout.tsx:13`
- Modify: `tenant-web/src/components/ui/form.tsx:16`
- Modify: `tenant-web/src/components/ui/alert-dialog.tsx:7`

- [ ] **Step 1: 修改 notifications/page.tsx**

将:
```tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

改为:
```tsx
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Skeleton, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@apartment-ultra/shared-ui';
```

- [ ] **Step 2: 修改 settings-layout.tsx**

将:
```tsx
} from '@/components/ui/breadcrumb';
```

改为:
```tsx
} from '@apartment-ultra/shared-ui';
```

- [ ] **Step 3: 修改 form.tsx**

将:
```tsx
import { Label } from '@/components/ui/label';
```

改为:
```tsx
import { Label } from '@apartment-ultra/shared-ui';
```

- [ ] **Step 4: 修改 alert-dialog.tsx**

将:
```tsx
import { buttonVariants } from '@/components/ui/button';
```

改为:
```tsx
import { buttonVariants } from '@apartment-ultra/shared-ui';
```

- [ ] **Step 5: 提交**

```bash
git add tenant-web/src/app/settings/notifications/page.tsx tenant-web/src/components/layout/settings-layout.tsx tenant-web/src/components/ui/form.tsx tenant-web/src/components/ui/alert-dialog.tsx
git commit -m "refactor(tenant-web): migrate UI components to shared-ui"
```

---

## Task 3: 迁移 admin-web 的组件引用到 shared-ui

**需要修改的文件（2个）:**

1. `admin-web/src/components/ui/form.tsx` - 内部引用 Label
2. `admin-web/src/components/ui/alert-dialog.tsx` - 内部引用 buttonVariants

**Files:**
- Modify: `admin-web/src/components/ui/form.tsx:16`
- Modify: `admin-web/src/components/ui/alert-dialog.tsx:7`

- [ ] **Step 1: 修改 form.tsx**

将:
```tsx
import { Label } from '@/components/ui/label';
```

改为:
```tsx
import { Label } from '@apartment-ultra/shared-ui';
```

- [ ] **Step 2: 修改 alert-dialog.tsx**

将:
```tsx
import { buttonVariants } from '@/components/ui/button';
```

改为:
```tsx
import { buttonVariants } from '@apartment-ultra/shared-ui';
```

- [ ] **Step 3: 提交**

```bash
git add admin-web/src/components/ui/form.tsx admin-web/src/components/ui/alert-dialog.tsx
git commit -m "refactor(admin-web): migrate UI components to shared-ui"
```

---

## Task 4: 删除 tenant-web 本地组件目录

- [ ] **Step 1: 删除 tenant-web/src/components/ui 目录**

```bash
rm -rf tenant-web/src/components/ui
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "chore(tenant-web): remove local UI components, use shared-ui"
```

---

## Task 5: 删除 admin-web 本地组件目录

- [ ] **Step 1: 删除 admin-web/src/components/ui 目录**

```bash
rm -rf admin-web/src/components/ui
```

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "chore(admin-web): remove local UI components, use shared-ui"
```

---

## 验收

完成所有任务后:

1. `pnpm build` 应该成功（如果项目有构建步骤）
2. 表单组件（Label, Form, Switch, DatePicker 等）应正常工作
3. `required` 属性在所有项目中一致显示红色星号
4. 所有 UI 组件从 `@apartment-ultra/shared-ui` 导入
