/**
 * @deprecated Use AppShell from './app-shell' for route-level layout
 * This component is kept for backward compatibility with page content components
 * that still wrap their children in MainLayout.
 *
 * In the new architecture, AppShell provides layout at the route level via <Outlet />,
 * so page content components should NOT wrap themselves in MainLayout.
 */
export function MainLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * @deprecated Use AppShell from './app-shell' instead
 */
export function MainLayoutWithOutlet() {
  // This component is deprecated - use AppShell instead
  // AppShell is already used in the routes
  return null;
}
