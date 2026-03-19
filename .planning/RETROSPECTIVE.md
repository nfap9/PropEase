# Retrospective

## Cross-Milestone Trends

(Nothing recorded yet)

---

## Milestone: v1.0 MVP

**Shipped:** 2026-03-19
**Phases:** 5 | **Plans:** 12

### What Was Built

- Phase 01: Settings layout unified with breadcrumbs for all sub-pages
- Phase 02: Link fixes and icon consistency across settings pages
- Phase 03: /organizations page with dual-mode (create/select organization)
- Phase 04: Next.js route groups (auth/dashboard), collapsible sidebar with shadcn/ui, login/register visual refresh
- Phase 05: api-contract permissions SSOT, unified web-api-client, thin routes + fat controllers, pino structured logging

### What Worked

- Wave-based sequential execution kept context lean
- Thin route refactoring improved code maintainability
- Phase 04 route groups cleanly separated auth from dashboard concerns

### What Was Inefficient

- Verification was disabled during execution, leading to missing VERIFICATION.md for phases 1-4
- No REQUIREMENTS.md traceability maintained during development
- Phase 4 SUMMARY naming inconsistency (phase-04-plan-XX-SUMMARY.md vs 04-0X-SUMMARY.md)

### Patterns Established

- api-contract as single source of truth for shared code
- Thin routes + fat controllers for API maintainability
- pino for structured logging with request ID support

### Key Lessons

- Enabling verifier during execute-phase prevents retroactive documentation gaps
- REQUIREMENTS.md traceability needs to be maintained alongside development, not after
- Plan naming conventions should be enforced early (04-0X not phase-04-plan-XX)

### Cost Observations

- Model mix: primarily sonnet for execution
- Sessions: ~3 sessions for v1.0
- Notable: Process gaps (verification docs) were larger issue than code quality

---

## Milestone: v1.0 MVP (Extended with Phase 6)

**Shipped:** 2026-03-19
**Phases:** 6 | **Plans:** 13

### What Was Built

- Phase 01: Settings layout unified with breadcrumbs for all sub-pages
- Phase 02: Link fixes and icon consistency across settings pages
- Phase 03: /organizations page with dual-mode (create/select organization)
- Phase 04: Next.js route groups (auth/dashboard), collapsible sidebar with shadcn/ui, login/register visual refresh
- Phase 05: api-contract permissions SSOT, unified web-api-client, thin routes + fat controllers, pino structured logging
- Phase 06: Dashboard E2E test suite (8 Playwright tests covering page load, metrics, reminders, empty state)

### What Worked

- Wave-based sequential execution kept context lean
- Thin route refactoring improved code maintainability
- Phase 04 route groups cleanly separated auth from dashboard concerns
- E2E test data generator pattern provided clean test isolation

### What Was Inefficient

- Verification was disabled during execution, leading to missing VERIFICATION.md for phases 1-4
- No REQUIREMENTS.md traceability maintained during development
- Phase 4 SUMMARY naming inconsistency (phase-04-plan-XX-SUMMARY.md vs 04-0X-SUMMARY.md)
- No dedicated login/register E2E tests (auth flow tested indirectly)

### Patterns Established

- api-contract as single source of truth for shared code
- Thin routes + fat controllers for API maintainability
- pino for structured logging with request ID support
- Playwright E2E with data-testid, test data generator, try/finally cleanup

### Key Lessons

- Enabling verifier during execute-phase prevents retroactive documentation gaps
- REQUIREMENTS.md traceability needs to be maintained alongside development, not after
- Plan naming conventions should be enforced early (04-0X not phase-04-plan-XX)
- (dashboard) route group pattern unused — PermissionPageGuard on each page is the actual auth pattern

### Cost Observations

- Model mix: primarily sonnet for execution
- Sessions: 4 sessions total (phases 1-5 + phase 6)
- Notable: Tech debt is documentation/process, not code quality

---

