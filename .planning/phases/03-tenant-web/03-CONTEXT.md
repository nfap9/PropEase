# Phase 3: tenant-web Organization View - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Organization selection/creation view — shown when user registers without an organization or has no locally saved organization selection. After selecting/creating, user enters apartment management for that org. This reorganizes frontend routing to unify the organization entry experience.

**Key flows:**
1. User with 0 orgs → sees creation form
2. User with multiple orgs but no local selection → sees selection list
3. Recently used org is auto-selected (no UI confirmation needed)
4. User can switch org via Settings page at any time

</domain>

<decisions>
## Implementation Decisions

### Multi-org Selection Flow
- Auto-select most recently used org (based on `localStorage.current_organization_id`)
- Update `current_organization_id` on every organization switch
- No UI confirmation when auto-selecting — seamless redirect
- Recently used is tracked per device via localStorage

### Single Page Dual Entry
- Single `/organizations` page with dynamic content switching
- 0 orgs → shows creation form
- Multiple orgs → shows organization card list
- NOT separate pages for create vs select
- After creating org → switch to selection list with new org highlighted
- Page uses PageTitle component for heading

### Organization Selection UI
- Card list format for organization selection (consistent with Phase 1/2 card patterns)
- Each card displays: organization name + notes (if any)
- Click card → directly enter that organization (no confirmation dialog)
- Recently used org marked with icon (Check or Building2 icon)
- Current org has visual indicator (icon)

### Empty State Welcome Message
- Welcome message: "欢迎使用！创建你的第一个组织开始管理公寓"
- Subtitle: "创建第一个组织后，你可以在此管理房源、租客、账单等"
- CTA button text: "创建第一个组织"
- Icon: Building2 (consistent with existing organization icon)

### Organization Creation Form
- Keep existing fields: `name` (required) + `notes` (optional)
- Label: "组织名称", placeholder "例如：星河公寓"
- Notes: textarea with 3 rows, placeholder "备注信息（选填）"
- No additional fields (name + notes only)

### Organization Switch Entry Point
- Add organization switch entry in Settings page
- Display format: current org name + "Switch" button
- Click "Switch" → redirect to /organizations page for selection
- After switching → show toast confirmation + redirect to dashboard

### Creating New Org When Org Exists
- Access via Settings → Organization switch area → "Create new org"
- Click → redirect to /organizations/new with creation form
- Uses existing /organizations/new page (already exists)

### Error Handling
- Load orgs failure: show error message + retry button
- Create org failure: show backend error message
- Submit button: show loading state with disabled
- Switch org success: show toast + redirect to dashboard

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth & Routing
- `tenant-web/src/lib/auth/redirect.ts` — getPostAuthRedirectPath, ORGANIZATION_ONBOARDING_PATH, DEFAULT_ORGANIZATION_HOME_PATH
- `tenant-web/src/lib/auth/context.tsx` — resolveCurrentOrganization, useAuth context

### Existing Organization Pages
- `tenant-web/src/app/organizations/new/page.tsx` — existing creation form (reference for form patterns)

### Settings Pages (for switch entry)
- `tenant-web/src/app/settings/page.tsx` — where to add organization switch entry
- `tenant-web/src/app/settings/team/page.tsx` — existing merged team/permissions page

### UI Patterns (from Phase 1/2)
- `tenant-web/src/components/layout/main-layout.tsx` — MainLayout component
- Phase 1 CONTEXT: card grid entry patterns, breadcrumb navigation
- Phase 2 CONTEXT: organization management is in admin-web only

### API
- `tenant-web/src/lib/api.ts` — organizationsApi methods

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `Card` components from shared-ui
- `Building2` icon from lucide-react (used in existing /organizations/new)
- `useAuth` hook from `@/lib/auth/context`
- `PageTitle` component pattern (to use for page heading)
- Toast notifications via `sonner`

### Established Patterns
- Card grid layout for entry points (Phase 1 decision)
- Click-to-navigate pattern for card lists
- useMutation for form submissions with loading/error states
- resolveCurrentOrganization already implements localStorage-based selection

### Integration Points
- Modify `/organizations/new/page.tsx` to become `/organizations` with selection list
- Add organization switch to Settings page
- Update `redirect.ts` getPostAuthRedirectPath if needed
- Update auth context setOrganization to update localStorage on switch

</codebase_context>

<specifics>
## Specific Ideas

- "Keep it seamless — users shouldn't notice they're selecting an org"
- "Building2 icon already used in existing page — keep consistent"
- "Toast confirmation after switch helps users understand what happened"

</specifics>

<deferred>
## Deferred Ideas

- Multi-device org sync (if user has multiple devices, org selection should sync) — future consideration
- Organization switching sidebar shortcut — could be added later

</deferred>

---

*Phase: 03-tenant-web*
*Context gathered: 2026-03-19*
