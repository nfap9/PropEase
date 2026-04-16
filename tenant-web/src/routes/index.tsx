import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayoutWithOutlet } from '@/components/layout/main-layout';
import { AppProviders } from '@/components/layout/providers';

// Auth pages
const LoginPage = React.lazy(() => import('@/app/(auth)/login/page').then(m => ({ default: m.default })));
const RegisterPage = React.lazy(() => import('@/app/(auth)/register/page').then(m => ({ default: m.default })));

// Dashboard pages
const DashboardPage = React.lazy(() => import('@/app/(dashboard)/dashboard/page').then(m => ({ default: m.default })));

// Regular pages
const HomePage = React.lazy(() => import('@/app/page').then(m => ({ default: m.default })));
const ApartmentsPage = React.lazy(() => import('@/app/apartments/page').then(m => ({ default: m.default })));
const ApartmentNewPage = React.lazy(() => import('@/app/apartments/new/page').then(m => ({ default: m.default })));
const ApartmentDetailPage = React.lazy(() => import('@/app/apartments/[id]/page').then(m => ({ default: m.default })));
const RoomsPage = React.lazy(() => import('@/app/rooms/page').then(m => ({ default: m.default })));
const TenantsPage = React.lazy(() => import('@/app/tenants/page').then(m => ({ default: m.default })));
const TenantDetailPage = React.lazy(() => import('@/app/tenants/[id]/page').then(m => ({ default: m.default })));
const LeasesPage = React.lazy(() => import('@/app/leases/page').then(m => ({ default: m.default })));
const LeaseDetailPage = React.lazy(() => import('@/app/leases/[id]/page').then(m => ({ default: m.default })));
const BillsPage = React.lazy(() => import('@/app/bills/page').then(m => ({ default: m.default })));
const ReportsPage = React.lazy(() => import('@/app/reports/page').then(m => ({ default: m.default })));
const UtilitiesPage = React.lazy(() => import('@/app/utilities/page').then(m => ({ default: m.default })));
const UtilitiesHistoryPage = React.lazy(() => import('@/app/utilities/history/page').then(m => ({ default: m.default })));
const OrganizationsPage = React.lazy(() => import('@/app/organizations/page').then(m => ({ default: m.default })));
const OrganizationNewPage = React.lazy(() => import('@/app/organizations/new/page').then(m => ({ default: m.default })));
const NotificationsPage = React.lazy(() => import('@/app/notifications/page').then(m => ({ default: m.default })));
const SettingsPage = React.lazy(() => import('@/app/settings/page').then(m => ({ default: m.default })));
const SettingsTeamPage = React.lazy(() => import('@/app/settings/team/page').then(m => ({ default: m.default })));
const SettingsNotificationsPage = React.lazy(() => import('@/app/settings/notifications/page').then(m => ({ default: m.default })));
const SettingsPermissionsPage = React.lazy(() => import('@/app/settings/permissions/page').then(m => ({ default: m.default })));
const SettingsSubscriptionPage = React.lazy(() => import('@/app/settings/subscription/page').then(m => ({ default: m.default })));
const SettingsSubscriptionPurchasePage = React.lazy(() => import('@/app/settings/subscription/purchase/page').then(m => ({ default: m.default })));
const SettingsSubscriptionPayPage = React.lazy(() => import('@/app/settings/subscription/pay/page').then(m => ({ default: m.default })));
const SettingsSubscriptionResultPage = React.lazy(() => import('@/app/settings/subscription/result/page').then(m => ({ default: m.default })));

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
