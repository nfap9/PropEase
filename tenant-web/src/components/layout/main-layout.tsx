import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { SidebarProvider } from '@apartment-ultra/shared-ui/components/ui';
import { AppHeader } from './app-header';
import { useAuth } from '@/contexts/auth';
import { NavProvider } from './nav-context';

const ORGANIZATION_PATHS = ['/organizations', '/organizations/new'];

function isOrganizationPath(pathname: string) {
  return ORGANIZATION_PATHS.some((path) => pathname.startsWith(path));
}

export function MainLayout() {
  const { organization } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 如果没有选择组织则重定向到/organizations
  useEffect(() => {
    if (!organization && !isOrganizationPath(location.pathname)) {
      navigate('/organizations', { replace: true });
    }
  }, [organization, location.pathname, navigate]);

  return (
    <SidebarProvider>
      <NavProvider>
        <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden bg-transparent">
          <AppHeader />
          <main className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </NavProvider>
    </SidebarProvider>
  );
}
