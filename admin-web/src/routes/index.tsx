import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminLayout } from '@/components/layout/admin-layout';
import { AppProviders } from '@/components/layout/providers';

// Page components - lazy loaded for better code splitting
const LoginPage = React.lazy(() => import('@/pages/login/index').then(m => ({ default: m.default })));
const SetupPage = React.lazy(() => import('@/pages/setup/index').then(m => ({ default: m.default })));
const DashboardPage = React.lazy(() => import('@/pages/index').then(m => ({ default: m.default })));
const UsersPage = React.lazy(() => import('@/pages/users/index').then(m => ({ default: m.default })));
const RegisteredUsersPage = React.lazy(() => import('@/pages/registered-users/index').then(m => ({ default: m.default })));
const RolesPage = React.lazy(() => import('@/pages/roles/index').then(m => ({ default: m.default })));
const OrganizationsPage = React.lazy(() => import('@/pages/organizations/index').then(m => ({ default: m.default })));
const OrganizationDetailPage = React.lazy(() => import('@/pages/organizations/[id]/index').then(m => ({ default: m.default })));
const BrandPage = React.lazy(() => import('@/pages/brand/index').then(m => ({ default: m.default })));
const BillingPlansPage = React.lazy(() => import('@/pages/billing/plans/index').then(m => ({ default: m.default })));
const BillingOrdersPage = React.lazy(() => import('@/pages/billing/orders/index').then(m => ({ default: m.default })));
const BillingUsagePricingPage = React.lazy(() => import('@/pages/billing/usage-pricing/index').then(m => ({ default: m.default })));

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
      <AdminLayout />
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <React.Suspense fallback={<LoadingFallback />}><LoginPage /></React.Suspense>,
      },
      {
        path: '/setup',
        element: <React.Suspense fallback={<LoadingFallback />}><SetupPage /></React.Suspense>,
      },
      {
        element: <ProtectedRoutesLayout />,
        children: [
          {
            index: true,
            element: <React.Suspense fallback={<LoadingFallback />}><DashboardPage /></React.Suspense>,
          },
          {
            path: 'users',
            element: <React.Suspense fallback={<LoadingFallback />}><UsersPage /></React.Suspense>,
          },
          {
            path: 'registered-users',
            element: <React.Suspense fallback={<LoadingFallback />}><RegisteredUsersPage /></React.Suspense>,
          },
          {
            path: 'roles',
            element: <React.Suspense fallback={<LoadingFallback />}><RolesPage /></React.Suspense>,
          },
          {
            path: 'organizations',
            element: <React.Suspense fallback={<LoadingFallback />}><OrganizationsPage /></React.Suspense>,
          },
          {
            path: 'organizations/:id',
            element: <React.Suspense fallback={<LoadingFallback />}><OrganizationDetailPage /></React.Suspense>,
          },
          {
            path: 'brand',
            element: <React.Suspense fallback={<LoadingFallback />}><BrandPage /></React.Suspense>,
          },
          {
            path: 'billing',
            element: <Navigate to="/billing/orders" replace />,
          },
          {
            path: 'billing/plans',
            element: <React.Suspense fallback={<LoadingFallback />}><BillingPlansPage /></React.Suspense>,
          },
          {
            path: 'billing/orders',
            element: <React.Suspense fallback={<LoadingFallback />}><BillingOrdersPage /></React.Suspense>,
          },
          {
            path: 'billing/usage-pricing',
            element: <React.Suspense fallback={<LoadingFallback />}><BillingUsagePricingPage /></React.Suspense>,
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
