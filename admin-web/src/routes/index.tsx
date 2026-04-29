import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { AppProviders } from '@/components/layout/providers';

// Page components
import LoginPage from '@/pages/login/index';
import SetupPage from '@/pages/setup/index';
import DashboardPage from '@/pages/index';
import UsersPage from '@/pages/users/index';
import RegisteredUsersPage from '@/pages/registered-users/index';
import OrganizationsPage from '@/pages/organizations/index';
import OrganizationDetailPage from '@/pages/organizations/detail/index';
import BrandPage from '@/pages/brand/index';
import BillingPlansPage from '@/pages/billing/plans/index';
import BillingOrdersPage from '@/pages/billing/orders/index';
import BillingUsagePricingPage from '@/pages/billing/usage-pricing/index';

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
    <ProtectedRoute isAdmin>
      <AppLayout />
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/setup',
        element: <SetupPage />,
      },
      {
        element: <ProtectedRoutesLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'users',
            element: <UsersPage />,
          },
          {
            path: 'registered-users',
            element: <RegisteredUsersPage />,
          },
          {
            path: 'organizations',
            element: <OrganizationsPage />,
          },
          {
            path: 'organizations/:id',
            element: <OrganizationDetailPage />,
          },
          {
            path: 'brand',
            element: <BrandPage />,
          },
          {
            path: 'billing',
            element: <Navigate to="/billing/orders" replace />,
          },
          {
            path: 'billing/plans',
            element: <BillingPlansPage />,
          },
          {
            path: 'billing/orders',
            element: <BillingOrdersPage />,
          },
          {
            path: 'billing/usage-pricing',
            element: <BillingUsagePricingPage />,
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
], { basename: '/admin/' });
