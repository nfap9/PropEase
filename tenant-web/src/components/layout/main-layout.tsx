import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { SidebarProvider } from '@apartment-ultra/shared-ui/components/ui';
import { AppHeader } from './app-header';
import { WorkspaceLayout } from './workspace-layout';
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

  const showSidebar = organization && !isOrganizationPath(location.pathname);

  // If no organization is selected and not on an organization path, redirect to /organizations
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
            <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col px-4 py-5 md:px-6 md:py-6">
              {showSidebar ? (
                <WorkspaceLayout>
                  <Outlet />
                </WorkspaceLayout>
              ) : (
                <Outlet />
              )}
            </div>
          </main>
        </div>
      </NavProvider>
    </SidebarProvider>
  );
}
