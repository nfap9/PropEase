import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useIsMobile } from '@apartment-ultra/web-shared';
import { reportsApi } from '@/api/reports';
import { useAuth } from '@/contexts/auth';
import { useBrandConfig } from '@/contexts/brand-config';
import { tenantMessages } from '@/i18n';
import { MobileDashboardStats } from '@/components/layout/mobile-dashboard-stats';
import { QuickActions } from './quick-actions';
import { RoomStatusCard } from './room-status-card';
import { BillStatusCard } from './bill-status-card';
import { RemindersCard } from './reminders-card';
import { RevenueChartCard } from './revenue-chart-card';
import { DashboardSkeleton } from './dashboard-skeleton';

export function DashboardContent() {
  const { organization, organizations, isLoading: authLoading } = useAuth();
  const brandConfig = useBrandConfig();
  const orgId = organization?.id;
  const isMobile = useIsMobile();

  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview', orgId],
    queryFn: () => reportsApi.getOverview(),
    enabled: !!orgId,
  });

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center py-12">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">
          {tenantMessages.dashboard.noOrganizationsTitle.replace('{appName}', brandConfig.app_name)}
        </h2>
        <p className="mb-4 text-muted-foreground">{tenantMessages.dashboard.noOrganizationsDescription}</p>
        <Link to="/organizations/new" className="text-primary hover:underline">
          {tenantMessages.dashboard.createTeam}
        </Link>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center py-12">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">{tenantMessages.dashboard.selectTeamTitle}</h2>
        <p className="mb-4 text-muted-foreground">{tenantMessages.dashboard.selectTeamDescription}</p>
      </div>
    );
  }

  // 移动端布局
  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
        <QuickActions />
        <MobileDashboardStats />
      </div>
    );
  }

  // 桌面端布局
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <QuickActions />

      <div className="grid flex-1 gap-3 grid-cols-1 lg:grid-cols-2 min-h-0" style={{ minHeight: '200px' }}>
        <RoomStatusCard orgId={orgId} />
        <BillStatusCard orgId={orgId} />
      </div>

      <div className="grid flex-1 gap-3 grid-cols-1 lg:grid-cols-2 min-h-0" style={{ minHeight: '200px' }}>
        <RemindersCard
          missingReadings={overview?.rooms_missing_initial_readings || 0}
          pendingBills={overview?.pending_bills || 0}
          overdueBills={overview?.overdue_bills || 0}
        />
        <RevenueChartCard orgId={orgId} />
      </div>
    </div>
  );
}
