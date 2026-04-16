import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayoutWithOutlet } from '@/components/layout/main-layout';
import { AppProviders } from '@/components/layout/providers';

// Auth pages
const LoginPage = React.lazy(() => import('@/pages/auth/login').then(m => ({ default: m.default })));
const RegisterPage = React.lazy(() => import('@/pages/auth/register').then(m => ({ default: m.default })));

// Dashboard pages
const DashboardPage = React.lazy(() => import('@/pages/dashboard/index').then(m => ({ default: m.default })));

// Regular pages
const HomePage = React.lazy(() => import('@/pages/index').then(m => ({ default: m.default })));
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
const OrganizationsPage = React.lazy(() => import('@/pages/organizations/index').then(m => ({ default: m.default })));
const OrganizationNewPage = React.lazy(() => import('@/pages/organizations/new').then(m => ({ default: m.default })));
const NotificationsPage = React.lazy(() => import('@/pages/notifications/index').then(m => ({ default: m.default })));
const SettingsPage = React.lazy(() => import('@/pages/settings/index').then(m => ({ default: m.default })));
const SettingsTeamPage = React.lazy(() => import('@/pages/settings/team').then(m => ({ default: m.default })));
const SettingsNotificationsPage = React.lazy(() => import('@/pages/settings/notifications').then(m => ({ default: m.default })));
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

// Wrapper for protected routes
function ProtectedRoutesLayout() {
  return (
    <ProtectedRoute>
      <MainLayoutWithOutlet />
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

      // Protected routes with MainLayout
      {
        element: <ProtectedRoutesLayout />,
        children: [
          {
            index: true,
            element: <React.Suspense fallback={<LoadingFallback />}><HomePage /></React.Suspense>,
          },
          {
            path: 'dashboard',
            element: <React.Suspense fallback={<LoadingFallback />}><DashboardPage /></React.Suspense>,
          },
          {
            path: 'apartments',
            element: <React.Suspense fallback={<LoadingFallback />}><ApartmentsPage /></React.Suspense>,
          },
          {
            path: 'apartments/new',
            element: <React.Suspense fallback={<LoadingFallback />}><ApartmentNewPage /></React.Suspense>,
          },
          {
            path: 'apartments/:id',
            element: <React.Suspense fallback={<LoadingFallback />}><ApartmentDetailPage /></React.Suspense>,
          },
          {
            path: 'rooms',
            element: <React.Suspense fallback={<LoadingFallback />}><RoomsPage /></React.Suspense>,
          },
          {
            path: 'tenants',
            element: <React.Suspense fallback={<LoadingFallback />}><TenantsPage /></React.Suspense>,
          },
          {
            path: 'tenants/:id',
            element: <React.Suspense fallback={<LoadingFallback />}><TenantDetailPage /></React.Suspense>,
          },
          {
            path: 'leases',
            element: <React.Suspense fallback={<LoadingFallback />}><LeasesPage /></React.Suspense>,
          },
          {
            path: 'leases/:id',
            element: <React.Suspense fallback={<LoadingFallback />}><LeaseDetailPage /></React.Suspense>,
          },
          {
            path: 'bills',
            element: <React.Suspense fallback={<LoadingFallback />}><BillsPage /></React.Suspense>,
          },
          {
            path: 'reports',
            element: <React.Suspense fallback={<LoadingFallback />}><ReportsPage /></React.Suspense>,
          },
          {
            path: 'utilities',
            element: <React.Suspense fallback={<LoadingFallback />}><UtilitiesPage /></React.Suspense>,
          },
          {
            path: 'utilities/history',
            element: <React.Suspense fallback={<LoadingFallback />}><UtilitiesHistoryPage /></React.Suspense>,
          },
          {
            path: 'organizations',
            element: <React.Suspense fallback={<LoadingFallback />}><OrganizationsPage /></React.Suspense>,
          },
          {
            path: 'organizations/new',
            element: <React.Suspense fallback={<LoadingFallback />}><OrganizationNewPage /></React.Suspense>,
          },
          {
            path: 'notifications',
            element: <React.Suspense fallback={<LoadingFallback />}><NotificationsPage /></React.Suspense>,
          },
          {
            path: 'settings',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsPage /></React.Suspense>,
          },
          {
            path: 'settings/team',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsTeamPage /></React.Suspense>,
          },
          {
            path: 'settings/notifications',
            element: <React.Suspense fallback={<LoadingFallback />}><SettingsNotificationsPage /></React.Suspense>,
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
