import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { AppShell } from '@/components/layout/app-shell';
import { AppProviders } from '@/components/layout/providers';

// Auth pages
const LoginPage = React.lazy(() => import('@/pages/auth/login').then(m => ({ default: m.default })));
const RegisterPage = React.lazy(() => import('@/pages/auth/register').then(m => ({ default: m.default })));

// Dashboard pages
const DashboardPage = React.lazy(() => import('@/pages/dashboard/index').then(m => ({ default: m.default })));

// Regular pages
const HomePage = React.lazy(() => import('@/pages/index').then(m => ({ default: m.default })));

// Workspace pages (apartment management workbench)
const ApartmentsPage = React.lazy(() => import('@/pages/apartments/index').then(m => ({ default: m.default })));
const ApartmentNewPage = React.lazy(() => import('@/pages/apartments/new').then(m => ({ default: m.default })));
const ApartmentDetailPage = React.lazy(() => import('@/pages/apartments/[id]').then(m => ({ default: m.default })));
const RoomsPage = React.lazy(() => import('@/pages/rooms/index').then(m => ({ default: m.default })));
const TenantsPage = React.lazy(() => import('@/pages/tenants/index').then(m => ({ default: m.default })));
const TenantDetailPage = React.lazy(() => import('@/pages/tenants/[id]').then(m => ({ default: m.default })));
const LeasesPage = React.lazy(() => import('@/pages/leases/index').then(m => ({ default: m.default })));
const LeaseDetailPage = React.lazy(() => import('@/pages/leases/[id]').then(m => ({ default: m.default })));
const BillsPage = React.lazy(() => import('@/pages/bills/index').then(m => ({ default: m.default })));
const ReportsPage = React.lazy(() => import('@/pages/reports/index').then(m => ({ default: m.default })));
const UtilitiesPage = React.lazy(() => import('@/pages/utilities/index').then(m => ({ default: m.default })));
const UtilitiesHistoryPage = React.lazy(() => import('@/pages/utilities/history').then(m => ({ default: m.default })));

// Organizations
const OrganizationsPage = React.lazy(() => import('@/pages/organizations/index').then(m => ({ default: m.default })));
const OrganizationNewPage = React.lazy(() => import('@/pages/organizations/new').then(m => ({ default: m.default })));

// Notifications
const NotificationsPage = React.lazy(() => import('@/pages/notifications/index').then(m => ({ default: m.default })));

// Settings pages
const SettingsTeamPage = React.lazy(() => import('@/pages/settings/team').then(m => ({ default: m.default })));
const SettingsTeamMembersPage = React.lazy(() => import('@/pages/settings/team/members').then(m => ({ default: m.default })));
const SettingsPermissionsPage = React.lazy(() => import('@/pages/settings/permissions').then(m => ({ default: m.default })));
const SettingsSubscriptionPage = React.lazy(() => import('@/pages/settings/subscription/index').then(m => ({ default: m.default })));
const SettingsSubscriptionPurchasePage = React.lazy(() => import('@/pages/settings/subscription/purchase').then(m => ({ default: m.default })));
const SettingsSubscriptionPayPage = React.lazy(() => import('@/pages/settings/subscription/pay').then(m => ({ default: m.default })));
const SettingsSubscriptionResultPage = React.lazy(() => import('@/pages/settings/subscription/result').then(m => ({ default: m.default })));

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-muted-foreground">加载中...</div>
  </div>
);

// Root layout that provides AppProviders and renders children via Outlet
function RootLayout() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}

// Wrapper for protected routes (MainLayout with AppShell)
function ProtectedRoutesLayout() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Auth routes (public)
      {
        path: '/login',
        element: <React.Suspense fallback={<LoadingFallback />}><LoginPage /></React.Suspense>,
      },
      {
        path: '/register',
        element: <React.Suspense fallback={<LoadingFallback />}><RegisterPage /></React.Suspense>,
      },

      // Protected routes with sidebar (AppShell)
      {
        element: <ProtectedRoutesLayout />,
        children: [
          // Organization routes (now handled by MainLayout based on org state)
          {
            path: 'organizations',
            element: <React.Suspense fallback={<LoadingFallback />}><OrganizationsPage /></React.Suspense>,
          },
          {
            path: 'organizations/new',
            element: <React.Suspense fallback={<LoadingFallback />}><OrganizationNewPage /></React.Suspense>,
          },

          {
            index: true,
            element: <React.Suspense fallback={<LoadingFallback />}><HomePage /></React.Suspense>,
          },
          {
            path: 'workspace/dashboard',
            element: <React.Suspense fallback={<LoadingFallback />}><DashboardPage /></React.Suspense>,
          },
          {
            path: 'workspace/notifications',
            element: <React.Suspense fallback={<LoadingFallback />}><NotificationsPage /></React.Suspense>,
          },

          // Workspace routes (apartment management workbench)
          {
            path: 'workspace/apartments',
            element: <React.Suspense fallback={<LoadingFallback />}><ApartmentsPage /></React.Suspense>,
          },
          {
            path: 'workspace/apartments/new',
            element: <React.Suspense fallback={<LoadingFallback />}><ApartmentNewPage /></React.Suspense>,
          },
          {
            path: 'workspace/apartments/:id',
            element: <React.Suspense fallback={<LoadingFallback />}><ApartmentDetailPage /></React.Suspense>,
          },
          {
            path: 'workspace/rooms',
            element: <React.Suspense fallback={<LoadingFallback />}><RoomsPage /></React.Suspense>,
          },
          {
            path: 'workspace/tenants',
            element: <React.Suspense fallback={<LoadingFallback />}><TenantsPage /></React.Suspense>,
          },
          {
            path: 'workspace/tenants/:id',
            element: <React.Suspense fallback={<LoadingFallback />}><TenantDetailPage /></React.Suspense>,
          },
          {
            path: 'workspace/leases',
            element: <React.Suspense fallback={<LoadingFallback />}><LeasesPage /></React.Suspense>,
          },
          {
            path: 'workspace/leases/:id',
            element: <React.Suspense fallback={<LoadingFallback />}><LeaseDetailPage /></React.Suspense>,
          },
          {
            path: 'workspace/bills',
            element: <React.Suspense fallback={<LoadingFallback />}><BillsPage /></React.Suspense>,
          },
          {
            path: 'workspace/reports',
            element: <React.Suspense fallback={<LoadingFallback />}><ReportsPage /></React.Suspense>,
          },
          {
            path: 'workspace/utilities',
            element: <React.Suspense fallback={<LoadingFallback />}><UtilitiesPage /></React.Suspense>,
          },
          {
            path: 'workspace/utilities/history',
            element: <React.Suspense fallback={<LoadingFallback />}><UtilitiesHistoryPage /></React.Suspense>,
          },

          // Workspace routes (apartment management workbench)
          {
            path: 'workspace/team',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsTeamPage /></React.Suspense>,
          },
          {
            path: 'workspace/team/members',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsTeamMembersPage /></React.Suspense>,
          },
          {
            path: 'workspace/permissions',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsPermissionsPage /></React.Suspense>,
          },
          {
            path: 'settings/permissions',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsPermissionsPage /></React.Suspense>,
          },
          {
            path: 'settings/subscription',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsSubscriptionPage /></React.Suspense>,
          },
          {
            path: 'settings/subscription/purchase',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsSubscriptionPurchasePage /></React.Suspense>,
          },
          {
            path: 'settings/subscription/pay',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsSubscriptionPayPage /></React.Suspense>,
          },
          {
            path: 'settings/subscription/result',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsSubscriptionResultPage /></React.Suspense>,
          },
        ],
      },
      {
        path: '*',
        element: (
          <div className="flex h-screen items-center justify-center">
            <div className="text-muted-foreground">404 - 页面不存在</div>
          </div>
        ),
      },
    ],
  },
]);
