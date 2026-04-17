import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from '@/components/layout/providers';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout/main-layout';

// Auth pages
import LoginPage from '@/pages/auth/login';
import RegisterPage from '@/pages/auth/register';

// Dashboard pages
import DashboardPage from '@/pages/dashboard/index';

// Regular pages
import HomePage from '@/pages/index';

// Workspace pages
import ApartmentsPage from '@/pages/apartments/index';
import ApartmentNewPage from '@/pages/apartments/new';
import ApartmentDetailPage from '@/pages/apartments/[id]';
import RoomsPage from '@/pages/rooms/index';
import TenantsPage from '@/pages/tenants/index';
import TenantDetailPage from '@/pages/tenants/[id]';
import LeasesPage from '@/pages/leases/index';
import LeaseDetailPage from '@/pages/leases/[id]';
import BillsPage from '@/pages/bills/index';
import ReportsPage from '@/pages/reports/index';
import UtilitiesPage from '@/pages/utilities/index';
import UtilitiesHistoryPage from '@/pages/utilities/history';

// Organizations
import OrganizationsPage from '@/pages/organizations/index';
import OrganizationNewPage from '@/pages/organizations/new';

// Notifications
import NotificationsPage from '@/pages/notifications/index';

// Settings pages
import SettingsTeamPage from '@/pages/settings/team';
import SettingsTeamMembersPage from '@/pages/settings/team/members';
import SettingsPermissionsPage from '@/pages/settings/permissions';
import SettingsSubscriptionPage from '@/pages/settings/subscription/index';
import SettingsSubscriptionPurchasePage from '@/pages/settings/subscription/purchase';
import SettingsSubscriptionPayPage from '@/pages/settings/subscription/pay';
import SettingsSubscriptionResultPage from '@/pages/settings/subscription/result';

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-muted-foreground">加载中...</div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Auth routes (public) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes with sidebar */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Organization routes */}
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="organizations/new" element={<OrganizationNewPage />} />

              <Route index element={<HomePage />} />
              <Route path="workspace/dashboard" element={<DashboardPage />} />
              <Route path="workspace/notifications" element={<NotificationsPage />} />

              {/* Workspace routes */}
              <Route path="workspace/apartments" element={<ApartmentsPage />} />
              <Route path="workspace/apartments/new" element={<ApartmentNewPage />} />
              <Route path="workspace/apartments/:id" element={<ApartmentDetailPage />} />
              <Route path="workspace/rooms" element={<RoomsPage />} />
              <Route path="workspace/tenants" element={<TenantsPage />} />
              <Route path="workspace/tenants/:id" element={<TenantDetailPage />} />
              <Route path="workspace/leases" element={<LeasesPage />} />
              <Route path="workspace/leases/:id" element={<LeaseDetailPage />} />
              <Route path="workspace/bills" element={<BillsPage />} />
              <Route path="workspace/reports" element={<ReportsPage />} />
              <Route path="workspace/utilities" element={<UtilitiesPage />} />
              <Route path="workspace/utilities/history" element={<UtilitiesHistoryPage />} />

              {/* Team & Settings */}
              <Route path="workspace/team" element={<SettingsTeamPage />} />
              <Route path="workspace/team/members" element={<SettingsTeamMembersPage />} />
              <Route path="workspace/permissions" element={<SettingsPermissionsPage />} />
              <Route path="settings/permissions" element={<SettingsPermissionsPage />} />
              <Route path="settings/subscription" element={<SettingsSubscriptionPage />} />
              <Route path="settings/subscription/purchase" element={<SettingsSubscriptionPurchasePage />} />
              <Route path="settings/subscription/pay" element={<SettingsSubscriptionPayPage />} />
              <Route path="settings/subscription/result" element={<SettingsSubscriptionResultPage />} />
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
        </Suspense>
      </AppProviders>
    </BrowserRouter>
  );
}
