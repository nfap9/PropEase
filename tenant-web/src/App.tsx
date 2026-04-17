import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProviders } from '@/components/layout/providers';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout/main-layout';

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-muted-foreground">加载中...</div>
  </div>
);

// Auth pages
const LoginPage = lazy(() => import('@/pages/auth/login').then(m => ({ default: m.default })));
const RegisterPage = lazy(() => import('@/pages/auth/register').then(m => ({ default: m.default })));

// Dashboard pages
const DashboardPage = lazy(() => import('@/pages/dashboard/index').then(m => ({ default: m.default })));

// Regular pages
const HomePage = lazy(() => import('@/pages/index').then(m => ({ default: m.default })));

// Workspace pages (apartment management workbench)
const ApartmentsPage = lazy(() => import('@/pages/apartments/index').then(m => ({ default: m.default })));
const ApartmentNewPage = lazy(() => import('@/pages/apartments/new').then(m => ({ default: m.default })));
const ApartmentDetailPage = lazy(() => import('@/pages/apartments/[id]').then(m => ({ default: m.default })));
const RoomsPage = lazy(() => import('@/pages/rooms/index').then(m => ({ default: m.default })));
const TenantsPage = lazy(() => import('@/pages/tenants/index').then(m => ({ default: m.default })));
const TenantDetailPage = lazy(() => import('@/pages/tenants/[id]').then(m => ({ default: m.default })));
const LeasesPage = lazy(() => import('@/pages/leases/index').then(m => ({ default: m.default })));
const LeaseDetailPage = lazy(() => import('@/pages/leases/[id]').then(m => ({ default: m.default })));
const BillsPage = lazy(() => import('@/pages/bills/index').then(m => ({ default: m.default })));
const ReportsPage = lazy(() => import('@/pages/reports/index').then(m => ({ default: m.default })));
const UtilitiesPage = lazy(() => import('@/pages/utilities/index').then(m => ({ default: m.default })));
const UtilitiesHistoryPage = lazy(() => import('@/pages/utilities/history').then(m => ({ default: m.default })));

// Organizations
const OrganizationsPage = lazy(() => import('@/pages/organizations/index').then(m => ({ default: m.default })));
const OrganizationNewPage = lazy(() => import('@/pages/organizations/new').then(m => ({ default: m.default })));

// Notifications
const NotificationsPage = lazy(() => import('@/pages/notifications/index').then(m => ({ default: m.default })));

// Settings pages
const SettingsTeamPage = lazy(() => import('@/pages/settings/team').then(m => ({ default: m.default })));
const SettingsTeamMembersPage = lazy(() => import('@/pages/settings/team/members').then(m => ({ default: m.default })));
const SettingsPermissionsPage = lazy(() => import('@/pages/settings/permissions').then(m => ({ default: m.default })));
const SettingsSubscriptionPage = lazy(() => import('@/pages/settings/subscription/index').then(m => ({ default: m.default })));
const SettingsSubscriptionPurchasePage = lazy(() => import('@/pages/settings/subscription/purchase').then(m => ({ default: m.default })));
const SettingsSubscriptionPayPage = lazy(() => import('@/pages/settings/subscription/pay').then(m => ({ default: m.default })));
const SettingsSubscriptionResultPage = lazy(() => import('@/pages/settings/subscription/result').then(m => ({ default: m.default })));

function PageLoader({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}

// Root layout that provides AppProviders
function RootLayout() {
  return (
    <AppProviders>
      <Routes>
        {/* Auth routes (public) */}
        <Route
          path="/login"
          element={<PageLoader><LoginPage /></PageLoader>}
        />
        <Route
          path="/register"
          element={<PageLoader><RegisterPage /></PageLoader>}
        />

        {/* Protected routes with sidebar (MainLayout) */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Organization routes */}
          <Route
            path="organizations"
            element={<PageLoader><OrganizationsPage /></PageLoader>}
          />
          <Route
            path="organizations/new"
            element={<PageLoader><OrganizationNewPage /></PageLoader>}
          />

          <Route index element={<PageLoader><HomePage /></PageLoader>} />
          <Route
            path="workspace/dashboard"
            element={<PageLoader><DashboardPage /></PageLoader>}
          />
          <Route
            path="workspace/notifications"
            element={<PageLoader><NotificationsPage /></PageLoader>}
          />

          {/* Workspace routes (apartment management workbench) */}
          <Route
            path="workspace/apartments"
            element={<PageLoader><ApartmentsPage /></PageLoader>}
          />
          <Route
            path="workspace/apartments/new"
            element={<PageLoader><ApartmentNewPage /></PageLoader>}
          />
          <Route
            path="workspace/apartments/:id"
            element={<PageLoader><ApartmentDetailPage /></PageLoader>}
          />
          <Route
            path="workspace/rooms"
            element={<PageLoader><RoomsPage /></PageLoader>}
          />
          <Route
            path="workspace/tenants"
            element={<PageLoader><TenantsPage /></PageLoader>}
          />
          <Route
            path="workspace/tenants/:id"
            element={<PageLoader><TenantDetailPage /></PageLoader>}
          />
          <Route
            path="workspace/leases"
            element={<PageLoader><LeasesPage /></PageLoader>}
          />
          <Route
            path="workspace/leases/:id"
            element={<PageLoader><LeaseDetailPage /></PageLoader>}
          />
          <Route
            path="workspace/bills"
            element={<PageLoader><BillsPage /></PageLoader>}
          />
          <Route
            path="workspace/reports"
            element={<PageLoader><ReportsPage /></PageLoader>}
          />
          <Route
            path="workspace/utilities"
            element={<PageLoader><UtilitiesPage /></PageLoader>}
          />
          <Route
            path="workspace/utilities/history"
            element={<PageLoader><UtilitiesHistoryPage /></PageLoader>}
          />

          {/* Team & Settings */}
          <Route
            path="workspace/team"
            element={<PageLoader><SettingsTeamPage /></PageLoader>}
          />
          <Route
            path="workspace/team/members"
            element={<PageLoader><SettingsTeamMembersPage /></PageLoader>}
          />
          <Route
            path="workspace/permissions"
            element={<PageLoader><SettingsPermissionsPage /></PageLoader>}
          />
          <Route
            path="settings/permissions"
            element={<PageLoader><SettingsPermissionsPage /></PageLoader>}
          />
          <Route
            path="settings/subscription"
            element={<PageLoader><SettingsSubscriptionPage /></PageLoader>}
          />
          <Route
            path="settings/subscription/purchase"
            element={<PageLoader><SettingsSubscriptionPurchasePage /></PageLoader>}
          />
          <Route
            path="settings/subscription/pay"
            element={<PageLoader><SettingsSubscriptionPayPage /></PageLoader>}
          />
          <Route
            path="settings/subscription/result"
            element={<PageLoader><SettingsSubscriptionResultPage /></PageLoader>}
          />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center">
              <div className="text-muted-foreground">404 - 页面不存在</div>
            </div>
          }
        />
      </Routes>
    </AppProviders>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RootLayout />
    </BrowserRouter>
  );
}
