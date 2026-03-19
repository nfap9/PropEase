---
status: testing
phase: 04-tenant-web-header-sider-main
source:
  - 04-01-SUMMARY.md
  - phase-04-plan-02-SUMMARY.md
  - phase-04-plan-03-SUMMARY.md
started: 2026-03-19T14:25:00Z
updated: 2026-03-19T14:25:00Z
---

## Current Test

number: 2
name: Login page accessible without auth
expected: |
  Visiting /login or /(auth)/login directly shows the login form without being redirected to another page.
awaiting: user response

## Tests

### 1. Mobile nav uses Menu icon
expected: On mobile view, tapping the menu button (top-left) opens the navigation Sheet. The icon should be a hamburger/Menu icon, not a Bell icon.
result: skipped
reason: 当前阶段不考虑移动端代码

### 2. Login page accessible without auth
expected: Visiting /login or /(auth)/login directly shows the login form without being redirected to another page.
result: [pending]

### 3. Dashboard redirects to login when unauthenticated
expected: Visiting /dashboard without being logged in redirects to the login page.
result: [pending]

### 4. Sidebar collapses to icon-only
expected: On desktop, clicking the collapse button (or pressing Ctrl/Cmd+B) reduces the sidebar to icons only. Hovering over an icon shows a tooltip with the navigation label.
result: [pending]

### 5. Sidebar expands to show labels
expected: On desktop, clicking the expand button restores the sidebar to show full text labels alongside icons.
result: [pending]

### 6. Active route highlighted in sidebar
expected: When on a navigation page (e.g., /apartments), the sidebar shows that item as active/highlighted.
result: [pending]

### 7. Login page gradient background
expected: Login page has a subtle gradient background (light gray/white diagonal gradient), not a solid muted color.
result: [pending]

### 8. Login page enhanced card shadow
expected: Login card has a refined shadow (shadow-xl shadow-gray-200/50), not the default card shadow.
result: [pending]

### 9. Register page gradient background
expected: Register page has the same subtle gradient background as the login page.
result: [pending]

### 10. Register page enhanced card shadow
expected: Register card has the same refined shadow as the login card.
result: [pending]

## Summary

total: 10
passed: 0
issues: 0
pending: 9
skipped: 1

## Gaps

[none yet]
