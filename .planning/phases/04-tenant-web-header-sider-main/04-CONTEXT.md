# Phase 4: tenant-web-header-sider-main - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Refine tenant-web frontend with: refreshed login/register pages, header+sider+main main layout with collapsible sidebar, and business module navigation. Phase 3 org selection flow is already complete and should integrate with the new layout.

</domain>

<decisions>
## Implementation Decisions

### Route Group Architecture
- Adopt `(auth)` / `(dashboard)` Next.js route groups
- `(dashboard)/layout.tsx` wraps all authenticated pages with MainLayout + AuthGuard
- `(auth)` route group contains login and register pages (no auth required)
- Migrate existing pages from component-level AuthGuard to route group layout

### Login/Register Visual Refresh
- Style: **Elegant minimal**
- Subtle gradient background, card shadows, refined input styling
- Keep centered card format (appropriate for unauthenticated pages)
- Focus on polish: spacing, typography, micro-interactions

### Sidebar Mode
- Adopt **shadcn/ui collapsible sidebar**
- Collapsed state: **icon-only** with tooltip on hover
- Expanded state: full text labels visible
- Migrate from current custom sidebar implementation

### Known Bug Fix (from research)
- **Mobile nav icon bug**: MainLayout line 76-78 uses `Bell` icon instead of `Menu` for Sheet trigger
- This is a known bug that will be fixed as part of Phase 4

### Layout Integration
- MainLayout with OrgSelector in header (from Phase 3) remains
- NavContent + NAV_ITEMS permission filtering remains
- AuthGuard handles loading states (no flash)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Layout Components
- `tenant-web/src/components/layout/main-layout.tsx` — MainLayout implementation (bug at line 76-78)
- `tenant-web/src/components/layout/nav-content.tsx` — Navigation content with permission filtering
- `tenant-web/src/components/layout/nav-config.ts` — NAV_ITEMS and SETTINGS_ITEMS configuration
- `tenant-web/src/components/layout/auth-guard.tsx` — Auth protection wrapper

### Existing Routes
- `tenant-web/src/app/login/page.tsx` — Current login page (to be refreshed)
- `tenant-web/src/app/register/page.tsx` — Current register page (to be refreshed)

### shadcn/ui
- `tenant-web/src/components/ui/sidebar.tsx` — Full shadcn/ui sidebar implementation (available for adoption)
- `tenant-web/src/components/ui/sheet.tsx` — Sheet component for mobile nav

### Auth Infrastructure
- `tenant-web/src/lib/auth/context.tsx` — AuthProvider + useAuth
- `tenant-web/src/lib/auth/redirect.ts` — Post-auth redirect logic

### Prior Phases
- Phase 1 CONTEXT: Card grid entry patterns, breadcrumb navigation
- Phase 2 CONTEXT: Settings icon decisions (ShoppingBag for subscription)
- Phase 3 CONTEXT: OrgSelector in header, /organizations page flow

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `MainLayout`: Already provides header+sider+main structure
- `NavContent`: Permission-based navigation filtering already works
- `OrgSelector`: Global org switching in header (Phase 3)
- shadcn/ui `sidebar.tsx`: Full collapsible implementation available
- `sonner`: Toast notifications for feedback

### Established Patterns
- Card grid layout for entry points (Phase 1 decision)
- Lucide-react icons throughout
- TanStack Query for data fetching
- Tailwind CSS for styling

### Integration Points
- Route group layout will wrap dashboard routes
- shadcn/ui sidebar needs to integrate with existing NavContent
- Login/register refresh should maintain centered card format
- Mobile Sheet for navigation (already in MainLayout)

</codebase_context>

<specifics>
## Specific Ideas

- "Elegant minimal" — subtle gradients, refined shadows, polished inputs
- Icon-only sidebar collapse — hover tooltip preview
- Bug fix: Bell→Menu icon in mobile nav Sheet trigger

</specifics>

<deferred>
## Deferred Ideas

- Multi-device org sync — future consideration
- Organization switching sidebar shortcut — could be added later

</deferred>

---

*Phase: 04-tenant-web-header-sider-main*
*Context gathered: 2026-03-19*
