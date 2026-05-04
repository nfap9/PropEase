import { Link } from 'react-router-dom';
import { Card, Tag } from 'antd';
import { AlertCircle, Zap, Clock } from 'lucide-react';
import { tenantMessages } from '@/i18n';

function RemindersCard({ missingReadings, pendingBills, overdueBills }: { missingReadings: number; pendingBills: number; overdueBills: number }) {
  const reminders = [
    {
      type: 'warning' as const,
      count: missingReadings,
      label: tenantMessages.dashboard.reminders.missingReading,
      href: '/utilities',
      icon: Zap,
    },
    {
      type: 'destructive' as const,
      count: 0,
      label: tenantMessages.dashboard.reminders.billingError,
      href: '/bills',
      icon: AlertCircle,
    },
    {
      type: 'warning' as const,
      count: pendingBills + overdueBills,
      label: tenantMessages.dashboard.reminders.pendingCollection,
      href: '/bills?status=overdue',
      icon: Clock,
    },
  ].filter((r) => r.count > 0);

  if (reminders.length === 0) {
    return (
      <Card className="flex h-full min-h-0 flex-col" styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}>
        <div className="shrink-0 pb-2">
          <h3 className="text-sm sm:text-base">{tenantMessages.dashboard.reminders.title}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="py-2 text-center text-xs sm:text-sm text-muted-foreground">暂无待处理事务</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col" styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%' } }}>
      <div className="shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base">{tenantMessages.dashboard.reminders.title}</h3>
          <Tag>{reminders.length}</Tag>
        </div>
      </div>
      <div className="flex-1 overflow-hidden space-y-1 pt-0">
        {reminders.map((reminder) => {
          const Icon = reminder.icon;
          return (
            <Link
              key={reminder.label}
              to={reminder.href}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-2 py-1.5 sm:px-3 sm:py-2 transition-all hover:bg-accent/50"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${reminder.type === 'destructive' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-medium truncate">{reminder.label}</span>
              </div>
              <Tag color={reminder.type === 'destructive' ? 'error' : 'warning'} className="px-1 text-[10px] sm:px-1.5 sm:text-xs">{reminder.count}</Tag>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

export { RemindersCard };
