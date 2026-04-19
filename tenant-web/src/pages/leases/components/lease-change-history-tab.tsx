
import { useLeaseChangeLogs } from '@/hooks/use-lease-operations';
import { LeaseChangeLogs } from './lease-change-logs';
import { Loader2 } from 'lucide-react';

interface LeaseChangeHistoryTabProps {
  leaseId: string;
  orgId: string;
}

export function LeaseChangeHistoryTab({ leaseId, orgId }: LeaseChangeHistoryTabProps) {
  const { data: logs, isLoading } = useLeaseChangeLogs(orgId, leaseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <LeaseChangeLogs logs={logs || []} />
    </div>
  );
}
