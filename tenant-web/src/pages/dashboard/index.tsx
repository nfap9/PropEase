
import { useAuth } from '@/contexts/auth';
import { PermissionPageGuard } from '@/components/layout/permission-page-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { canAccessRule } from '@/utils/permission-access';
import { Loader2 } from 'lucide-react';
import { DashboardContent } from './components/dashboard-content';

export default function DashboardPage() {
  const { isLoading, organization } = useAuth();
  const { permissions, hasPermission } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canAccessDashboard = canAccessRule(
    { requiresOrganization: true, requireAnyPermission: true },
    {
      organization,
      permissions,
      hasPermission,
    }
  );

  return (
    <PermissionPageGuard>
      {canAccessDashboard ? <DashboardContent /> : null}
    </PermissionPageGuard>
  );
}
