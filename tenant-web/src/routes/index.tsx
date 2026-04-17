import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { AppProviders } from '@/components/layout/providers';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout/main-layout';
import { NotFound } from '@/routes/not-found';

// 页面组件
import LoginPage from '@/pages/auth/login';
import RegisterPage from '@/pages/auth/register';
import HomePage from '@/pages/index';
import OrganizationsPage from '@/pages/organizations/index';
import OrganizationNewPage from '@/pages/organizations/new';
import DashboardPage from '@/pages/dashboard/index';
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
import NotificationsPage from '@/pages/notifications/index';
import SettingsTeamPage from '@/pages/settings/team';
import SettingsTeamMembersPage from '@/pages/settings/team/members';
import SettingsPermissionsPage from '@/pages/settings/permissions';
import SettingsSubscriptionPage from '@/pages/settings/subscription/index';
import SettingsSubscriptionPurchasePage from '@/pages/settings/subscription/purchase';
import SettingsSubscriptionPayPage from '@/pages/settings/subscription/pay';
import SettingsSubscriptionResultPage from '@/pages/settings/subscription/result';

// 公开路由
const publicRoutes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
];

// 工作空间路由
const workspaceRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/workspace/dashboard" replace /> },
  { path: 'workspace/dashboard', element: <DashboardPage /> },
  { path: 'workspace/notifications', element: <NotificationsPage /> },
  { path: 'workspace/apartments', element: <ApartmentsPage /> },
  { path: 'workspace/apartments/new', element: <ApartmentNewPage /> },
  { path: 'workspace/apartments/:id', element: <ApartmentDetailPage /> },
  { path: 'workspace/rooms', element: <RoomsPage /> },
  { path: 'workspace/tenants', element: <TenantsPage /> },
  { path: 'workspace/tenants/:id', element: <TenantDetailPage /> },
  { path: 'workspace/leases', element: <LeasesPage /> },
  { path: 'workspace/leases/:id', element: <LeaseDetailPage /> },
  { path: 'workspace/bills', element: <BillsPage /> },
  { path: 'workspace/reports', element: <ReportsPage /> },
  { path: 'workspace/utilities', element: <UtilitiesPage /> },
  { path: 'workspace/utilities/history', element: <UtilitiesHistoryPage /> },
  { path: 'workspace/team', element: <SettingsTeamPage /> },
  { path: 'workspace/team/members', element: <SettingsTeamMembersPage /> },
  { path: 'workspace/permissions', element: <SettingsPermissionsPage /> },
  { path: 'settings/permissions', element: <SettingsPermissionsPage /> },
  { path: 'settings/subscription', element: <SettingsSubscriptionPage /> },
  { path: 'settings/subscription/purchase', element: <SettingsSubscriptionPurchasePage /> },
  { path: 'settings/subscription/pay', element: <SettingsSubscriptionPayPage /> },
  { path: 'settings/subscription/result', element: <SettingsSubscriptionResultPage /> },
];

// 受保护的路由（含布局）
const protectedRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'organizations', element: <OrganizationsPage /> },
      { path: 'organizations/new', element: <OrganizationNewPage /> },
      ...workspaceRoutes,
    ],
  },
];

export const router = createBrowserRouter([...publicRoutes, ...protectedRoutes, { path: '*', element: <NotFound /> }]);
