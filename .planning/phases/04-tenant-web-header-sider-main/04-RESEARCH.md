# Phase 04: tenant-web-header-sider-main - Research

**Researched:** 2026-03-19
**Domain:** Next.js 14 App Router SaaS dashboard layout + multi-tenant navigation
**Confidence:** HIGH (based on codebase analysis, verified with source code)

## Summary

Phase 04 involves refining the tenant-web frontend with: new registration/login page, header+sider+main main layout, and business module navigation. The core infrastructure already exists - `MainLayout` provides a functional header+sider+main structure, `NavContent` with `NAV_ITEMS` handles permission-based navigation, and auth guards are in place. The primary work is refinement rather than new implementation.

**Key finding:** The mobile Sheet trigger in `MainLayout` (line 76-78) uses a `Bell` icon instead of a `Menu` icon - this is a visible bug that should be fixed.

**Primary recommendation:** Leverage existing infrastructure (MainLayout, NavContent, AuthGuard) rather than building new components. Focus on bug fixes, UX refinements, and ensuring consistent layout application across all authenticated pages.

## Standard Stack

Based on project conventions (from `tenant-web/AGENTS.md` and `pnpm-workspace.yaml`):

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.35 | Framework | App Router with layout groups |
| TypeScript | ^5 | Language | strict mode, no any |
| Tailwind CSS | ^3.4.1 | Styling | Utility-first, shadcn/ui foundation |
| shadcn/ui | (via Radix) | UI components | Headless, accessible, customizable |
| TanStack Query | ^5.90.21 | Server state | Data fetching, caching, mutations |

### Layout-Specific
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dropdown-menu | ^2.1.16 | User menu | User dropdown in header |
| @radix-ui/react-dialog | ^1.1.15 | Mobile nav | Sheet component for mobile sidebar |
| @radix-ui/react-separator | ^1.1.8 | Dividers | Sidebar sections, header separator |
| next-themes | ^0.4.6 | Theme toggle | Dark/light mode support |
| lucide-react | ^0.575.0 | Icons | Navigation icons, UI icons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Hook Form | ^7.71.2 | Form handling | Login, register, settings forms |
| Zod | ^3.25.76 | Validation | Schema validation for forms |
| sonner | ^2.0.7 | Toast notifications | User feedback |
| class-variance-authority | ^0.7.1 | Component variants | Button, sidebar variants |
| clsx + tailwind-merge | ^2.1.1 + ^3.5.0 | Class merging | `cn()` utility |

**Note:** There is a full `sidebar.tsx` in `components/ui/` (shadcn/ui style), but `MainLayout` uses a simpler custom sidebar approach (div with flex-col). Both approaches are valid - the shadcn/ui sidebar offers more features (collapsible, multi-level menus) while the custom approach is lighter.

## Architecture Patterns

### Recommended Project Structure
```
tenant-web/src/
├── app/
│   ├── (auth)/              # Route group: unauthenticated pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/         # Route group: authenticated pages
│   │   ├── layout.tsx       # Dashboard layout with MainLayout
│   │   ├── dashboard/page.tsx
│   │   ├── apartments/page.tsx
│   │   └── ...
│   ├── organizations/       # Standalone - onboarding flow
│   ├── settings/            # Settings layout (nested under dashboard)
│   └── layout.tsx           # Root layout with Providers
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx  # Header + sidebar + main content
│   │   ├── nav-content.tsx  # Navigation menu content
│   │   ├── nav-config.ts    # NAV_ITEMS + SETTINGS_ITEMS
│   │   ├── auth-guard.tsx   # Auth protection wrapper
│   │   ├── settings-layout.tsx
│   │   └── providers.tsx
│   └── ui/                  # shadcn/ui components
└── lib/
    ├── auth/
    │   ├── context.tsx      # AuthProvider + useAuth
    │   └── redirect.ts      # Post-auth redirect logic
    └── permission-access.ts # canAccessRule function
```

### Pattern 1: Route Groups for Auth Separation

Next.js App Router route groups `(auth)` and `(dashboard)` cleanly separate public and authenticated routes:

```tsx
// app/(auth)/login/page.tsx - No auth required
// app/(dashboard)/layout.tsx - Wraps all authenticated pages with MainLayout
```

### Pattern 2: Layout Composition

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <PermissionPageGuard>
        <MainLayout>
          {children}
        </MainLayout>
      </PermissionPageGuard>
    </AuthGuard>
  )
}
```

### Pattern 3: Permission-Based Navigation

Navigation items are filtered based on user permissions via `canAccessRule`:

```tsx
// nav-config.ts
export const NAV_ITEMS: NavItem[] = [
  {
    href: '/apartments',
    label: '公寓管理',
    icon: Building2,
    requiresOrganization: true,
    permission: PERMISSIONS.APARTMENT_VIEW,
    id: 'apartments',
  },
  // ...
];

// nav-content.tsx
const visibleNavItems = NAV_ITEMS.filter((item) =>
  canAccessRule(item, { organization, permissions, isSuperAdmin, hasPermission })
);
```

### Pattern 4: Header with Org Selector

The header contains org switching via `OrgSelector` component, notifications bell, theme toggle, and user dropdown.

### Anti-Patterns to Avoid

1. **Don't wrap authenticated pages individually** - Use route group layout instead
2. **Don't hardcode navigation items** - Use `NAV_ITEMS` config with permission rules
3. **Don't create custom auth logic** - Use `AuthGuard` and `useAuth` hook
4. **Don't mix mobile and desktop nav** - Use Sheet component for mobile only

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|------------|-----|
| Authentication state | Custom context | `AuthProvider` + `useAuth` | Handles token storage, org resolution, logout |
| Auth protection | Custom redirect logic | `AuthGuard` component | Handles loading states, prevents flash |
| Permission checking | Custom if/else | `canAccessRule` function | Centralized, consistent rule definition |
| Navigation active state | Manual pathname comparison | `usePathname` with exact/prefix matching | Already implemented in NavContent |
| Responsive sidebar | Custom mobile menu | Sheet component | Built into MainLayout |

**Key insight:** The auth infrastructure is already sophisticated (token management, org resolution, refresh). Custom solutions would miss edge cases like "loading while checking auth" which causes flash of unauthenticated content.

## Common Pitfalls

### Pitfall 1: Mobile Nav Uses Bell Icon Instead of Menu

**What goes wrong:** In `MainLayout` line 76-78, the Sheet trigger for mobile navigation uses `<Bell>` icon instead of `<Menu>` icon.

**Why it happens:** Copy-paste error from notification button.

**How to avoid:** Use `Menu` icon for navigation sheet trigger, `Bell` for notifications only.

**Warning signs:**
```tsx
// WRONG - in mobile Sheet trigger
<SheetTrigger asChild>
  <Button variant="ghost" size="icon" className="lg:hidden">
    <Bell className="h-5 w-5" />  // This is NOT navigation!
  </Button>
</SheetTrigger>

// CORRECT
<SheetTrigger asChild>
  <Button variant="ghost" size="icon" className="lg:hidden">
    <Menu className="h-5 w-5" />
  </Button>
</SheetTrigger>
```

### Pitfall 2: Auth Loading Flash

**What goes wrong:** Brief flash of login page or protected content during auth check.

**Why it happens:** Race between auth check completing and router redirect.

**How to avoid:** `AuthGuard` handles this by rendering loading state until auth is resolved. Don't add additional redirects in page components.

### Pitfall 3: Navigation Active State Mismatch

**What goes wrong:** Active route highlighted incorrectly for nested routes.

**Why it happens:** Using exact match when prefix match is needed, or vice versa.

**How to avoid:** Use the `exact` property in `NavItem` for routes like `/utilities` that should not match `/utilities/history`:

```tsx
{ href: '/utilities', label: '水电录入', exact: true, ... }
{ href: '/utilities/history', label: '历史水电记录', ... }
```

### Pitfall 4: Settings Page Double Layout

**What goes wrong:** Settings pages wrapped by both `(dashboard)/layout.tsx` and `settings-layout.tsx`, causing nested `MainLayout`.

**Why it happens:** `SettingsLayout` already includes `MainLayout` internally.

**How to avoid:** Don't wrap settings pages with `MainLayout` - `SettingsLayout` handles it.

### Pitfall 5: Organization Selector in Header

**What goes wrong:** OrgSelector centered in header takes up space but is essential for multi-tenant UX.

**Why it matters:** Users need easy org switching when managing multiple properties.

**How to avoid:** Keep org selector in header as primary navigation element.

## Code Examples

### MainLayout Structure (Already Implemented)

```tsx
// components/layout/main-layout.tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-muted/40 lg:flex">
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4">
          {/* Mobile Sheet */}
          <Sheet>...</Sheet>

          {/* Org Selector */}
          <OrgSelector />

          {/* Right side: theme, notifications, user menu */}
          ...
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### NavContent with Permission Filtering

```tsx
// components/layout/nav-content.tsx
export function NavContent({ onNavClick }: NavContentProps) {
  const { organization } = useAuth();
  const { permissions, hasPermission, isSuperAdmin } = usePermissions();
  const pathname = usePathname();

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    canAccessRule(item, { organization, permissions, isSuperAdmin, hasPermission })
  );

  return (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard">{brandConfig.app_name}</Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return <NavLink key={item.href} item={item} isActive={isActive} />;
        })}
      </nav>
    </>
  );
}
```

### Dashboard Route Group Layout

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PermissionPageGuard>
        <MainLayout>{children}</MainLayout>
      </PermissionPageGuard>
    </AuthGuard>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual page auth checks | Route group with AuthGuard | Phase 01 | Consistent auth UX |
| Settings pages without layout | SettingsLayout with MainLayout | Phase 01 | Breadcrumb navigation |
| Org selection on settings page | Global org selector in header | Phase 03 | Always visible org context |
| Custom permission logic | canAccessRule + NAV_ITEMS config | Phase 01-03 | Centralized, declarative permissions |

**Deprecated/outdated:**
- Component-level AuthGuard wrapping (now should use route group)
- Inline permission checks in components (now use canAccessRule)

## Open Questions

1. **Route group migration needed?**
   - What we know: Current pages use `<AuthGuard>` wrapper individually
   - What's unclear: Whether migration to route groups `(auth)` and `(dashboard)` is worth the effort
   - Recommendation: Keep current approach (component-level AuthGuard) unless major refactoring is planned

2. **Should login/register use route group?**
   - What we know: Currently standalone pages at `/login` and `/register`
   - What's unclear: Whether they should be in a `(auth)` route group
   - Recommendation: Not critical - current standalone approach works fine

3. **shadcn/ui sidebar vs custom sidebar**
   - What we know: `components/ui/sidebar.tsx` is full shadcn/ui implementation, MainLayout uses simpler custom sidebar
   - What's unclear: Whether to adopt full shadcn/ui sidebar for features like collapsible icon-only mode
   - Recommendation: Keep current custom sidebar unless collapsible feature is needed

## Validation Architecture

> Skip - `workflow.nyquist_validation` is `false` in `.planning/config.json`

## Sources

### Primary (HIGH confidence - from codebase analysis)
- `tenant-web/src/components/layout/main-layout.tsx` - Current layout implementation
- `tenant-web/src/components/layout/nav-content.tsx` - Navigation with permissions
- `tenant-web/src/components/layout/nav-config.ts` - NAV_ITEMS configuration
- `tenant-web/src/lib/auth/context.tsx` - Auth infrastructure
- `tenant-web/src/components/layout/auth-guard.tsx` - Auth protection
- `tenant-web/src/app/login/page.tsx` - Login page implementation
- `tenant-web/src/app/register/page.tsx` - Register page implementation
- `pnpm-workspace.yaml` - Package versions catalog

### Secondary (MEDIUM confidence - from AGENTS.md conventions)
- `tenant-web/AGENTS.md` - Project conventions and standards
- Standard stack libraries (shadcn/ui, TanStack Query, etc.)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified from pnpm-workspace.yaml catalog
- Architecture: HIGH - Verified from working codebase
- Pitfalls: HIGH - Bug identified via code inspection (Bell vs Menu icon)

**Research date:** 2026-03-19
**Valid until:** 90 days (Next.js 14 App Router patterns stable)
