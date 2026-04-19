import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { WorkspaceLayout } from '@/components/layout/workspace-layout';
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
import ApartmentDetailPage from '@/pages/apartments/detail';
import RoomsPage from '@/pages/rooms/index';
import TenantsPage from '@/pages/tenants/index';
import TenantDetailPage from '@/pages/tenants/detail';
import LeasesPage from '@/pages/leases/index';
import LeaseDetailPage from '@/pages/leases/detail';
import BillsPage from '@/pages/bills/index';
import ReportsPage from '@/pages/reports/index';
import UtilitiesPage from '@/pages/utilities/index';
import UtilitiesHistoryPage from '@/pages/utilities/history';
import NotificationsPage from '@/pages/notifications/index';
import SettingsTeamPage from '@/pages/settings/team';
import SettingsTeamMembersPage from '@/pages/settings/team/members';
import SettingsPermissionsPage from '@/pages/settings/permissions';
import SettingsSubscriptionPage from '@/pages/settings/subscription';
import SettingsSubscriptionPurchasePage from '@/pages/settings/subscription/purchase';
import SettingsSubscriptionPayPage from '@/pages/settings/subscription/pay';
import SettingsSubscriptionResultPage from '@/pages/settings/subscription/result';

// 公开路由
const publicRoutes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
];

// 工作空间路由（带布局）
const workspaceRoutes: RouteObject[] = [
  { index: true, element: <Navigate to="/workspace/dashboard" replace /> },
  { path: 'dashboard', element: <DashboardPage /> },
  { path: 'notifications', element: <NotificationsPage /> },
  { path: 'apartments', element: <ApartmentsPage /> },
  { path: 'apartments/new', element: <ApartmentNewPage /> },
  { path: 'apartments/:id', element: <ApartmentDetailPage /> },
  { path: 'rooms', element: <RoomsPage /> },
  { path: 'tenants', element: <TenantsPage /> },
  { path: 'tenants/:id', element: <TenantDetailPage /> },
  { path: 'leases', element: <LeasesPage /> },
  { path: 'leases/:id', element: <LeaseDetailPage /> },
  { path: 'bills', element: <BillsPage /> },
  { path: 'reports', element: <ReportsPage /> },
  { path: 'utilities', element: <UtilitiesPage /> },
  { path: 'utilities/history', element: <UtilitiesHistoryPage /> },
  { path: 'team', element: <SettingsTeamPage /> },
  { path: 'team/members', element: <SettingsTeamMembersPage /> },
  { path: 'permissions', element: <SettingsPermissionsPage /> },
  { path: 'subscription', element: <SettingsSubscriptionPage /> },
  { path: 'subscription/purchase', element: <SettingsSubscriptionPurchasePage /> },
  { path: 'subscription/pay', element: <SettingsSubscriptionPayPage /> },
  { path: 'subscription/result', element: <SettingsSubscriptionResultPage /> },
];

// 受保护的路由（含布局）
const protectedRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'organizations', element: <OrganizationsPage /> },
      { path: 'organizations/new', element: <OrganizationNewPage /> },
      {
        path: 'workspace/',
        element: <WorkspaceLayout />,
        children: [...workspaceRoutes],
      },
    ],
  },
];

export const router = createBrowserRouter([...publicRoutes, ...protectedRoutes, { path: '*', element: <NotFound /> }], { basename: '/tenant/' });
